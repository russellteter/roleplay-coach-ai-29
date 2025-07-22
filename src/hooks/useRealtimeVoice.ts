
import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from '@/utils/RealtimeAudio';
import { audioDebugger } from '@/utils/AudioDebugger';
import { Scenario } from '@/utils/scenarioPrompts';
import { supabase } from '@/integrations/supabase/client';

export interface RealtimeMessage {
  type: string;
  [key: string]: any;
}

// Simplified connection state enum
enum ConnectionState {
  CLOSED = 'CLOSED',
  OPENING = 'OPENING', 
  CONFIGURED = 'CONFIGURED',
  STARTED = 'STARTED'
}

export const useRealtimeVoice = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.CLOSED);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Derived states for backward compatibility
  const isConnected = connectionState === ConnectionState.CONFIGURED || connectionState === ConnectionState.STARTED;
  const isConnecting = connectionState === ConnectionState.OPENING;
  
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const scenarioRef = useRef<Scenario | null>(null);

  // Helper function to convert base64 to Uint8Array
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const initializeAudioContext = async (): Promise<void> => {
    try {
      audioDebugger.log("Initializing audio context...");
      
      // Create AudioContext with proper sample rate
      audioContextRef.current = new AudioContext({ 
        sampleRate: 24000,
        latencyHint: 'interactive'
      });
      
      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = 0.8; // Default volume
      
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Initialize audio queue
      audioQueueRef.current = new AudioQueue(audioContextRef.current);
      audioQueueRef.current.setVolume(0.8);
      
      audioDebugger.log("Audio context initialized successfully");
    } catch (error) {
      audioDebugger.error("Failed to initialize audio context", error);
      throw new Error("Failed to initialize audio system");
    }
  };

  // Promise-based message sending with acknowledgment
  const sendAndAwaitAck = useCallback((event: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      audioDebugger.log(`📤 Sending event: ${event.type}`);
      wsRef.current.send(JSON.stringify(event));
      
      // For most events, we resolve immediately since OpenAI doesn't send explicit acks
      // We'll use a small delay to ensure message is processed
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }, []);

  // Test edge function health before connecting
  const testEdgeFunctionHealth = async (): Promise<boolean> => {
    try {
      audioDebugger.log("🏥 Testing edge function health...");
      const { data, error } = await supabase.functions.invoke('realtime-voice', {
        body: { action: 'health' }
      });
      
      if (error) {
        audioDebugger.error("❌ Edge function health check failed", error);
        setConnectionError(`Edge function error: ${error.message}`);
        return false;
      }
      
      if (data) {
        audioDebugger.log("✅ Edge function health check passed", data);
        
        if (!data.hasOpenAIKey) {
          setConnectionError('OpenAI API key not configured in Supabase Edge Functions. Please add OPENAI_API_KEY to your secrets.');
          return false;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      audioDebugger.error("❌ Edge function health check error", error);
      setConnectionError('Cannot reach edge function. Please check your connection.');
      return false;
    }
  };

  const sendScenarioOpening = useCallback(async (scenario: Scenario) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      audioDebugger.log("❌ Cannot send scenario opening - WebSocket not connected");
      return;
    }

    try {
      audioDebugger.log(`🎭 Starting scenario opening sequence for: ${scenario.title}`);
      
      // Step 1: Send system message with clear instructions
      const systemEvent = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'system',
          content: [
            {
              type: 'text',
              text: `${scenario.prompt}

CRITICAL INSTRUCTION: You must immediately start speaking when this conversation begins. Do not wait for the user to speak first. Begin by saying exactly: "${scenario.openingMessage}"

Then explain the scenario and your role clearly. Be proactive and engaging. The user is expecting YOU to start the conversation immediately.`
            }
          ]
        }
      };

      await sendAndAwaitAck(systemEvent);
      audioDebugger.log("✅ System message sent and acknowledged");

      // Step 2: Send trigger message
      const triggerEvent = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please start the ${scenario.title} roleplay scenario now. Begin speaking immediately with your opening message.`
            }
          ]
        }
      };

      await sendAndAwaitAck(triggerEvent);
      audioDebugger.log("✅ Trigger message sent and acknowledged");

      // Step 3: Request response
      const responseEvent = { type: 'response.create' };
      await sendAndAwaitAck(responseEvent);
      audioDebugger.log("✅ Response creation requested - AI should start speaking now!");

      setConnectionState(ConnectionState.STARTED);
      
    } catch (error) {
      audioDebugger.error("❌ Failed to send scenario opening", error);
      setConnectionError('Failed to start scenario. Please try again.');
    }
  }, [sendAndAwaitAck]);

  const connect = useCallback(async (scenario?: Scenario): Promise<void> => {
    try {
      audioDebugger.log("🚀 Starting connection process...");
      setConnectionState(ConnectionState.OPENING);
      setConnectionError(null);
      setAiResponse('');
      setTranscript('');
      
      // Set the scenario immediately
      if (scenario) {
        setCurrentScenario(scenario);
        scenarioRef.current = scenario;
        audioDebugger.log(`Selected scenario: ${scenario.title}`);
      }
      
      // Test edge function health first
      const isHealthy = await testEdgeFunctionHealth();
      if (!isHealthy) {
        setConnectionState(ConnectionState.CLOSED);
        return;
      }
      
      // Initialize audio system
      await initializeAudioContext();

      // Use the correct WebSocket URL for Supabase Edge Functions
      const wsUrl = `wss://xirbkztlbixvacekhzyv.functions.supabase.co/realtime-voice`;
      audioDebugger.log(`Connecting to: ${wsUrl}`);
      
      // Clear any existing connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      
      wsRef.current = new WebSocket(wsUrl);

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          audioDebugger.error(`Connection timeout after 20 seconds`);
          setConnectionError('Connection timeout. The server may be overloaded. Please try again.');
          if (wsRef.current) {
            wsRef.current.close();
          }
          setConnectionState(ConnectionState.CLOSED);
        }
      }, 20000);

      wsRef.current.onopen = () => {
        audioDebugger.log('🟢 WebSocket connected to Supabase edge function');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        retryCountRef.current = 0; // Reset retry count on successful connection
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data: RealtimeMessage = JSON.parse(event.data);
          audioDebugger.log(`📨 ▷ GOT EVENT: ${data.type}`);

          switch (data.type) {
            case 'connection.established':
              audioDebugger.log('✅ OpenAI connection established');
              // Don't set as connected yet, wait for session.update
              setConnectionError(null);
              break;

            case 'session.create':
              audioDebugger.log('⚙️ OpenAI session created');
              break;

            case 'session.update':
              audioDebugger.log('✅ Session configuration updated - READY FOR SCENARIO');
              setConnectionState(ConnectionState.CONFIGURED);
              
              // Automatically start scenario if we have one - use ref to avoid race condition
              if (scenarioRef.current) {
                audioDebugger.log(`🎭 Auto-starting scenario: ${scenarioRef.current.title}`);
                await sendScenarioOpening(scenarioRef.current);
              }
              break;

            case 'input_audio_buffer.speech_started':
              audioDebugger.log('🎤 User started speaking');
              setIsUserSpeaking(true);
              break;

            case 'input_audio_buffer.speech_stopped':
              audioDebugger.log('🤐 User stopped speaking');
              setIsUserSpeaking(false);
              break;

            case 'conversation.item.input_audio_transcription.completed':
              if (data.transcript) {
                audioDebugger.log(`📝 Received transcript: ${data.transcript}`);
                setTranscript(data.transcript);
              }
              break;

            case 'response.audio.delta':
              if (data.delta && audioQueueRef.current && audioContextRef.current) {
                try {
                  // Ensure audio context is running
                  if (audioContextRef.current.state === 'suspended') {
                    await audioContextRef.current.resume();
                  }
                  
                  const audioData = base64ToUint8Array(data.delta);
                  await audioQueueRef.current.addToQueue(audioData);
                  setIsAISpeaking(true);
                } catch (audioError) {
                  audioDebugger.error('Error processing audio delta', audioError);
                }
              }
              break;

            case 'response.audio.done':
              audioDebugger.log('🔇 AI finished speaking');
              setIsAISpeaking(false);
              break;

            case 'response.audio_transcript.delta':
              if (data.delta) {
                setAiResponse(prev => prev + data.delta);
              }
              break;

            case 'response.created':
              audioDebugger.log('🤖 AI response started');
              setAiResponse('');
              break;

            case 'error':
              audioDebugger.error('❌ Realtime API error', data.error);
              let errorMessage = 'Unknown error occurred';
              
              if (typeof data.error === 'object' && data.error.message) {
                errorMessage = data.error.message;
              } else if (typeof data.error === 'string') {
                errorMessage = data.error;
              }
              
              // Categorize errors for better user experience
              if (errorMessage.includes('rate_limit')) {
                setConnectionError('OpenAI API rate limit exceeded. Please wait a moment and try again.');
              } else if (errorMessage.includes('insufficient_quota')) {
                setConnectionError('OpenAI API quota exceeded. Please check your OpenAI account billing.');
              } else if (errorMessage.includes('invalid_api_key') || errorMessage.includes('API key')) {
                setConnectionError('Invalid OpenAI API key. Please check the configuration in your Supabase secrets.');
              } else if (errorMessage.includes('not configured')) {
                setConnectionError('OpenAI API key not configured. Please add OPENAI_API_KEY to your Supabase Edge Functions secrets.');
              } else {
                setConnectionError(`Connection Error: ${errorMessage}`);
              }
              setConnectionState(ConnectionState.CLOSED);
              break;

            case 'connection.closed':
              audioDebugger.log('🔴 OpenAI connection closed');
              setConnectionState(ConnectionState.CLOSED);
              setConnectionError('Connection was closed unexpectedly. Please try connecting again.');
              break;

            default:
              audioDebugger.log(`ℹ️ Unhandled message type: ${data.type}`);
          }
        } catch (error) {
          audioDebugger.error('❌ Error parsing message', error);
          setConnectionError('Invalid response from server. Please try again.');
        }
      };

      wsRef.current.onerror = (error) => {
        audioDebugger.error('❌ WebSocket error', error);
        setConnectionError('WebSocket connection failed. Please check your internet connection and try again.');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setConnectionState(ConnectionState.CLOSED);
      };

      wsRef.current.onclose = (event) => {
        audioDebugger.log(`🔴 WebSocket closed: ${event.code} ${event.reason}`);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        setConnectionState(ConnectionState.CLOSED);
        setIsRecording(false);
        setIsAISpeaking(false);
        setIsUserSpeaking(false);
        
        // Enhanced error messages based on close codes
        if (event.code === 1006) {
          setConnectionError('Connection failed unexpectedly. This may be due to server issues. Please try again.');
        } else if (event.code === 1000) {
          // Clean close, don't show error unless we weren't expecting it
          if (!connectionError) {
            setConnectionError(null);
          }
        } else if (event.code === 1001) {
          setConnectionError('Server is restarting. Please try again in a moment.');
        } else if (event.code === 1002) {
          setConnectionError('Protocol error. Please refresh the page and try again.');
        } else if (event.code === 1011) {
          setConnectionError('Server error occurred. Please check if OpenAI API key is configured properly.');
        } else {
          setConnectionError(`Connection closed (${event.code}). Please try again.`);
        }
      };

    } catch (error) {
      audioDebugger.error('❌ Error connecting to realtime voice', error);
      setConnectionError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      setConnectionState(ConnectionState.CLOSED);
    }
  }, [sendScenarioOpening, connectionState]);

  const startAudioCapture = useCallback(async (): Promise<void> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    try {
      audioDebugger.log("Starting audio capture...");
      
      if (!audioContextRef.current) {
        await initializeAudioContext();
      } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      recorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const encodedAudio = encodeAudioForAPI(audioData);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });

      await recorderRef.current.start();
      setIsRecording(true);
      audioDebugger.log("Audio capture started successfully");
    } catch (error) {
      audioDebugger.error('Error starting audio capture', error);
      throw error;
    }
  }, []);

  const stopAudioCapture = useCallback(() => {
    if (recorderRef.current) {
      audioDebugger.log("Stopping audio capture...");
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      audioDebugger.log("Cannot send text message - WebSocket not connected");
      return;
    }

    audioDebugger.log(`Sending text message: ${text}`);
    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'text',
            text
          }
        ]
      }
    };

    wsRef.current.send(JSON.stringify(event));
    wsRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
      audioDebugger.log(`Volume set to ${volume}`);
    }
    if (audioQueueRef.current) {
      audioQueueRef.current.setVolume(volume);
    }
  }, []);

  const disconnect = useCallback(() => {
    audioDebugger.log("🔌 Disconnecting...");
    stopAudioCapture();
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    if (audioQueueRef.current) {
      audioQueueRef.current.stop();
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    gainNodeRef.current = null;
    retryCountRef.current = 0;
    scenarioRef.current = null;
    
    setConnectionState(ConnectionState.CLOSED);
    setIsRecording(false);
    setIsAISpeaking(false);
    setIsUserSpeaking(false);
    setTranscript('');
    setAiResponse('');
    setCurrentScenario(null);
    setConnectionError(null);
  }, [stopAudioCapture]);

  const retryConnection = useCallback(() => {
    if (currentScenario) {
      audioDebugger.log(`🔄 Retrying connection with scenario: ${currentScenario.title}`);
      connect(currentScenario);
    } else {
      connect();
    }
  }, [currentScenario, connect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    isRecording,
    isAISpeaking,
    isUserSpeaking,
    transcript,
    aiResponse,
    currentScenario,
    connectionError,
    audioContext: audioContextRef.current,
    connect,
    startAudioCapture,
    stopAudioCapture,
    sendTextMessage,
    setVolume,
    disconnect,
    retryConnection
  };
};
