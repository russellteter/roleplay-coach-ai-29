export class AudioDebugger {
  private static instance: AudioDebugger;
  private logs: string[] = [];

  static getInstance(): AudioDebugger {
    if (!AudioDebugger.instance) {
      AudioDebugger.instance = new AudioDebugger();
    }
    return AudioDebugger.instance;
  }

  log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    this.logs.push(logMessage);
    console.log(logMessage, data || '');
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}`;
    
    this.logs.push(logMessage);
    console.error(logMessage, error || '');
    
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  debugAudioContext(audioContext: AudioContext | null) {
    if (!audioContext) {
      this.error('AudioContext is null');
      return;
    }

    this.log('AudioContext Debug Info', {
      state: audioContext.state,
      sampleRate: audioContext.sampleRate,
      currentTime: audioContext.currentTime,
      destination: audioContext.destination
    });
  }

  debugAudioBuffer(audioBuffer: AudioBuffer) {
    this.log('AudioBuffer Debug Info', {
      length: audioBuffer.length,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels
    });
  }

  debugAudioData(audioData: Uint8Array, label = 'Audio Data') {
    this.log(`${label} Debug Info`, {
      size: audioData.length,
      first10Bytes: Array.from(audioData.slice(0, 10)),
      last10Bytes: Array.from(audioData.slice(-10))
    });
  }
}

export const audioDebugger = AudioDebugger.getInstance();
