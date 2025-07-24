import { useState, useRef, useCallback, useEffect, useReducer } from 'react';
import { v4 as generateUuid } from 'uuid';
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from '@/utils/RealtimeAudio';
import { audioDebugger } from '@/utils/AudioDebugger';
import { Scenario } from '@/utils/scenarioPrompts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type {
  ClientWebSocketEvent,
  OpenAIWebSocketEvent,
} from '@/types/realtimeEvents';

// Enhanced event mapping with new session.ready event
const EVENTS = {
  CONNECTION_ESTABLISHED: 'connection.established',
  SESSION_CREATED: 'session.created',
  SESSION_UPDATED: 'session.updated',
  SESSION_READY: 'session.ready',
  AUDIO_DELTA: 'response.audio.delta',
  AUDIO_DONE: 'response.audio.done',
  AUDIO_TRANSCRIPT_DELTA: 'response.audio_transcript.delta',
  SPEECH_STARTED: 'input_audio_buffer.speech_started',
  SPEECH_STOPPED: 'input_audio_buffer.speech_stopped',
  TRANSCRIPTION_COMPLETED: 'conversation.item.input_audio_transcription.completed',
  RESPONSE_CREATED: 'response.created',
  CONNECTION_CLOSED: 'connection.closed',
  HEARTBEAT: 'heartbeat',
  ERROR: 'error'
} as const;

// Enhanced connection state enum
enum ConnectionState {
  CLOSED = 'CLOSED',
  OPENING = 'OPENING',
  ESTABLISHING = 'ESTABLISHING',
  CONFIGURING = 'CONFIGURING',
  READY = 'READY',
  STARTED = 'STARTED',
  ERROR = 'ERROR'
}

// Enhanced state machine actions
type StateAction = 
  | { type: 'OPENING' }
  | { type: 'ESTABLISHING' }
  | { type: 'CONFIGURING' }
  | { type: 'READY' }
  | { type: 'STARTED' }
  | { type: 'ERROR'; error: string }
  | { type: 'CLOSED' }
  | { type: 'RETRY' };

interface ConnectionStateContext {
  state: ConnectionState;
  retryCount: number;
  lastError: string | null;
  sequenceId: number;
  connectionQuality: 'good' | 'poor' | 'unknown';
}

const initialState: ConnectionStateContext = {
  state: ConnectionState.CLOSED,
  retryCount: 0,
  lastError: null,
  sequenceId: 0,
  connectionQuality: 'unknown'
};

const maxRetries = 5;

// Enhanced state machine with better error handling
function connectionReducer(state: ConnectionStateContext, action: StateAction): ConnectionStateContext {
  const timestamp = new Date().toISOString();
  
  switch (action.type) {
    case 'OPENING':
      console.log(`🔄 [${timestamp}] STATE -> OPENING (sequence: ${state.sequenceId + 1})`);
      return { 
        ...state, 
        state: ConnectionState.OPENING, 
        sequenceId: state.sequenceId + 1,
        lastError: null,
        connectionQuality: 'unknown'
      };
      
    case 'ESTABLISHING':
      console.log(`🔗 [${timestamp}] STATE -> ESTABLISHING (sequence: ${state.sequenceId})`);
      return { ...state, state: ConnectionState.ESTABLISHING };
      
    case 'CONFIGURING':
      console.log(`⚙️ [${timestamp}] STATE -> CONFIGURING (sequence: ${state.sequenceId})`);
      return { ...state, state: ConnectionState.CONFIGURING };
      
    case 'READY':
      console.log(`✅ [${timestamp}] STATE -> READY (sequence: ${state.sequenceId})`);
      return { 
        ...state, 
        state: ConnectionState.READY, 
        retryCount: 0,
        connectionQuality: 'good'
      };
      
    case 'STARTED':
      console.log(`🎭 [${timestamp}] STATE -> STARTED (sequence: ${state.sequenceId})`);
      return { ...state, state: ConnectionState.STARTED };
      
    case 'ERROR':
      console.error(`❌ [${timestamp}] STATE -> ERROR: ${action.error}`);
      return { 
        ...state, 
        state: ConnectionState.ERROR, 
        lastError: action.error,
        connectionQuality: 'poor'
      };
      
    case 'CLOSED':
      console.log(`🔴 [${timestamp}] STATE -> CLOSED (sequence: ${state.sequenceId})`);
      return { ...state, state: ConnectionState.CLOSED };
      
    case 'RETRY':
      if (state.retryCount >= maxRetries) {
        console.error(`❌ [${timestamp}] Max retries exceeded (${maxRetries})`);
        return { ...state, state: ConnectionState.ERROR, lastError: 'Max retries exceeded' };
      }
      console.log(`🔄 [${timestamp}] RETRY attempt ${state.retryCount + 1}/${maxRetries}`);
      return { ...state, retryCount: state.retryCount + 1 };
      
    default:
      return state;
  }
}

export const useRealtimeVoice = () => {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(connectionReducer, initialState);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStable, setConnectionStable] = useState(false);
  
  // Enhanced derived states
  const isConnected = state.state === ConnectionState.READY || state.state === ConnectionState.STARTED;
  const isConnecting = state.state === ConnectionState.OPENING || 
                      state.state === ConnectionState.ESTABLISHING || 
                      state.state === ConnectionState.CONFIGURING;
  const isReadyToStart = state.state === ConnectionState.READY;
  const isScenarioStarted = state.state === ConnectionState.STARTED;
  const hasError = state.state === ConnectionState.ERROR;
  
  const streamRef = useRef<ReadableStreamDefaultReader | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const scenarioRef = useRef<Scenario | null>(null);
  const shouldReconnectRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced logging helper
  const logEvent = useCallback((direction: '▷' | '◁', event: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const sequenceInfo = `[seq:${state.sequenceId}][${state.state}]`;
    console.log(`${direction} [${timestamp}] ${sequenceInfo} ${event}`, data || '');
  }, [state.sequenceId, state.state]);

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
      logEvent('▷', 'AUDIO_INIT', 'Initializing audio context');
      
      audioContextRef.current = new AudioContext({ 
        sampleRate: 24000,
        latencyHint: 'interactive'
      });
      
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = 0.8;
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      audioQueueRef.current = new AudioQueue(audioContextRef.current);
      audioQueueRef.current.setVolume(0.8);
      
      logEvent('▷', 'AUDIO_INIT_SUCCESS', 'Audio context initialized');
    } catch (error) {
      logEvent('▷', 'AUDIO_INIT_ERROR', error);
      throw new Error("Failed to initialize audio system");
    }
  };

  // Enhanced health check
  const testEdgeFunctionHealth = async (): Promise<boolean> => {
    try {
      logEvent('▷', 'HEALTH_CHECK_START', 'Testing edge function health');
      
      const result = await supabase.functions.invoke('realtime-voice', {
        body: { action: 'health' }
      });
      
      console.log('🔍 [DEBUG] Health check response:', result);
      
      if (result.error) {
        console.error('🔍 [DEBUG] Supabase client error:', result.error);
        setConnectionError(`Supabase error: ${result.error.message}`);
        return false;
      }
      
      const { data } = result;
      
      if (data?.status === 'healthy' && data?.hasOpenAIKey === true) {
        console.log('🔍 [DEBUG] Health check SUCCESS');
        setConnectionError(null);
        return true;
      }
      
      if (data?.hasOpenAIKey === false) {
        console.error('🔍 [DEBUG] OpenAI API key missing');
        setConnectionError('OpenAI API key not configured in Supabase Edge Functions.');
        return false;
      }
      
      console.warn('🔍 [DEBUG] Unexpected health check response:', data);
      setConnectionError('Unexpected health check response format.');
      return false;
      
    } catch (error) {
      console.error('🔍 [DEBUG] Health check exception:', error);
      setConnectionError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Enhanced connection function using HTTP streaming
  const connect = useCallback(async (scenario?: Scenario, skipDispatch = false) => {
    try {
      logEvent('▷', 'CONNECTION_START', 'Starting streaming connection');
      
      if (!skipDispatch) {
        dispatch({ type: 'OPENING' });
      }
      
      setConnectionError(null);
      setConnectionStable(false);
      shouldReconnectRef.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      setAiResponse('');
      setTranscript('');
      
      // Set the scenario immediately
      if (scenario) {
        setCurrentScenario(scenario);
        scenarioRef.current = scenario;
        logEvent('▷', 'SCENARIO_SET', `Selected scenario: ${scenario.title}`);
      }
      
      // Test edge function health first
      const isHealthy = await testEdgeFunctionHealth();
      if (!isHealthy) {
        dispatch({ type: 'ERROR', error: 'Edge function health check failed' });
        return;
      }

      if (!import.meta.env.SUPABASE_PUBLISHABLE_KEY) {
        const msg = 'Supabase publishable key is missing in environment configuration.';
        setConnectionError(msg);
        toast({ title: 'Configuration Error', description: msg });
        dispatch({ type: 'ERROR', error: msg });
        return;
      }

      // Initialize audio system
      await initializeAudioContext();

      // Start HTTP streaming connection
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(
        `https://xirbkztlbixvacekhzyv.functions.supabase.co/realtime-voice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({ action: 'connect' }),
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logEvent('▷', 'STREAM_CONNECTED', 'HTTP streaming connection established');
      dispatch({ type: 'ESTABLISHING' });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream available');
      }

      streamRef.current = reader;

      // Process streaming data
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            logEvent('▷', 'STREAM_ENDED', 'Stream ended');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          
          // Process complete messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                await handleStreamMessage(data);
              } catch (error) {
                logEvent('▷', 'STREAM_PARSE_ERROR', error);
              }
            }
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          logEvent('▷', 'STREAM_ERROR', error);
          dispatch({ type: 'ERROR', error: 'Stream connection failed' });
        }
      }

    } catch (error) {
      console.error('🔍 [DEBUG] Connection error:', error);
      logEvent('▷', 'CONNECTION_ERROR', error);
      setConnectionError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      dispatch({ type: 'ERROR', error: 'Connection failed' });
    }
  }, [logEvent]);

  // Handle messages from the stream
  const handleStreamMessage = async (data: any) => {
    logEvent('▷', 'STREAM_MESSAGE', { type: data.type });

    switch (data.type) {
      case EVENTS.CONNECTION_ESTABLISHED:
        logEvent('▷', 'CONNECTION_ESTABLISHED', 'OpenAI connection established');
        setConnectionError(null);
        setConnectionStable(true);
        dispatch({ type: 'CONFIGURING' });
        break;

      case EVENTS.SESSION_CREATED:
        logEvent('▷', 'SESSION_CREATED', 'OpenAI session created');
        break;

      case EVENTS.SESSION_UPDATED:
        logEvent('▷', 'SESSION_UPDATED', 'Session configuration updated');
        break;

      case EVENTS.SESSION_READY:
        logEvent('▷', 'SESSION_READY', 'Session is ready for scenario start');
        dispatch({ type: 'READY' });
        setConnectionStable(true);
        break;

      case EVENTS.SPEECH_STARTED:
        logEvent('▷', 'SPEECH_STARTED', 'User started speaking');
        setIsUserSpeaking(true);
        break;

      case EVENTS.SPEECH_STOPPED:
        logEvent('▷', 'SPEECH_STOPPED', 'User stopped speaking');
        setIsUserSpeaking(false);
        break;

      case EVENTS.TRANSCRIPTION_COMPLETED:
        if (data.transcript) {
          logEvent('▷', 'TRANSCRIPTION_COMPLETED', `Transcript: ${data.transcript}`);
          setTranscript(data.transcript);
        }
        break;

      case EVENTS.AUDIO_DELTA:
        if (data.delta && audioQueueRef.current && audioContextRef.current) {
          try {
            if (!isAISpeaking) {
              logEvent('▷', 'FIRST_AUDIO_CHUNK', `${data.delta.length} bytes`);
            }
            
            if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
            }
            
            const audioData = base64ToUint8Array(data.delta);
            await audioQueueRef.current.addToQueue(audioData);
            setIsAISpeaking(true);
          } catch (audioError) {
            logEvent('▷', 'AUDIO_DELTA_ERROR', audioError);
          }
        }
        break;

      case EVENTS.AUDIO_DONE:
        logEvent('▷', 'AUDIO_DONE', 'AI finished speaking');
        setIsAISpeaking(false);
        break;

      case EVENTS.AUDIO_TRANSCRIPT_DELTA:
        if (data.delta) {
          if (!aiResponse) {
            logEvent('▷', 'FIRST_CHAT_TOKEN', data.delta);
          }
          setAiResponse(prev => prev + data.delta);
        }
        break;

      case EVENTS.RESPONSE_CREATED:
        logEvent('▷', 'RESPONSE_CREATED', 'AI response started');
        setAiResponse('');
        break;

      case EVENTS.ERROR:
        logEvent('▷', 'ERROR_RECEIVED', data.error);
        let errorMessage = 'Unknown error occurred';
        
        if (typeof data.error === 'object' && data.error !== null && 'message' in data.error) {
          errorMessage = (data.error as { message: string }).message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        }
        
        setConnectionError(`Connection Error: ${errorMessage}`);
        dispatch({ type: 'ERROR', error: errorMessage });
        break;

      case EVENTS.CONNECTION_CLOSED:
        logEvent('▷', 'CONNECTION_CLOSED', 'OpenAI connection closed');
        dispatch({ type: 'CLOSED' });
        setConnectionError('Connection was closed unexpectedly.');
        break;

      default:
        logEvent('▷', 'UNHANDLED_EVENT', `Unhandled message type: ${data.type}`);
    }
  };

  // Enhanced scenario start function
  const startScenario = useCallback(async () => {
    if (state.state !== ConnectionState.READY) {
      console.error('❌ START_SCENARIO_ERROR: Not in READY state', state.state);
      setConnectionError('Voice session not ready. Please wait for connection.');
      return;
    }

    if (!scenarioRef.current) {
      console.error('❌ START_SCENARIO_ERROR: No scenario selected');
      setConnectionError('No scenario selected. Please select a scenario first.');
      return;
    }

    const scenario = scenarioRef.current;
    
    try {
      logEvent('▷', 'MANUAL_START_SCENARIO', { 
        scenarioId: scenario.id, 
        promptLength: scenario.prompt?.length || 0,
        openingMessage: scenario.openingMessage 
      });

      // First, change the state to STARTED
      dispatch({ type: 'STARTED' });
      
      // Then immediately send the opening message to trigger AI response
      if (scenario.openingMessage) {
        logEvent('▷', 'CLIENT_MESSAGE_SENT', { message: scenario.openingMessage });
        
        const messageResponse = await fetch(
          `https://xirbkztlbixvacekhzyv.functions.supabase.co/realtime-voice`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify({
              action: 'message',
              role: 'user',
              message: scenario.openingMessage
            })
          }
        );

        if (!messageResponse.ok) {
          throw new Error(`Failed to send opening message: ${messageResponse.status}`);
        }

        logEvent('▷', 'OPENING_MESSAGE_SENT', { status: messageResponse.status });
      } else {
        console.warn('⚠️ No opening message available for scenario');
      }
      
    } catch (error) {
      console.error('❌ MANUAL_START_SCENARIO_ERROR:', error);
      setConnectionError('Failed to start scenario. Please try again.');
    }
  }, [state.state, logEvent]);

  const startAudioCapture = useCallback(async (): Promise<void> => {
    try {
      if (!audioContextRef.current) {
        await initializeAudioContext();
      } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      recorderRef.current = new AudioRecorder((audioData) => {
        // Audio capture logic - will be used for sending to streaming endpoint
        logEvent('▷', 'AUDIO_DATA_CAPTURED', `${audioData.length} samples`);
      });

      await recorderRef.current.start();
      setIsRecording(true);
      logEvent('▷', 'AUDIO_CAPTURE_SUCCESS', 'Audio capture started successfully');
    } catch (error) {
      logEvent('▷', 'AUDIO_CAPTURE_ERROR', error);
      throw error;
    }
  }, [logEvent]);

  const stopAudioCapture = useCallback(() => {
    if (recorderRef.current) {
      try {
        logEvent('▷', 'AUDIO_CAPTURE_STOP', 'Stopping audio capture');
        recorderRef.current.stop();
      } catch (error) {
        logEvent('▷', 'AUDIO_CAPTURE_STOP_ERROR', error);
      } finally {
        recorderRef.current = null;
        setIsRecording(false);
      }
    }
  }, [logEvent]);

  const sendTextMessage = useCallback((text: string) => {
    // Text messages will be sent through the HTTP streaming endpoint
    logEvent('▷', 'TEXT_MESSAGE_SEND', `Sending text message: ${text}`);
    // TODO: Implement text message sending through HTTP streaming
  }, [logEvent]);

  const setVolume = useCallback((volume: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
      logEvent('▷', 'VOLUME_CHANGED', `Volume set to ${volume}`);
    }
    if (audioQueueRef.current) {
      audioQueueRef.current.setVolume(volume);
    }
  }, [logEvent]);

  const disconnect = useCallback(() => {
    try {
      logEvent('▷', 'DISCONNECT_START', 'Disconnecting...');
      stopAudioCapture();
      shouldReconnectRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.cancel();
        streamRef.current = null;
      }
      
      if (audioQueueRef.current) {
        try {
          audioQueueRef.current.stop();
        } catch (error) {
          logEvent('▷', 'AUDIO_QUEUE_STOP_ERROR', error);
        }
        audioQueueRef.current = null;
      }
      
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (error) {
          logEvent('▷', 'AUDIO_CONTEXT_CLOSE_ERROR', error);
        }
        audioContextRef.current = null;
      }

      gainNodeRef.current = null;
      scenarioRef.current = null;
      
      dispatch({ type: 'CLOSED' });
      setIsRecording(false);
      setIsAISpeaking(false);
      setIsUserSpeaking(false);
      setTranscript('');
      setAiResponse('');
      setCurrentScenario(null);
      setConnectionError(null);
      setConnectionStable(false);
      
      logEvent('▷', 'DISCONNECT_SUCCESS', 'Disconnected successfully');
    } catch (error) {
      logEvent('▷', 'DISCONNECT_ERROR', error);
    }
  }, [stopAudioCapture, logEvent]);

  const retryConnection = useCallback(() => {
    logEvent('▷', 'RETRY_CONNECTION', 'User requested retry');
    if (currentScenario) {
      connect(currentScenario);
    } else {
      connect();
    }
  }, [connect, currentScenario, logEvent]);

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
    connectionStable,
    hasError,
    audioContext: audioContextRef.current,
    isReadyToStart,
    isScenarioStarted,
    connectionQuality: state.connectionQuality,
    retryCount: state.retryCount,
    connect,
    startScenario,
    startAudioCapture,
    stopAudioCapture,
    sendTextMessage,
    setVolume,
    disconnect,
    retryConnection
  };
};
