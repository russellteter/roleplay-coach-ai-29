import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from '@/utils/RealtimeAudio';

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
  
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Helper function to convert base64 to Uint8Array
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setIsConnected(false);
      setAiResponse('');
      setTranscript('');
      
      // Initialize audio context and queue
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      audioQueueRef.current = new AudioQueue(audioContextRef.current);

      // Connect to realtime WebSocket - direct to Supabase edge function
      const wsUrl = `wss://xirbkztlbixvacekhzyv.functions.supabase.co/realtime-voice`;
      console.log('Connecting to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          console.error('Connection timeout');
          wsRef.current?.close();
          setIsConnecting(false);
          throw new Error('Connection timeout');
        }
      }, 15000);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected to Supabase edge function');
        clearTimeout(connectionTimeout);
        // Don't set connected yet - wait for OpenAI connection confirmation
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data: RealtimeMessage = JSON.parse(event.data);
          console.log('Received message:', data.type, data);

          switch (data.type) {
            case 'connection.established':
              console.log('OpenAI connection established');
              setIsConnected(true);
              setIsConnecting(false);
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
              setTranscript(data.transcript || '');
              break;

            case 'response.audio.delta':
              if (data.delta && audioQueueRef.current) {
                const audioData = base64ToUint8Array(data.delta);
                await audioQueueRef.current.addToQueue(audioData);
                setIsAISpeaking(true);
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
              console.log('Transcript completed');
              break;

            case 'input_audio_buffer.committed':
              console.log('Audio buffer committed');
              break;

            case 'response.created':
              console.log('Response started');
              setAiResponse('');
              break;

            case 'response.done':
              console.log('Response completed');
              break;

            case 'error':
              console.error('Realtime API error:', data.error);
              setIsConnected(false);
              setIsConnecting(false);
              throw new Error(data.error || 'Connection error');

            case 'connection.closed':
              console.log('OpenAI connection closed');
              setIsConnected(false);
              break;

            default:
              console.log('Unhandled message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        setIsConnecting(false);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        setIsConnecting(false);
        setIsRecording(false);
        setIsAISpeaking(false);
        setIsUserSpeaking(false);
      };

    } catch (error) {
      console.error('Error connecting to realtime voice:', error);
      setIsConnected(false);
      setIsConnecting(false);
      throw error;
    }
  }, []);

  const startAudioCapture = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    try {
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
    } catch (error) {
      console.error('Error starting audio capture:', error);
      throw error;
    }
  }, []);

  const stopAudioCapture = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    wsRef.current.send(JSON.stringify(event));
    wsRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  const disconnect = useCallback(() => {
    stopAudioCapture();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsConnected(false);
    setIsRecording(false);
    setIsAISpeaking(false);
    setTranscript('');
    setAiResponse('');
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
    connect,
    startAudioCapture,
    stopAudioCapture,
    sendTextMessage,
    disconnect
  };
};