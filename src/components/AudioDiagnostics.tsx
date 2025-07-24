import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  Volume2, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw 
} from 'lucide-react';
import { audioDebugger } from '@/utils/AudioDebugger';
import { ConnectionStatus } from './ConnectionStatus';

interface AudioDiagnosticsProps {
  isRecording?: boolean;
  isAISpeaking?: boolean;
  audioLevel?: number;
  className?: string;
}

const AudioDiagnostics: React.FC<AudioDiagnosticsProps> = ({
  isRecording = false,
  isAISpeaking = false,
  audioLevel = 0,
  className = ''
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [audioContext, setAudioContext] = useState<'suspended' | 'running' | 'closed' | 'checking'>('checking');

  // Check microphone permission
  const checkMicPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setMicPermission(result.state);
    } catch {
      setMicPermission('prompt');
    }
  };

  // Check audio context state
  const checkAudioContext = () => {
    try {
      const context = new AudioContext();
      setAudioContext(context.state);
      context.close();
    } catch {
      setAudioContext('closed');
    }
  };

  // Run diagnostics
  React.useEffect(() => {
    checkMicPermission();
    checkAudioContext();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'denied':
      case 'closed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'prompt':
      case 'suspended':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
  };

  const logs = audioDebugger.getLogs();

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Audio Diagnostics</h3>
          <ConnectionStatus />
        </div>

        {/* Audio Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500' : 'text-muted-foreground'}`} />
            <span className="text-sm">Recording</span>
            <Badge variant={isRecording ? 'default' : 'secondary'} className="ml-auto">
              {isRecording ? 'ON' : 'OFF'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Volume2 className={`w-4 h-4 ${isAISpeaking ? 'text-blue-500' : 'text-muted-foreground'}`} />
            <span className="text-sm">AI Speaking</span>
            <Badge variant={isAISpeaking ? 'default' : 'secondary'} className="ml-auto">
              {isAISpeaking ? 'ON' : 'OFF'}
            </Badge>
          </div>
        </div>

        {/* Audio Level */}
        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Audio Level</span>
            </div>
            <Progress value={audioLevel * 100} className="h-2" />
          </div>
        )}

        {/* System Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(micPermission)}
              <span className="text-sm">Microphone</span>
            </div>
            <Badge variant={micPermission === 'granted' ? 'default' : 'secondary'}>
              {micPermission}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(audioContext)}
              <span className="text-sm">Audio Context</span>
            </div>
            <Badge variant={audioContext === 'running' ? 'default' : 'secondary'}>
              {audioContext}
            </Badge>
          </div>
        </div>

        {/* Debug Logs Toggle */}
        <div className="pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowLogs(!showLogs)}
            className="w-full"
          >
            {showLogs ? 'Hide' : 'Show'} Debug Logs ({logs.length})
          </Button>
          
          {showLogs && (
            <div className="mt-2 p-2 bg-muted rounded text-xs font-mono max-h-32 overflow-y-auto">
              {logs.slice(-10).map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-muted-foreground">No logs yet</div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              checkMicPermission();
              checkAudioContext();
            }}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => audioDebugger.clearLogs()}
          >
            Clear Logs
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AudioDiagnostics;