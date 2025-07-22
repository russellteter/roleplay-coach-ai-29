
import { audioDebugger } from './AudioDebugger';

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      audioDebugger.log('Starting audio recorder...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      audioDebugger.debugAudioContext(this.audioContext);
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        audioDebugger.log('AudioContext resumed during recorder start');
      }
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      audioDebugger.log('Audio recorder started successfully');
    } catch (error) {
      audioDebugger.error('Error accessing microphone', error);
      throw error;
    }
  }

  stop() {
    audioDebugger.log('Stopping audio recorder...');
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    audioDebugger.log('Audio recorder stopped');
  }
}

export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

export class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private volume = 0.8;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
    this.gainNode.connect(audioContext.destination);
    this.gainNode.gain.value = this.volume;
    
    audioDebugger.log('AudioQueue initialized with gain node');
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.value = this.volume;
    audioDebugger.log(`Volume set to ${this.volume}`);
  }

  async addToQueue(audioData: Uint8Array) {
    audioDebugger.debugAudioData(audioData, 'Adding to queue');
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      audioDebugger.log('Audio queue finished playing');
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      audioDebugger.log(`Playing audio chunk, size: ${audioData.length}`);
      
      // Ensure audio context is running
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        audioDebugger.log('AudioContext resumed during playback');
      }
      
      // Convert PCM16 data to AudioBuffer with improved error handling
      const audioBuffer = await this.pcmToAudioBuffer(audioData);
      audioDebugger.debugAudioBuffer(audioBuffer);
      
      // Stop any currently playing audio
      if (this.currentSource) {
        try {
          this.currentSource.stop();
        } catch (e) {
          // Ignore errors when stopping already stopped sources
        }
        this.currentSource = null;
      }
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);
      this.currentSource = source;
      
      source.onended = () => {
        audioDebugger.log('Audio chunk finished playing');
        this.currentSource = null;
        this.playNext();
      };
      
      // Handle potential audio playback errors
      source.addEventListener('error', (error) => {
        audioDebugger.error('Audio source error', error);
        this.currentSource = null;
        this.playNext();
      });
      
      source.start(0);
      audioDebugger.log('Audio chunk started playing');
    } catch (error) {
      audioDebugger.error('Error playing audio chunk', error);
      this.playNext(); // Continue with next segment even if current fails
    }
  }

  private async pcmToAudioBuffer(pcmData: Uint8Array): Promise<AudioBuffer> {
    try {
      // Validate input data
      if (pcmData.length === 0 || pcmData.length % 2 !== 0) {
        throw new Error(`Invalid PCM data length: ${pcmData.length}`);
      }

      // Convert bytes to 16-bit samples (little-endian)
      const samples = new Int16Array(pcmData.length / 2);
      for (let i = 0; i < pcmData.length; i += 2) {
        // Little-endian: low byte first, then high byte
        samples[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
      }
      
      // Convert to float32 for AudioBuffer
      const floatSamples = new Float32Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        floatSamples[i] = samples[i] / 32768.0; // Normalize to [-1, 1]
      }
      
      // Create AudioBuffer with proper sample rate
      const audioBuffer = this.audioContext.createBuffer(1, floatSamples.length, 24000);
      audioBuffer.getChannelData(0).set(floatSamples);
      
      audioDebugger.log(`Created AudioBuffer: ${floatSamples.length} samples, ${audioBuffer.duration.toFixed(3)}s duration`);
      return audioBuffer;
    } catch (error) {
      audioDebugger.error('Error converting PCM to AudioBuffer', error);
      throw error;
    }
  }

  stop() {
    audioDebugger.log('Stopping audio queue...');
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // Ignore errors when stopping already stopped sources
      }
      this.currentSource = null;
    }
    this.queue = [];
    this.isPlaying = false;
    audioDebugger.log('Audio queue stopped');
  }
}
