
import { useState, useRef, useCallback, useEffect, useReducer } from 'react';
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from '@/utils/RealtimeAudio';
import { audioDebugger } from '@/utils/AudioDebugger';
import { Scenario } from '@/utils/scenarioPrompts';
import { supabase } from '@/integrations/supabase/client';
import type {
  ClientWebSocketEvent,
  OpenAIWebSocketEvent,
} from '@/types/realtimeEvents';

// Phase 1: Event Standardization - CORRECTED MAPPINGS
const EVENTS = {
  CONNECTION_ESTABLISHED: 'connection.established',
  SESSION_CREATED: 'session.create',     // ⚡️ must match server
  SESSION_UPDATED: 'session.update',     // ⚡️ must match server
  AUDIO_DELTA: 'response.audio.delta',
  AUDIO_DONE: 'response.audio.done',
  AUDIO_TRANSCRIPT_DELTA: 'response.audio_transcript.delta',
  SPEECH_STARTED: 'input_audio_buffer.speech_started',
  SPEECH_STOPPED: 'input_audio_buffer.speech_stopped',
  TRANSCRIPTION_COMPLETED: 'conversation.item.input_audio_transcription.completed',
  RESPONSE_CREATED: 'response.created',
  CONNECTION_CLOSED: 'connection.closed',
  ERROR: 'error'
} as const;

// Connection state enum
enum ConnectionState {
  CLOSED = 'CLOSED',
  OPENING = 'OPENING',
  CONFIGURED = 'CONFIGURED',
  STARTED = 'STARTED'
}

// State machine actions
type StateAction = 
  | { type: 'OPENING' }
  | { type: 'CONFIGURED' }
  | { type: 'STARTED' }
  | { type: 'CLOSED' }
  | { type: 'RETRY' };

interface ConnectionStateContext {
  state: ConnectionState;
  retryCount: number;
  lastError: string | null;
  sequenceId: number;
}

const initialState: ConnectionStateContext = {
  state: ConnectionState.CLOSED,
  retryCount: 0,
  lastError: null,
  sequenceId: 0
};

const maxRetries = 3;

// Phase 2: State Machine Hardening
function connectionReducer(state: ConnectionStateContext, action: StateAction): ConnectionStateContext {
  const timestamp = new Date().toISOString();
  
  switch (action.type) {
    case 'OPENING':
      if (state.state !== ConnectionState.CLOSED) {
        console.warn(`⚠️ [${timestamp}] Invalid state transition: ${state.state} -> OPENING`);
        return state;
      }
      console.debug(`🔄 [${timestamp}] STATE -> OPENING (sequence: ${state.sequenceId + 1})`);
      return { 
        ...state, 
        state: ConnectionState.OPENING, 
        sequenceId: state.sequenceId + 1,
        lastError: null 
      };
      
    case 'CONFIGURED':
      if (state.state !== ConnectionState.OPENING) {
        console.warn(`⚠️ [${timestamp}] Invalid state transition: ${state.state} -> CONFIGURED`);
        return state;
      }
      console.debug(`✅ [${timestamp}] STATE -> CONFIGURED (sequence: ${state.sequenceId})`);
      return { ...state, state: ConnectionState.CONFIGURED, retryCount: 0 };
      
    case 'STARTED':
      if (state.state !== ConnectionState.CONFIGURED) {
        console.warn(`⚠️ [${timestamp}] Invalid state transition: ${state.state} -> STARTED`);
        return state;
      }
      console.debug(`🎭 [${timestamp}] STATE -> STARTED (sequence: ${state.sequenceId})`);
      return { ...state, state: ConnectionState.STARTED };
      
    case 'CLOSED':
      console.debug(`🔴 [${timestamp}] STATE -> CLOSED (sequence: ${state.sequenceId})`);
      return { ...state, state: ConnectionState.CLOSED };
      
    case 'RETRY':
      if (state.retryCount >= maxRetries) {
        console.error(`❌ [${timestamp}] Max retries exceeded (${maxRetries})`);
        return { ...state, state: ConnectionState.CLOSED };
      }
      console.debug(`🔄 [${timestamp}] RETRY attempt ${state.retryCount + 1}/${maxRetries}`);
      return { ...state, retryCount: state.retryCount + 1 };
      
    default:
      return state;
  }
}

export const useRealtimeVoice = () => {
  const [state, dispatch] = useReducer(connectionReducer, initialState);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [shouldStartScenario, setShouldStartScenario] = useState(false);
  
  // Derived states for backward compatibility
  const isConnected = state.state === ConnectionState.CONFIGURED || state.state === ConnectionState.STARTED;
  const isConnecting = state.state === ConnectionState.OPENING;
  
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const scenarioRef = useRef<Scenario | null>(null);
  const shouldReconnectRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [lastFailureTime, setLastFailureTime] = useState<number | null>(null);
  const healthCheckRef = useRef<NodeJS.Timeout | null>(null);
  const scenarioOpeningSentRef = useRef<boolean>(false);

  // Phase 1: Structured logging helper
  const logEvent = useCallback((direction: '▷' | '◁', event: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const sequenceInfo = `[seq:${state.sequenceId}]`;
    console.debug(`${direction} [${timestamp}] ${sequenceInfo} ${event}`, data || '');
  }, [state.sequenceId]);

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
      
      logEvent('▷', 'AUDIO_INIT_SUCCESS', 'Audio context initialized');
    } catch (error) {
      logEvent('▷', 'AUDIO_INIT_ERROR', error);
      throw new Error("Failed to initialize audio system");
    }
  };

  const sendAndAwaitResponse = useCallback((event: ClientWebSocketEvent, expectedResponseType?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const sequenceId = state.sequenceId;
      logEvent('◁', 'SEND_EVENT', { type: event.type, sequenceId });
      
      // Send the event
      wsRef.current.send(JSON.stringify(event));
      
      // If we're expecting a specific response, wait for it
      if (expectedResponseType) {
        const responseHandler = (messageEvent: MessageEvent) => {
          try {
            const data = JSON.parse(messageEvent.data);
            if (data.type === expectedResponseType) {
              wsRef.current?.removeEventListener('message', responseHandler);
              logEvent('▷', 'RESPONSE_RECEIVED', { type: expectedResponseType, sequenceId });
              resolve();
            }
          } catch (error) {
            // Continue listening for other messages
          }
        };
        
        wsRef.current.addEventListener('message', responseHandler);
        
        // Add timeout for safety
        setTimeout(() => {
          wsRef.current?.removeEventListener('message', responseHandler);
          reject(new Error(`Response timeout for ${expectedResponseType}`));
        }, 10000);
      } else {
        // For events that don't need a response, resolve immediately
        resolve();
      }
    });
  }, [state.sequenceId, logEvent]);

  const sendScenarioOpening = useCallback(async (scenario: Scenario) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      logEvent('▷', 'SCENARIO_OPENING_ERROR', 'WebSocket not connected');
      return;
    }

    try {
      logEvent('▷', 'SCENARIO_OPENING_START', `Starting scenario: ${scenario.title}`);
      
      // Step 1: Send system message with clear instructions
      const systemEvent: ClientWebSocketEvent = {
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

      await sendAndAwaitResponse(systemEvent);
      logEvent('▷', 'SCENARIO_SYSTEM_MESSAGE_SENT', 'System message sent');

      // Step 2: Send trigger message
      const triggerEvent: ClientWebSocketEvent = {
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

      await sendAndAwaitResponse(triggerEvent);
      logEvent('▷', 'SCENARIO_TRIGGER_SENT', 'Trigger message sent');

      // Step 3: Request response
      const responseEvent: ClientWebSocketEvent = { type: 'response.create' };
      await sendAndAwaitResponse(responseEvent, EVENTS.RESPONSE_CREATED);
      logEvent('▷', 'SCENARIO_RESPONSE_REQUESTED', 'Response creation requested');

      dispatch({ type: 'STARTED' });
      scenarioOpeningSentRef.current = true;
      setShouldStartScenario(false); // Reset the flag
      
    } catch (error) {
      logEvent('▷', 'SCENARIO_OPENING_ERROR', error);
      setConnectionError('Failed to start scenario. Please try again.');
    }
  }, [sendAndAwaitResponse, logEvent]);

  // Auto-start scenario when conditions are met
  useEffect(() => {
    if (shouldStartScenario && state.state === ConnectionState.CONFIGURED && scenarioRef.current && !scenarioOpeningSentRef.current) {
      logEvent('▷', 'AUTO_START_SCENARIO_EFFECT', `Starting scenario: ${scenarioRef.current.title}`);
      sendScenarioOpening(scenarioRef.current);
    }
  }, [shouldStartScenario, state.state, sendScenarioOpening, logEvent]);

  const startHealthCheck = useCallback(() => {
    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
    }
    
    healthCheckRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Send a ping to check connection health
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
          logEvent('◁', 'HEALTH_PING', 'Sent health check ping');
        } catch (error) {
          logEvent('▷', 'HEALTH_PING_ERROR', error);
          // Connection is broken, trigger reconnection
          handleRetry();
        }
      }
    }, 30000); // Check every 30 seconds
  }, [logEvent]);

  const stopHealthCheck = useCallback(() => {
    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
      healthCheckRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback((reason: string) => {
    if (!shouldReconnectRef.current) return;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = Math.min(1000 * Math.pow(2, retryAttempts), 10000);
    logEvent('▷', 'RECONNECT_SCHEDULED', `Reconnecting in ${delay}ms due to: ${reason}`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (shouldReconnectRef.current && retryAttempts < maxRetries) {
        setRetryAttempts(prev => prev + 1);
        connect(currentScenario ?? undefined, true);
      }
    }, delay);
  }, [retryAttempts, currentScenario, logEvent]);

  const testEdgeFunctionHealth = async (): Promise<boolean> => {
    try {
      logEvent('▷', 'HEALTH_CHECK', 'Testing edge function health');
      const { data, error } = await supabase.functions.invoke('realtime-voice', {
        body: { action: 'health' }
      });
      
      if (error) {
        logEvent('▷', 'HEALTH_CHECK_ERROR', error);
        setConnectionError(`Edge function error: ${error.message}`);
        return false;
      }
      
      if (data) {
        logEvent('▷', 'HEALTH_CHECK_SUCCESS', data);
        
        if (!data.hasOpenAIKey) {
          setConnectionError('OpenAI API key not configured in Supabase Edge Functions. Please add OPENAI_API_KEY to your secrets.');
          return false;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      logEvent('▷', 'HEALTH_CHECK_EXCEPTION', error);
      setConnectionError('Cannot reach edge function. Please check your connection.');
      return false;
    }
  };

  const connect = useCallback(async (scenario?: Scenario, skipDispatch = false) => {
    try {
      logEvent('▷', 'CONNECTION_START', 'Starting connection process');
      if (!skipDispatch) {
        dispatch({ type: 'OPENING' });
      }
      setConnectionError(null);
      shouldReconnectRef.current = true;
      scenarioOpeningSentRef.current = false; // Reset scenario opening flag
      setShouldStartScenario(false); // Reset scenario start flag
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
        dispatch({ type: 'CLOSED' });
        return;
      }
      
      // Initialize audio system
      await initializeAudioContext();

      // Use the correct WebSocket URL for Supabase Edge Functions
      const wsUrl = `wss://xirbkztlbixvacekhzyv.functions.supabase.co/realtime-voice`;
      logEvent('▷', 'WEBSOCKET_CONNECTING', `Connecting to: ${wsUrl}`);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        logEvent('▷', 'WEBSOCKET_CONNECTED', 'WebSocket connected to Supabase edge function');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        startHealthCheck();
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data: OpenAIWebSocketEvent = JSON.parse(event.data) as OpenAIWebSocketEvent;
          console.debug('▷ RAW EVENT:', data.type, data);
          logEvent('▷', 'EVENT_RECEIVED', { type: data.type, sequenceId: state.sequenceId });

          switch (data.type) {
            case EVENTS.CONNECTION_ESTABLISHED:
              logEvent('▷', 'CONNECTION_ESTABLISHED', 'OpenAI connection established');
              setConnectionError(null);
              break;

            case EVENTS.SESSION_CREATED:
              logEvent('▷', 'SESSION_CREATED', 'OpenAI session created');
              break;

            case EVENTS.SESSION_UPDATED:
              logEvent('▷', 'SESSION_UPDATED', 'Session configuration updated - READY FOR SCENARIO');
              dispatch({ type: 'CONFIGURED' });
              
              // Set flag to start scenario instead of calling it directly
              if (scenarioRef.current && !scenarioOpeningSentRef.current) {
                logEvent('▷', 'TRIGGER_SCENARIO_START', `Triggering scenario start: ${scenarioRef.current.title}`);
                setShouldStartScenario(true);
              }
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
                  // Ensure audio context is running
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
              
              // Phase 3: Enhanced error categorization
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
              dispatch({ type: 'CLOSED' });
              break;

            case EVENTS.CONNECTION_CLOSED:
              logEvent('▷', 'CONNECTION_CLOSED', 'OpenAI connection closed');
              dispatch({ type: 'CLOSED' });
              setConnectionError('Connection was closed unexpectedly. Please try connecting again.');
              break;

            case 'pong':
              logEvent('▷', 'HEALTH_PONG', 'Received health check pong');
              break;

            default:
              logEvent('▷', 'UNHANDLED_EVENT', `Unhandled message type: ${data.type}`);
          }
        } catch (error) {
          logEvent('▷', 'MESSAGE_PARSE_ERROR', error);
          setConnectionError('Invalid response from server. Please try again.');
        }
      };

      wsRef.current.onerror = (error) => {
        logEvent('▷', 'WEBSOCKET_ERROR', error);
        setConnectionError('WebSocket connection failed. Please check your internet connection and try again.');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      };

      wsRef.current.onclose = (event) => {
        logEvent('▷', 'WEBSOCKET_CLOSED', `Code: ${event.code}, Reason: ${event.reason}`);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        stopHealthCheck();
        dispatch({ type: 'CLOSED' });
        setIsRecording(false);
        setIsAISpeaking(false);
        setIsUserSpeaking(false);
        scenarioOpeningSentRef.current = false; // Reset scenario opening flag
        setShouldStartScenario(false); // Reset scenario start flag
        
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
        scheduleReconnect('close');
      };

      // Phase 3: Global timeout watchdog
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      connectionTimeoutRef.current = setTimeout(() => {
        logEvent('▷', 'CONNECTION_TIMEOUT', 'Connection timeout after 20 seconds');
        setConnectionError('Connection timeout. The server may be overloaded. Please try again.');
        if (wsRef.current) {
          wsRef.current.close();
        }
        handleRetry();
      }, 20000);

    } catch (error) {
      logEvent('▷', 'CONNECTION_ERROR', error);
      setConnectionError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      dispatch({ type: 'CLOSED' });
      handleRetry();
    }
  }, [sendScenarioOpening, state.sequenceId, logEvent, startHealthCheck, stopHealthCheck, scheduleReconnect]);

  const handleRetry = useCallback(() => {
    if (state.retryCount < maxRetries) {
      logEvent('▷', 'RETRY_ATTEMPT', `Retrying connection (${state.retryCount + 1}/${maxRetries})`);
      dispatch({ type: 'RETRY' });
      connect(currentScenario ?? undefined, true);
    } else {
      logEvent('▷', 'MAX_RETRIES_EXCEEDED', 'Max retries reached');
      dispatch({ type: 'CLOSED' });
    }
  }, [state.retryCount, maxRetries, connect, currentScenario, logEvent]);

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
      scenarioOpeningSentRef.current = false; // Reset scenario opening flag
      setShouldStartScenario(false); // Reset scenario start flag
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      stopHealthCheck();
      
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
      
      // Only update state if component is still mounted
      try {
        dispatch({ type: 'CLOSED' });
        setIsRecording(false);
        setIsAISpeaking(false);
        setIsUserSpeaking(false);
        setTranscript('');
        setAiResponse('');
        setCurrentScenario(null);
        setConnectionError(null);
        logEvent('▷', 'DISCONNECT_SUCCESS', 'Disconnected successfully');
      } catch (error) {
        // Component might be unmounted, ignore state updates
        logEvent('▷', 'DISCONNECT_STATE_ERROR', error);
      }
    } catch (error) {
      logEvent('▷', 'DISCONNECT_ERROR', error);
    }
  }, [stopAudioCapture, stopHealthCheck, logEvent]);

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
    audioContext: audioContextRef.current,
    connect,
    startAudioCapture,
    stopAudioCapture,
    sendTextMessage,
    setVolume,
    disconnect,
    retryConnection,
    retryAttempts,
    lastFailureTime
  };
};
