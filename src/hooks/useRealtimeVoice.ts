import { useState, useCallback, useRef, useReducer, useEffect } from 'react';
import { AudioRecorder, AudioQueue, encodeAudioForAPI } from '../utils/RealtimeAudio';

// ====== TYPE DEFINITIONS ======

export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  openingMessage: string;
}

// Connection state management
export enum ConnectionState {
  CLOSED = 'CLOSED',
  OPENING = 'OPENING',
  ESTABLISHING = 'ESTABLISHING',
  CONFIGURING = 'CONFIGURING',
  READY = 'READY',
  STARTED = 'STARTED',
  ERROR = 'ERROR'
}

export type StateAction = 
  | { type: 'OPENING' }
  | { type: 'ESTABLISHING' }
  | { type: 'CONFIGURING' }
  | { type: 'READY' }
  | { type: 'STARTED' }
  | { type: 'ERROR'; error: string }
  | { type: 'CLOSED' }
  | { type: 'RETRY' };

export interface ConnectionStateContext {
  state: ConnectionState;
  sequenceId: number;
  retryCount: number;
  lastError?: string;
}

const initialState: ConnectionStateContext = {
  state: ConnectionState.CLOSED,
  sequenceId: 0,
  retryCount: 0
};

const maxRetries = 3;

// State reducer for connection management
function connectionReducer(state: ConnectionStateContext, action: StateAction): ConnectionStateContext {
  switch (action.type) {
    case 'OPENING':
      return { ...state, state: ConnectionState.OPENING, retryCount: 0 };
      
    case 'ESTABLISHING':
      return { ...state, state: ConnectionState.ESTABLISHING };
      
    case 'CONFIGURING':
      return { ...state, state: ConnectionState.CONFIGURING };
      
    case 'READY':
      return { 
        ...state, 
        state: ConnectionState.READY, 
        sequenceId: state.sequenceId + 1,
        retryCount: 0,
        lastError: undefined
      };
      
    case 'STARTED':
      return { ...state, state: ConnectionState.STARTED };
      
    case 'ERROR':
      return {
        ...state,
        state: ConnectionState.ERROR,
        lastError: action.error,
        retryCount: state.retryCount + 1
      };
      
    case 'CLOSED':
      return { ...initialState, sequenceId: state.sequenceId };
      
    case 'RETRY':
      if (state.retryCount < maxRetries) {
        return { 
          ...state, 
          state: ConnectionState.OPENING,
          retryCount: state.retryCount + 1
        };
      }
      return state;
      
    default:
      return state;
  }
}

// ====== MAIN HOOK ======

export const useRealtimeVoice = () => {
  // State management
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
  
  // Refs for persistent connections and audio
  const streamConnectionRef = useRef<ReadableStreamDefaultReader | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const scenarioRef = useRef<Scenario | null>(null);
  const sequenceIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const connectionIdRef = useRef<string | null>(null);

  // ====== HELPER FUNCTIONS ======

  // Event logging
  const logEvent = useCallback((icon: string, event: string, details?: any) => {
    const timestamp = new Date().toISOString().slice(11, 23);
    const detailsStr = details ? ` | ${typeof details === 'object' ? JSON.stringify(details) : details}` : '';
    console.log(`[${timestamp}] ${icon} ${event}${detailsStr}`);
  }, []);

  // Initialize audio context
  const initializeAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = 0.8;
        
        audioQueueRef.current = new AudioQueue(audioContextRef.current);
        
        logEvent('🎵', 'AUDIO_CONTEXT_INITIALIZED', {
          sampleRate: audioContextRef.current.sampleRate,
          state: audioContextRef.current.state
        });
      }
    } catch (error) {
      logEvent('❌', 'AUDIO_CONTEXT_ERROR', { error: error instanceof Error ? error.message : 'Unknown' });
      throw error;
    }
  }, [logEvent]);

  // Test edge function health
  const testEdgeFunctionHealth = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.SUPABASE_FUNCTIONS_URL}/realtime-voice/health`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.SUPABASE_PUBLISHABLE_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      logEvent('💚', 'HEALTH_CHECK_PASSED', data);
    } catch (error) {
      logEvent('❌', 'HEALTH_CHECK_FAILED', { error: error instanceof Error ? error.message : 'Unknown' });
      throw error;
    }
  }, [logEvent]);

  // Handle streaming server events
  const handleStreamMessage = useCallback(async (data: any) => {
    try {
      logEvent('📨', `RECEIVED_${data.type}`, data);

      switch (data.type) {
        case 'connection.established':
          logEvent('✅', 'CONNECTION_ESTABLISHED', { connectionId: data.connectionId });
          connectionIdRef.current = data.connectionId;
          dispatch({ type: 'ESTABLISHING' });
          break;

        case 'session.created':
          logEvent('🎯', 'SESSION_CREATED', 'OpenAI session initialized');
          dispatch({ type: 'CONFIGURING' });
          break;

        case 'session.updated':
          logEvent('🎯', 'SESSION_CONFIGURED', 'OpenAI session configured');
          break;

        case 'session.ready':
          logEvent('✅', 'SESSION_READY', data.message);
          dispatch({ type: 'READY' });
          break;

        case 'input_audio_buffer.speech_started':
          logEvent('🎤', 'USER_SPEECH_STARTED', 'User started speaking');
          setIsUserSpeaking(true);
          break;

        case 'input_audio_buffer.speech_stopped':
          logEvent('🎤', 'USER_SPEECH_STOPPED', 'User stopped speaking');
          setIsUserSpeaking(false);
          break;

        case 'conversation.item.input_audio_transcription.completed':
          if (data.transcript) {
            logEvent('📝', 'USER_TRANSCRIPT', { transcript: data.transcript });
            setTranscript(prev => prev + ' ' + data.transcript);
          }
          break;

        case 'response.created':
          logEvent('🤖', 'AI_RESPONSE_STARTED', 'AI response initiated');
          setIsAISpeaking(true);
          setAiResponse('');
          break;

        case 'response.audio.delta':
          if (data.delta && audioQueueRef.current) {
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            await audioQueueRef.current.addToQueue(bytes);
          }
          break;

        case 'response.audio_transcript.delta':
          if (data.delta) {
            setAiResponse(prev => prev + data.delta);
          }
          break;

        case 'response.audio.done':
          logEvent('🤖', 'AI_RESPONSE_FINISHED', 'AI audio complete');
          setIsAISpeaking(false);
          break;

        case 'error':
          logEvent('❌', 'STREAM_ERROR', data.error);
          setConnectionError(data.error || 'Stream error occurred');
          dispatch({ type: 'ERROR', error: data.error || 'Stream error' });
          break;

        case 'connection.closed':
          logEvent('🔴', 'CONNECTION_CLOSED', { code: data.code, reason: data.reason });
          dispatch({ type: 'CLOSED' });
          break;

        default:
          logEvent('❓', 'UNKNOWN_EVENT', data);
      }
    } catch (error) {
      logEvent('❌', 'MESSAGE_HANDLER_ERROR', { error: error instanceof Error ? error.message : 'Unknown', data });
    }
  }, [logEvent]);

  // ====== CONNECTION MANAGEMENT ======

  // HTTP Streaming connection function
  const connectStream = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      try {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        
        logEvent('▷', 'STREAM_CONNECTING', { url: `${import.meta.env.SUPABASE_FUNCTIONS_URL}/realtime-voice/stream` });
        
        fetch(`${import.meta.env.SUPABASE_FUNCTIONS_URL}/realtime-voice/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            apikey: import.meta.env.SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({ 
            action: 'connect',
            timestamp: new Date().toISOString()
          }),
          signal: abortController.signal
        })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Stream connection failed: ${response.status}`);
          }

          if (!response.body) {
            throw new Error('No response body for streaming');
          }

          logEvent('✅', 'STREAM_CONNECTED', 'HTTP stream established');
          
          const reader = response.body.getReader();
          streamConnectionRef.current = reader;
          const decoder = new TextDecoder();
          
          resolve();

          // Process the streaming response
          const processStream = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                  logEvent('🔴', 'STREAM_ENDED', 'Stream completed');
                  dispatch({ type: 'CLOSED' });
                  break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const jsonData = line.slice(6).trim();
                      if (jsonData && jsonData !== '[DONE]') {
                        const data = JSON.parse(jsonData);
                        await handleStreamMessage(data);
                      }
                    } catch (parseError) {
                      logEvent('❌', 'STREAM_PARSE_ERROR', { error: parseError instanceof Error ? parseError.message : 'Unknown', line });
                    }
                  }
                }
              }
            } catch (streamError) {
              if (streamError.name === 'AbortError') {
                logEvent('🔴', 'STREAM_ABORTED', 'Connection aborted by user');
              } else {
                logEvent('❌', 'STREAM_READ_ERROR', { error: streamError instanceof Error ? streamError.message : 'Unknown' });
                setConnectionError('Stream reading failed');
                dispatch({ type: 'ERROR', error: streamError instanceof Error ? streamError.message : 'Stream error' });
              }
            }
          };

          processStream();
        })
        .catch((fetchError) => {
          if (fetchError.name === 'AbortError') {
            logEvent('🔴', 'STREAM_FETCH_ABORTED', 'Fetch aborted by user');
          } else {
            logEvent('❌', 'STREAM_FETCH_ERROR', { error: fetchError instanceof Error ? fetchError.message : 'Unknown' });
            setConnectionError('Failed to establish stream connection');
            dispatch({ type: 'ERROR', error: fetchError instanceof Error ? fetchError.message : 'Connection failed' });
            reject(fetchError);
          }
        });

      } catch (error) {
        logEvent('❌', 'STREAM_CREATE_ERROR', { error: error instanceof Error ? error.message : 'Unknown' });
        reject(error);
      }
    });
  }, [logEvent, handleStreamMessage]);

  // Main connection function
  const connect = useCallback(async () => {
    if (state.state === ConnectionState.OPENING || state.state === ConnectionState.ESTABLISHING) {
      logEvent('⚠️', 'CONNECTION_ATTEMPT_IGNORED', 'Connection already in progress');
      return;
    }

    dispatch({ type: 'OPENING' });
    
    try {
      // Test edge function health first
      await testEdgeFunctionHealth();
      
      if (state.state === ConnectionState.ERROR) {
        logEvent('⚠️', 'CONNECTION_ABORTED', 'Health check failed');
        return;
      }

      // Initialize audio system
      await initializeAudioContext();

      // Connect via HTTP streaming
      await connectStream();
      
      logEvent('▷', 'CONNECTION_ESTABLISHED', 'HTTP stream connection ready');
      dispatch({ type: 'ESTABLISHING' });
      setConnectionStable(true);

    } catch (error) {
      logEvent('❌', 'CONNECTION_ERROR', { error: error instanceof Error ? error.message : 'Unknown' });
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      dispatch({ type: 'ERROR', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [state.state, logEvent, testEdgeFunctionHealth, initializeAudioContext, connectStream]);

  // ====== SCENARIO MANAGEMENT ======

  // Start scenario function
  const startScenario = useCallback(async (scenario: Scenario) => {
    if (!scenario) {
      setConnectionError('No scenario provided');
      return;
    }
    
    if (state.state !== ConnectionState.READY) {
      setConnectionError('Connection not ready. Please connect first.');
      return;
    }

    if (!streamConnectionRef.current || !connectionIdRef.current) {
      setConnectionError('Stream not connected. Please reconnect.');
      return;
    }

    try {
      logEvent('▷', 'SCENARIO_STARTING', { 
        scenarioId: scenario.id, 
        title: scenario.title,
        hasOpeningMessage: !!scenario.openingMessage 
      });

      // Store scenario reference
      scenarioRef.current = scenario;
      setCurrentScenario(scenario);

      // Change state to STARTED
      dispatch({ type: 'STARTED' });
      
      // Send scenario start message via HTTP POST
      if (scenario.openingMessage) {
        const message = {
          action: 'startScenario',
          connectionId: connectionIdRef.current,
          scenarioId: scenario.id,
          openingMessage: scenario.openingMessage,
          timestamp: new Date().toISOString()
        };

        fetch(`${import.meta.env.SUPABASE_FUNCTIONS_URL}/realtime-voice/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify(message)
        }).catch(error => {
          logEvent('❌', 'SCENARIO_POST_ERROR', { error: error instanceof Error ? error.message : 'Unknown' });
        });

        logEvent('▷', 'SCENARIO_MESSAGE_SENT', { 
          scenarioId: scenario.id,
          openingMessage: scenario.openingMessage.substring(0, 100) + '...'
        });
        
      } else {
        console.warn('⚠️ No opening message available for scenario');
        setConnectionError('No opening message configured for this scenario');
      }
      
    } catch (error) {
      logEvent('❌', 'SCENARIO_START_ERROR', { error: error instanceof Error ? error.message : 'Unknown' });
      setConnectionError(error instanceof Error ? error.message : 'Failed to start scenario');
      dispatch({ type: 'ERROR', error: error instanceof Error ? error.message : 'Scenario start failed' });
    }
  }, [state.state, logEvent]);

  // ====== AUDIO MANAGEMENT ======

  // Start audio capture
  const startAudioCapture = useCallback(async () => {
    try {
      logEvent('🎤', 'AUDIO_CAPTURE_STARTING', 'Initializing microphone');
      
      if (!audioContextRef.current) {
        await initializeAudioContext();
      }

      if (recorderRef.current) {
        recorderRef.current.stop();
      }

      recorderRef.current = new AudioRecorder((audioData) => {
        if (streamConnectionRef.current && connectionIdRef.current) {
          const base64Audio = encodeAudioForAPI(audioData);
          sequenceIdRef.current += 1;
          
          const message = {
            action: 'audioChunk',
            connectionId: connectionIdRef.current,
            data: base64Audio,
            sequenceId: sequenceIdRef.current,
            timestamp: new Date().toISOString()
          };
          
          // Send audio chunk via HTTP POST
          fetch(`${import.meta.env.SUPABASE_FUNCTIONS_URL}/realtime-voice/action`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify(message)
          }).catch(error => {
            logEvent('❌', 'AUDIO_POST_ERROR', { error: error instanceof Error ? error.message : 'Unknown' });
          });
          
          logEvent('▷', 'AUDIO_SENT', `${audioData.length} samples, seq: ${sequenceIdRef.current}`);
        }
      });

      await recorderRef.current.start();
      setIsRecording(true);
      logEvent('✅', 'AUDIO_CAPTURE_STARTED', 'Microphone active and streaming');
      
    } catch (error) {
      logEvent('❌', 'AUDIO_CAPTURE_ERROR', { error: error instanceof Error ? error.message : 'Unknown' });
      setConnectionError('Failed to start microphone. Please check permissions.');
    }
  }, [logEvent, initializeAudioContext]);

  // Stop audio capture
  const stopAudioCapture = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);
      logEvent('🎤', 'AUDIO_CAPTURE_STOPPED', 'Microphone deactivated');
    }
  }, [logEvent]);

  // Send text message
  const sendTextMessage = useCallback((message: string) => {
    if (!streamConnectionRef.current || !connectionIdRef.current) {
      setConnectionError('Not connected. Please reconnect.');
      return;
    }

    try {
      const textMessage = {
        action: 'textMessage',
        connectionId: connectionIdRef.current,
        message: message,
        timestamp: new Date().toISOString()
      };

      fetch(`${import.meta.env.SUPABASE_FUNCTIONS_URL}/realtime-voice/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify(textMessage)
      }).catch(error => {
        logEvent('❌', 'TEXT_POST_ERROR', { error: error instanceof Error ? error.message : 'Unknown' });
      });
      logEvent('📝', 'TEXT_MESSAGE_SENT', { message: message.substring(0, 50) + '...' });
    } catch (error) {
      logEvent('❌', 'TEXT_MESSAGE_ERROR', { error: error instanceof Error ? error.message : 'Unknown' });
      setConnectionError('Failed to send text message');
    }
  }, [logEvent]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    if (audioQueueRef.current) {
      audioQueueRef.current.setVolume(volume);
      logEvent('🔊', 'VOLUME_CHANGED', { volume });
    }
  }, [logEvent]);

  // ====== CLEANUP ======

  // Disconnect function
  const disconnect = useCallback(() => {
    logEvent('🔌', 'DISCONNECT_INITIATED', 'Cleaning up connection');

    // Stop audio recording
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);
    }

    // Stop audio playback
    if (audioQueueRef.current) {
      audioQueueRef.current.stop();
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close stream connection
    if (streamConnectionRef.current) {
      streamConnectionRef.current.cancel();
      streamConnectionRef.current = null;
    }

    // Cancel any pending HTTP requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset states
    setConnectionStable(false);
    setConnectionError(null);
    setTranscript('');
    setAiResponse('');
    setIsUserSpeaking(false);
    setIsAISpeaking(false);
    setCurrentScenario(null);
    scenarioRef.current = null;
    sequenceIdRef.current = 0;

    dispatch({ type: 'CLOSED' });
    logEvent('✅', 'DISCONNECT_COMPLETE', 'All resources cleaned up');
  }, [logEvent]);

  // Retry connection
  const retryConnection = useCallback(() => {
    if (state.retryCount < maxRetries) {
      logEvent('🔄', 'RETRY_INITIATED', { attempt: state.retryCount + 1, maxRetries });
      dispatch({ type: 'RETRY' });
      connect();
    } else {
      logEvent('❌', 'RETRY_EXHAUSTED', { maxRetries });
      setConnectionError('Maximum retry attempts reached. Please try again later.');
    }
  }, [state.retryCount, logEvent, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // ====== RETURN INTERFACE ======

  return {
    // Connection state
    isConnected,
    isConnecting,
    isReadyToStart,
    isScenarioStarted,
    hasError,
    connectionError,
    connectionStable,
    connectionQuality: connectionStable ? 'good' : 'poor',
    
    // Audio state
    isRecording,
    isAISpeaking,
    isUserSpeaking,
    audioContext: audioContextRef.current,
    
    // Content state
    transcript,
    aiResponse,
    currentScenario,
    scenario: currentScenario,
    
    // Internal state (for debugging)
    state: state.state,
    sequenceId: state.sequenceId,
    retryCount: state.retryCount,
    
    // Control functions
    connect: (scenario?: Scenario) => {
      if (scenario) {
        scenarioRef.current = scenario;
        setCurrentScenario(scenario);
      }
      return connect();
    },
    disconnect,
    retryConnection,
    startScenario: () => {
      if (scenarioRef.current) {
        return startScenario(scenarioRef.current);
      }
    },
    startAudioCapture,
    stopAudioCapture,
    sendTextMessage,
    setVolume,
  };
};