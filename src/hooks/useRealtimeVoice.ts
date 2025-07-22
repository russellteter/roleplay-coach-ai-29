import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from '@/utils/RealtimeAudio';

interface RealtimeMessage {
  type: string;
  [key: string]: any;
}

export const useRealtimeVoice = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const connect = useCallback(async () => {
    try {
      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      audioQueueRef.current = new AudioQueue(audioContextRef.current);

      // Connect to realtime WebSocket
      const wsUrl = `wss://xirbkztlbixvacekhzyv.functions.supabase.co/realtime-voice`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to realtime voice');
        setIsConnected(true);
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data: RealtimeMessage = JSON.parse(event.data);
          console.log('Received message:', data.type);

          switch (data.type) {
            case 'session.created':
              console.log('Session created successfully');
              break;

            case 'session.updated':
              console.log('Session updated successfully');
              break;

            case 'input_audio_buffer.speech_started':
              setIsRecording(true);
              break;

            case 'input_audio_buffer.speech_stopped':
              setIsRecording(false);
              break;

            case 'conversation.item.input_audio_transcription.completed':
              setTranscript(data.transcript || '');
              break;

            case 'response.audio.delta':
              if (data.delta && audioQueueRef.current) {
                // Convert base64 to Uint8Array
                const binaryString = atob(data.delta);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                await audioQueueRef.current.addToQueue(bytes);
                setIsAISpeaking(true);
              }
              break;

            case 'response.audio.done':
              setIsAISpeaking(false);
              break;

            case 'response.text.delta':
              setAiResponse(prev => prev + (data.delta || ''));
              break;

            case 'response.text.done':
              // Response text is complete
              break;

            case 'error':
              console.error('Realtime API error:', data.error);
              break;

            default:
              console.log('Unhandled message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        setIsRecording(false);
        setIsAISpeaking(false);
      };

    } catch (error) {
      console.error('Error connecting to realtime voice:', error);
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
    isRecording,
    isAISpeaking,
    transcript,
    aiResponse,
    connect,
    startAudioCapture,
    stopAudioCapture,
    sendTextMessage,
    disconnect
  };
};