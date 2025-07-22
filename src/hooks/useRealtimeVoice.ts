
import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from '@/utils/RealtimeAudio';
import { Scenario } from '@/utils/scenarioPrompts';

interface RealtimeMessage {
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
  
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to convert base64 to Uint8Array
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const initializeAudioContext = async () => {
    try {
      console.log("Initializing audio context...");
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      audioQueueRef.current = new AudioQueue(audioContextRef.current);
      console.log("Audio context initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      throw new Error("Failed to initialize audio system");
    }
  };

  const connect = useCallback(async (scenario?: Scenario) => {
    try {
      setIsConnecting(true);
      setIsConnected(false);
      setConnectionError(null);
      setAiResponse('');
      setTranscript('');
      setCurrentScenario(scenario || null);
      
      // Initialize audio system
      await initializeAudioContext();

      // Connect to realtime WebSocket
      const wsUrl = `wss://xirbkztlbixvacekhzyv.functions.supabase.co/realtime-voice`;
      console.log('Connecting to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          console.error('Connection timeout');
          setConnectionError('Connection timeout after 15 seconds');
          wsRef.current?.close();
          setIsConnecting(false);
        }
      }, 15000);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected to Supabase edge function');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data: RealtimeMessage = JSON.parse(event.data);
          console.log('Received message:', data.type);

          switch (data.type) {
            case 'connection.established':
              console.log('OpenAI connection established');
              setIsConnected(true);
              setIsConnecting(false);
              setConnectionError(null);
              
              // If we have a scenario, send it after a brief delay
              if (scenario) {
                console.log('Starting scenario:', scenario.title);
                setTimeout(() => {
                  sendScenarioOpening(scenario);
                }, 1000);
              }
              break;

            case 'session.created':
              console.log('OpenAI session created');
              break;

            case 'session.updated':
              console.log('Session configuration updated');
              break;

            case 'input_audio_buffer.speech_started':
              console.log('User started speaking');
              setIsUserSpeaking(true);
              break;

            case 'input_audio_buffer.speech_stopped':
              console.log('User stopped speaking');
              setIsUserSpeaking(false);
              break;

            case 'conversation.item.input_audio_transcription.completed':
              if (data.transcript) {
                console.log('Received transcript:', data.transcript);
                setTranscript(data.transcript);
              }
              break;

            case 'response.audio.delta':
              if (data.delta && audioQueueRef.current) {
                try {
                  const audioData = base64ToUint8Array(data.delta);
                  await audioQueueRef.current.addToQueue(audioData);
                  setIsAISpeaking(true);
                } catch (audioError) {
                  console.error('Error processing audio delta:', audioError);
                }
              }
              break;

            case 'response.audio.done':
              console.log('AI finished speaking');
              setIsAISpeaking(false);
              break;

            case 'response.audio_transcript.delta':
              if (data.delta) {
                setAiResponse(prev => prev + data.delta);
              }
              break;

            case 'response.audio_transcript.done':
              console.log('AI transcript completed');
              break;

            case 'response.created':
              console.log('AI response started');
              setAiResponse('');
              break;

            case 'response.done':
              console.log('AI response completed');
              break;

            case 'error':
              console.error('Realtime API error:', data.error);
              setConnectionError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
              setIsConnected(false);
              setIsConnecting(false);
              break;

            case 'connection.closed':
              console.log('OpenAI connection closed');
              setIsConnected(false);
              setIsConnecting(false);
              break;

            default:
              console.log('Unhandled message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
          setConnectionError('Message parsing error');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setIsConnected(false);
        setIsConnecting(false);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
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
      console.error('Error connecting to realtime voice:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  const sendScenarioOpening = useCallback((scenario: Scenario) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("Cannot send scenario opening - WebSocket not connected");
      return;
    }

    console.log("Sending scenario opening for:", scenario.title);
    
    // Send the scenario prompt as a system message
    const systemEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'system',
        content: [
          {
            type: 'text',
            text: scenario.prompt
          }
        ]
      }
    };

    // Send the opening message as an assistant message to trigger voice response
    const openingEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: scenario.openingMessage
          }
        ]
      }
    };

    wsRef.current.send(JSON.stringify(systemEvent));
    wsRef.current.send(JSON.stringify(openingEvent));
    wsRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  const startAudioCapture = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    try {
      console.log("Starting audio capture...");
      
      // Ensure audio context is available
      if (!audioContextRef.current) {
        await initializeAudioContext();
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
    } catch (error) {
      console.error('Error starting audio capture:', error);
      throw error;
    }
  }, []);

  const stopAudioCapture = useCallback(() => {
    if (recorderRef.current) {
      console.log("Stopping audio capture...");
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("Cannot send text message - WebSocket not connected");
      return;
    }

    console.log("Sending text message:", text);
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

  const disconnect = useCallback(() => {
    console.log("Disconnecting...");
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
    
    setIsConnected(false);
    setIsConnecting(false);
    setIsRecording(false);
    setIsAISpeaking(false);
    setIsUserSpeaking(false);
    setTranscript('');
    setAiResponse('');
    setCurrentScenario(null);
    setConnectionError(null);
  }, [stopAudioCapture]);

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
    connect,
    startAudioCapture,
    stopAudioCapture,
    sendTextMessage,
    disconnect
  };
};
