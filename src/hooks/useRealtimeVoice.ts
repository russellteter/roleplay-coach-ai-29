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
  SESSION_READY: 'session.ready', // New event from Edge Function
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
  
  // Enhanced derived states - CRITICAL FIX
  const isConnected = state.state === ConnectionState.READY || state.state === ConnectionState.STARTED;
  const isConnecting = state.state === ConnectionState.OPENING || 
                      state.state === ConnectionState.ESTABLISHING || 
                      state.state === ConnectionState.CONFIGURING;
  const isReadyToStart = state.state === ConnectionState.READY;
  const isScenarioStarted = state.state === ConnectionState.STARTED;
  const hasError = state.state === ConnectionState.ERROR;
  
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const scenarioRef = useRef<Scenario | null>(null);
  const shouldReconnectRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionQualityRef = useRef<'good' | 'poor' | 'unknown'>('unknown');

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

  // CRITICAL DEBUG: Enhanced health check with comprehensive logging
  const testEdgeFunctionHealth = async (): Promise<boolean> => {
    try {
      logEvent('▷', 'HEALTH_CHECK_START', 'Testing edge function health');
      console.log('🔍 [DEBUG] Starting health check...');
      
      const healthCheckStartTime = Date.now();
      
      // Make the actual call to Supabase Edge Function
      console.log('🔍 [DEBUG] Calling supabase.functions.invoke...');
      const result = await supabase.functions.invoke('realtime-voice', {
        body: { action: 'health' }
      });
      
      const healthCheckDuration = Date.now() - healthCheckStartTime;
      console.log(`🔍 [DEBUG] Health check completed in ${healthCheckDuration}ms`);
      
      // Log the full response structure
      console.log('🔍 [DEBUG] Full health check response:', {
        data: result.data,
        error: result.error,
        status: result.status,
        statusText: result.statusText
      });
      
      // Check for Supabase client errors first
      if (result.error) {
        console.error('🔍 [DEBUG] Supabase client error:', result.error);
        logEvent('▷', 'HEALTH_CHECK_SUPABASE_ERROR', result.error);
        setConnectionError(`Supabase error: ${result.error.message}`);
        toast({
          title: "❌ Supabase Error", 
          description: `Failed to reach edge function: ${result.error.message}`,
          variant: "destructive"
        });
        return false;
      }
      
      // Check the actual response data
      const { data } = result;
      
      if (!data) {
        console.error('🔍 [DEBUG] No data received from health check');
        logEvent('▷', 'HEALTH_CHECK_NO_DATA', 'No data returned from health check');
        setConnectionError('No response data from health check');
        toast({
          title: "❌ No Response", 
          description: "Edge function returned no data",
          variant: "destructive"
        });
        return false;
      }
      
      console.log('🔍 [DEBUG] Health check data structure:', {
        hasOpenAIKey: data.hasOpenAIKey,
        status: data.status,
        message: data.message,
        timestamp: data.timestamp
      });
      
      // Check if the response indicates success
      if (data.status === 'healthy' && data.hasOpenAIKey === true) {
        console.log('🔍 [DEBUG] Health check SUCCESS - Edge function healthy with OpenAI key');
        logEvent('▷', 'HEALTH_CHECK_SUCCESS', 'Edge function healthy with OpenAI key');
        connectionQualityRef.current = 'good';
        setConnectionError(null);
        return true;
      }
      
      // Check if OpenAI key is missing
      if (data.hasOpenAIKey === false) {
        console.error('🔍 [DEBUG] OpenAI API key missing in Edge Function');
        logEvent('▷', 'HEALTH_CHECK_MISSING_KEY', 'OpenAI API key not configured');
        setConnectionError('OpenAI API key not configured in Supabase Edge Functions.');
        toast({
          title: "❌ Missing API Key", 
          description: "OpenAI API key not configured in Supabase Edge Functions. Please add OPENAI_API_KEY to your Supabase secrets.",
          variant: "destructive"
        });
        return false;
      }
      
      // Check for other error conditions
      if (data.error) {
        console.error('🔍 [DEBUG] Edge function returned error:', data.error);
        logEvent('▷', 'HEALTH_CHECK_EDGE_ERROR', data.error);
        setConnectionError(`Edge function error: ${data.error}`);
        toast({
          title: "❌ Edge Function Error", 
          description: `Edge function error: ${data.error}`,
          variant: "destructive"
        });
        return false;
      }
      
      // Unexpected response structure
      console.warn('🔍 [DEBUG] Unexpected health check response structure:', data);
      logEvent('▷', 'HEALTH_CHECK_UNEXPECTED', 'Unexpected response structure');
      setConnectionError('Unexpected health check response format.');
      toast({
        title: "❌ Health Check Failed", 
        description: "Unexpected response from health check. Check console for details.",
        variant: "destructive"
      });
      return false;
      
    } catch (error) {
      console.error('🔍 [DEBUG] Health check exception:', error);
      logEvent('▷', 'HEALTH_CHECK_EXCEPTION', error);
      
      // More detailed error information
      if (error instanceof Error) {
        console.error('🔍 [DEBUG] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        setConnectionError(`Connection failed: ${error.message}`);
        toast({
          title: "❌ Connection Failed", 
          description: `Cannot reach edge function: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.error('🔍 [DEBUG] Unknown error type:', typeof error, error);
        setConnectionError('Unknown connection error occurred');
        toast({
          title: "❌ Connection Failed", 
          description: "Unknown error occurred. Check console for details.",
          variant: "destructive"
        });
      }
      
      connectionQualityRef.current = 'poor';
      return false;
    }
  };

  // Enhanced heartbeat mechanism
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ 
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          }));
          logEvent('◁', 'HEARTBEAT_SENT', 'Heartbeat sent to edge function');
        } catch (error) {
          logEvent('▷', 'HEARTBEAT_ERROR', error);
          dispatch({ type: 'ERROR', error: 'Heartbeat failed' });
        }
      }
    }, 25000); // 25 second heartbeat
  }, [logEvent]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Enhanced scenario start function
  const startScenario = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('❌ START_SCENARIO_ERROR: WebSocket not connected');
      setConnectionError('WebSocket not connected. Please start voice session first.');
      return;
    }

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
      const requestId = generateUuid();
      logEvent('▷', 'MANUAL_START_SCENARIO', { 
        scenarioId: scenario.id, 
        requestId, 
        promptLength: scenario.prompt?.length || 0,
        openingMessage: scenario.openingMessage 
      });
      
      // Send system message with scenario prompt
      const systemMessage: ClientWebSocketEvent = {
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

      wsRef.current.send(JSON.stringify(systemMessage));
      
      // Send trigger message
      const triggerMessage: ClientWebSocketEvent = {
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

      wsRef.current.send(JSON.stringify(triggerMessage));
      
      // Request response
      const responseRequest: ClientWebSocketEvent = { type: 'response.create' };
      wsRef.current.send(JSON.stringify(responseRequest));

      dispatch({ type: 'STARTED' });
      
    } catch (error) {
      console.error('❌ MANUAL_START_SCENARIO_ERROR:', error);
      setConnectionError('Failed to start scenario. Please try again.');
    }
  }, [state.state, logEvent]);

  // Enhanced connection function with better error handling
  const connect = useCallback(async (scenario?: Scenario, skipDispatch = false) => {
    try {
      logEvent('▷', 'CONNECTION_START', 'Starting connection process');
      console.log('🔍 [DEBUG] === CONNECTION START ===');
      
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
      
      // Test edge function health first - CRITICAL DEBUG POINT
      console.log('🔍 [DEBUG] Testing edge function health...');
      const isHealthy = await testEdgeFunctionHealth();
      console.log('🔍 [DEBUG] Health check result:', isHealthy);
      
      if (!isHealthy) {
        console.error('🔍 [DEBUG] Health check failed - aborting connection');
        dispatch({ type: 'ERROR', error: 'Edge function health check failed' });
        return;
      }
      
      console.log('🔍 [DEBUG] Health check passed - proceeding with connection');
      
      // Initialize audio system
      await initializeAudioContext();

      // Enhanced WebSocket connection
      const wsUrl = `wss://xirbkztlbixvacekhzyv.functions.supabase.co/functions/v1/realtime-voice`;
      logEvent('▷', 'WEBSOCKET_CONNECTING', `Connecting to: ${wsUrl}`);
      
      wsRef.current = new WebSocket(wsUrl);

      // Connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        logEvent('▷', 'CONNECTION_TIMEOUT', 'Connection timeout after 30 seconds');
        setConnectionError('Connection timeout. Please try again.');
        dispatch({ type: 'ERROR', error: 'Connection timeout' });
        if (wsRef.current) {
          wsRef.current.close();
        }
      }, 30000);

      wsRef.current.onopen = () => {
        logEvent('▷', 'WEBSOCKET_CONNECTED', 'WebSocket connected');
        dispatch({ type: 'ESTABLISHING' });
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        startHeartbeat();
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data: OpenAIWebSocketEvent = JSON.parse(event.data) as OpenAIWebSocketEvent;
          logEvent('▷', 'EVENT_RECEIVED', { type: data.type });

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

            case EVENTS.HEARTBEAT:
              logEvent('▷', 'HEARTBEAT_RECEIVED', 'Heartbeat from edge function');
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
        } catch (error) {
          logEvent('▷', 'MESSAGE_PARSE_ERROR', error);
          setConnectionError('Invalid response from server.');
        }
      };

      wsRef.current.onerror = (error) => {
        logEvent('▷', 'WEBSOCKET_ERROR', error);
        setConnectionError('WebSocket connection failed.');
        dispatch({ type: 'ERROR', error: 'WebSocket connection failed' });
      };

      wsRef.current.onclose = (event) => {
        logEvent('▷', 'WEBSOCKET_CLOSED', `Code: ${event.code}, Reason: ${event.reason}`);
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        stopHeartbeat();
        dispatch({ type: 'CLOSED' });
        setIsRecording(false);
        setIsAISpeaking(false);
        setIsUserSpeaking(false);
        setConnectionStable(false);
        
        if (event.code !== 1000) {
          setConnectionError(`Connection closed unexpectedly (${event.code})`);
          scheduleReconnect('close');
        }
      };

    } catch (error) {
      console.error('🔍 [DEBUG] Connection error:', error);
      logEvent('▷', 'CONNECTION_ERROR', error);
      setConnectionError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      dispatch({ type: 'ERROR', error: 'Connection failed' });
    }
  }, [logEvent, startHeartbeat, stopHeartbeat]);

  const scheduleReconnect = useCallback((reason: string) => {
    if (!shouldReconnectRef.current || state.retryCount >= maxRetries) return;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = Math.min(1000 * Math.pow(2, state.retryCount), 30000);
    logEvent('▷', 'RECONNECT_SCHEDULED', `Reconnecting in ${delay}ms due to: ${reason}`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (shouldReconnectRef.current) {
        dispatch({ type: 'RETRY' });
        connect(currentScenario ?? undefined, true);
      }
    }, delay);
  }, [state.retryCount, currentScenario, logEvent, connect]);

  const startAudioCapture = useCallback(async (): Promise<void> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    try {
      logEvent('▷', 'AUDIO_CAPTURE_START', 'Starting audio capture');
      
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
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      logEvent('▷', 'TEXT_MESSAGE_ERROR', 'Cannot send text message - WebSocket not connected');
      return;
    }

    logEvent('◁', 'TEXT_MESSAGE_SEND', `Sending text message: ${text}`);
    const event: ClientWebSocketEvent = {
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
    const responseEvent: ClientWebSocketEvent = { type: 'response.create' };
    wsRef.current.send(JSON.stringify(responseEvent));
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
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      stopHeartbeat();
      
      if (audioQueueRef.current) {
        try {
          audioQueueRef.current.stop();
        } catch (error) {
          logEvent('▷', 'AUDIO_QUEUE_STOP_ERROR', error);
        }
        audioQueueRef.current = null;
      }
      
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (error) {
          logEvent('▷', 'WEBSOCKET_CLOSE_ERROR', error);
        }
        wsRef.current = null;
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
  }, [stopAudioCapture, stopHeartbeat, logEvent]);

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
