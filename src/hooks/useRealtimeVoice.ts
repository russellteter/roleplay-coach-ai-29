
import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from '@/utils/RealtimeAudio';
import { audioDebugger } from '@/utils/AudioDebugger';
import { Scenario } from '@/utils/scenarioPrompts';

export interface RealtimeMessage {
  type: string;
  [key: string]: any;
}

export const useRealtimeVoice = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

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
      audioDebugger.log("Initializing audio context with user interaction...");
      
      // Create AudioContext with proper sample rate
      audioContextRef.current = new AudioContext({ 
        sampleRate: 24000,
        latencyHint: 'interactive'
      });
      
      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = 0.8; // Default volume
      
      audioDebugger.debugAudioContext(audioContextRef.current);
      
      // Resume audio context if suspended (required by browser security)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        audioDebugger.log("AudioContext resumed after user interaction");
      }
      
      // Initialize audio queue with gain node
      audioQueueRef.current = new AudioQueue(audioContextRef.current);
      audioQueueRef.current.setVolume(0.8);
      
      audioDebugger.log("Audio context initialized successfully with gain control");
    } catch (error) {
      audioDebugger.error("Failed to initialize audio context", error);
      throw new Error("Failed to initialize audio system");
    }
  };

  const connect = useCallback(async (scenario?: Scenario): Promise<void> => {
    try {
      audioDebugger.log("Starting connection process...");
      setIsConnecting(true);
      setConnectionError(null);
      setAiResponse('');
      setTranscript('');
      
      // Set the selected scenario immediately
      if (scenario) {
        setSelectedScenario(scenario);
        setCurrentScenario(scenario);
        audioDebugger.log(`Selected scenario: ${scenario.title}`);
      }
      
      // Initialize audio system with user interaction
      await initializeAudioContext();

      // Connect to realtime WebSocket
      const wsUrl = `wss://xirbkztlbixvacekhzyv.functions.supabase.co/realtime-voice`;
      audioDebugger.log(`Connecting to: ${wsUrl}`);
      wsRef.current = new WebSocket(wsUrl);

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          audioDebugger.error('Connection timeout after 15 seconds');
          setConnectionError('Connection timeout after 15 seconds');
          if (wsRef.current) {
            wsRef.current.close();
          }
          setIsConnecting(false);
        }
      }, 15000);

      wsRef.current.onopen = () => {
        audioDebugger.log('WebSocket connected to Supabase edge function');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data: RealtimeMessage = JSON.parse(event.data);
          audioDebugger.log(`Received message: ${data.type}`);

          switch (data.type) {
            case 'connection.established':
              audioDebugger.log('OpenAI connection established');
              setIsConnected(true);
              setIsConnecting(false);
              setConnectionError(null);
              
              // Set current scenario and send opening if we have one
              if (selectedScenario) {
                audioDebugger.log(`Starting scenario: ${selectedScenario.title}`);
                setTimeout(() => {
                  sendScenarioOpening(selectedScenario);
                }, 1000);
              }
              break;

            case 'session.created':
              audioDebugger.log('OpenAI session created');
              break;

            case 'session.updated':
              audioDebugger.log('Session configuration updated');
              break;

            case 'input_audio_buffer.speech_started':
              audioDebugger.log('User started speaking');
              setIsUserSpeaking(true);
              break;

            case 'input_audio_buffer.speech_stopped':
              audioDebugger.log('User stopped speaking');
              setIsUserSpeaking(false);
              break;

            case 'conversation.item.input_audio_transcription.completed':
              if (data.transcript) {
                audioDebugger.log(`Received transcript: ${data.transcript}`);
                setTranscript(data.transcript);
              }
              break;

            case 'response.audio.delta':
              if (data.delta && audioQueueRef.current && audioContextRef.current) {
                try {
                  // Ensure audio context is running before playing audio
                  if (audioContextRef.current.state === 'suspended') {
                    await audioContextRef.current.resume();
                    audioDebugger.log("AudioContext resumed for audio playback");
                  }
                  
                  const audioData = base64ToUint8Array(data.delta);
                  audioDebugger.debugAudioData(audioData, 'Audio Delta');
                  await audioQueueRef.current.addToQueue(audioData);
                  setIsAISpeaking(true);
                } catch (audioError) {
                  audioDebugger.error('Error processing audio delta', audioError);
                }
              }
              break;

            case 'response.audio.done':
              audioDebugger.log('AI finished speaking');
              setIsAISpeaking(false);
              break;

            case 'response.audio_transcript.delta':
              if (data.delta) {
                setAiResponse(prev => prev + data.delta);
              }
              break;

            case 'response.audio_transcript.done':
              audioDebugger.log('AI transcript completed');
              break;

            case 'response.created':
              audioDebugger.log('AI response started');
              setAiResponse('');
              break;

            case 'response.done':
              audioDebugger.log('AI response completed');
              break;

            case 'error':
              audioDebugger.error('Realtime API error', data.error);
              const errorMessage = typeof data.error === 'object' && data.error.message 
                ? data.error.message 
                : typeof data.error === 'string' 
                ? data.error 
                : JSON.stringify(data.error);
              setConnectionError(errorMessage);
              setIsConnecting(false);
              break;

            case 'connection.closed':
              audioDebugger.log('OpenAI connection closed');
              setIsConnected(false);
              setIsConnecting(false);
              break;

            default:
              audioDebugger.log(`Unhandled message type: ${data.type}`);
          }
        } catch (error) {
          audioDebugger.error('Error parsing message', error);
          setConnectionError('Message parsing error');
        }
      };

      wsRef.current.onerror = (error) => {
        audioDebugger.error('WebSocket error', error);
        setConnectionError('WebSocket connection error');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setIsConnecting(false);
      };

      wsRef.current.onclose = (event) => {
        audioDebugger.log(`WebSocket closed: ${event.code} ${event.reason}`);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setIsConnected(false);
        setIsConnecting(false);
        setIsRecording(false);
        setIsAISpeaking(false);
        setIsUserSpeaking(false);
      };

    } catch (error) {
      audioDebugger.error('Error connecting to realtime voice', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, [selectedScenario]);

  const sendScenarioOpening = useCallback((scenario: Scenario) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      audioDebugger.log("Cannot send scenario opening - WebSocket not connected");
      return;
    }

    audioDebugger.log(`Sending scenario opening for: ${scenario.title}`);
    
    // Create the system instruction layer that overrides any step-by-step behavior
    const systemInstructionLayer = `CRITICAL OVERRIDE: You must immediately begin this roleplay scenario by speaking the provided opening message aloud as your very first response. Do not ask setup questions, do not gather information first, and do not say "How can I help you?" or similar phrases. 

ROLEPLAY INTRODUCTION PATTERN: Start by saying: "Hi there. This is a live role-play scenario designed to help you practice ${scenario.title}. In this exercise, I'll play the role of [your character from the scenario], and you'll play the role of [user's role from the scenario]. I'll describe the situation and then we'll begin. Just respond naturally as if this were a real conversation. If you have any quick questions before we begin, feel free to ask. Otherwise, I'll get us started now..."

After this introduction, immediately deliver your opening message and stay in character throughout the conversation.

SCENARIO DETAILS:
${scenario.prompt}`;

    // Send the enhanced system message with instruction override
    const systemEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'system',
        content: [
          {
            type: 'text',
            text: systemInstructionLayer
          }
        ]
      }
    };

    // Send user message requesting the roleplay to begin
    const userEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Please begin the roleplay scenario: ${scenario.title}. Start with the introduction pattern and then deliver your opening message: "${scenario.openingMessage}"`
          }
        ]
      }
    };

    wsRef.current.send(JSON.stringify(systemEvent));
    wsRef.current.send(JSON.stringify(userEvent));
    wsRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  const startAudioCapture = useCallback(async (): Promise<void> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    try {
      audioDebugger.log("Starting audio capture...");
      
      // Ensure audio context is available and resumed
      if (!audioContextRef.current) {
        await initializeAudioContext();
      } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        audioDebugger.log("AudioContext resumed for recording");
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
    audioDebugger.log("Disconnecting...");
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
    
    setIsConnected(false);
    setIsConnecting(false);
    setIsRecording(false);
    setIsAISpeaking(false);
    setIsUserSpeaking(false);
    setTranscript('');
    setAiResponse('');
    setCurrentScenario(null);
    setSelectedScenario(null);
    setConnectionError(null);
  }, [stopAudioCapture]);

  const retryConnection = useCallback(() => {
    if (selectedScenario) {
      audioDebugger.log(`Retrying connection with scenario: ${selectedScenario.title}`);
      connect(selectedScenario);
    } else {
      connect();
    }
  }, [selectedScenario, connect]);

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
    selectedScenario,
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
