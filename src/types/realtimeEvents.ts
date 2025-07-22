export type TextContent = {
  type: 'text';
  text: string;
};

export interface ConversationMessage {
  type: 'message';
  role: 'system' | 'user';
  content: TextContent[];
}

export interface ConversationItemCreate {
  type: 'conversation.item.create';
  item: ConversationMessage;
}

export interface ResponseCreate {
  type: 'response.create';
}

export type ClientWebSocketEvent = ConversationItemCreate | ResponseCreate;

export interface ConnectionEstablished {
  type: 'connection.established';
  timestamp?: string;
}

export interface SessionCreate {
  type: 'session.create';
}

export interface SessionCreated {
  type: 'session.created';
}

export interface SessionUpdate {
  type: 'session.update';
  session?: unknown;
}

export interface SessionUpdated {
  type: 'session.updated';
  session?: unknown;
}

export interface SpeechStarted {
  type: 'input_audio_buffer.speech_started';
}

export interface SpeechStopped {
  type: 'input_audio_buffer.speech_stopped';
}

export interface InputAudioTranscriptionCompleted {
  type: 'conversation.item.input_audio_transcription.completed';
  transcript?: string;
}

export interface AudioDelta {
  type: 'response.audio.delta';
  delta: string;
}

export interface AudioDone {
  type: 'response.audio.done';
}

export interface AudioTranscriptDelta {
  type: 'response.audio_transcript.delta';
  delta: string;
}

export interface ResponseCreated {
  type: 'response.created';
}

export interface ErrorEvent {
  type: 'error';
  error: unknown;
}

export interface ConnectionClosed {
  type: 'connection.closed';
  code: number;
  reason: string;
}

export interface PongEvent {
  type: 'pong';
}

export type OpenAIWebSocketEvent =
  | ConnectionEstablished
  | SessionCreate
  | SessionCreated
  | SessionUpdate
  | SessionUpdated
  | SpeechStarted
  | SpeechStopped
  | InputAudioTranscriptionCompleted
  | AudioDelta
  | AudioDone
  | AudioTranscriptDelta
  | ResponseCreated
  | ErrorEvent
  | ConnectionClosed
  | PongEvent;
