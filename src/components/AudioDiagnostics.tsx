
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play, AlertCircle, CheckCircle } from 'lucide-react';

interface AudioDiagnosticsProps {
  audioContext: AudioContext | null;
  isAISpeaking: boolean;
  onVolumeChange: (volume: number) => void;
}

const AudioDiagnostics: React.FC<AudioDiagnosticsProps> = ({
  audioContext,
  isAISpeaking,
  onVolumeChange
}) => {
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [audioTestResult, setAudioTestResult] = useState<string | null>(null);
  const [audioContextState, setAudioContextState] = useState<string>('unknown');
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (audioContext) {
      setAudioContextState(audioContext.state);
      
      // Create gain node for volume control
      if (!gainNodeRef.current) {
        gainNodeRef.current = audioContext.createGain();
        gainNodeRef.current.connect(audioContext.destination);
      }
      
      // Update gain value
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
      
      // Listen for state changes
      const handleStateChange = () => {
        setAudioContextState(audioContext.state);
      };
      
      audioContext.addEventListener('statechange', handleStateChange);
      return () => audioContext.removeEventListener('statechange', handleStateChange);
    }
  }, [audioContext, volume, isMuted]);

  const testAudio = async () => {
    if (!audioContext) {
      setAudioTestResult('❌ No AudioContext available');
      return;
    }

    try {
      console.log('Testing audio playback...');
      
      // Resume AudioContext if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('AudioContext resumed');
      }

      // Create a simple beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440; // A4 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      setAudioTestResult('✅ Audio test successful - you should hear a beep');
      console.log('Audio test completed successfully');
      
    } catch (error) {
      console.error('Audio test failed:', error);
      setAudioTestResult(`❌ Audio test failed: ${error.message}`);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    onVolumeChange(vol);
    
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : vol;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = !isMuted ? 0 : volume;
    }
  };

  const getAudioContextStatus = () => {
    if (!audioContext) return { icon: AlertCircle, color: 'text-red-500', text: 'No AudioContext' };
    
    switch (audioContextState) {
      case 'running':
        return { icon: CheckCircle, color: 'text-green-500', text: 'Running' };
      case 'suspended':
        return { icon: AlertCircle, color: 'text-yellow-500', text: 'Suspended - Click to resume' };
      case 'closed':
        return { icon: AlertCircle, color: 'text-red-500', text: 'Closed' };
      default:
        return { icon: AlertCircle, color: 'text-gray-500', text: audioContextState };
    }
  };

  const resumeAudioContext = async () => {
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        console.log('AudioContext manually resumed');
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    }
  };

  const status = getAudioContextStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold flex items-center">
        <Volume2 className="w-4 h-4 mr-2" />
        Audio Diagnostics
      </h3>
      
      {/* AudioContext Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm">AudioContext Status:</span>
        <div className="flex items-center space-x-2">
          <StatusIcon className={`w-4 h-4 ${status.color}`} />
          <span className={`text-sm ${status.color}`}>{status.text}</span>
          {audioContextState === 'suspended' && (
            <Button size="sm" onClick={resumeAudioContext}>
              Resume
            </Button>
          )}
        </div>
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Volume:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="p-1"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={1}
          min={0}
          step={0.1}
          className="w-full"
          disabled={isMuted}
        />
        <span className="text-xs text-muted-foreground">
          {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
        </span>
      </div>

      {/* Audio Test */}
      <div className="space-y-2">
        <Button onClick={testAudio} className="w-full" variant="outline">
          <Play className="w-4 h-4 mr-2" />
          Test Audio Output
        </Button>
        {audioTestResult && (
          <p className="text-xs p-2 bg-muted rounded">{audioTestResult}</p>
        )}
      </div>

      {/* AI Speaking Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm">AI Speaking:</span>
        <div className={`w-2 h-2 rounded-full ${isAISpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
      </div>

      {/* Browser Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Sample Rate: {audioContext?.sampleRate || 'N/A'} Hz</p>
        <p>Current Time: {audioContext?.currentTime?.toFixed(2) || 'N/A'}s</p>
        <p>User Agent: {navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}</p>
      </div>
    </Card>
  );
};

export default AudioDiagnostics;
