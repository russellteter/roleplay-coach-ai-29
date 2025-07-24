
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, MessageSquare, Send, Bug, AlertTriangle, RefreshCw } from 'lucide-react';
import { useRealtimeVoice, Scenario } from '@/hooks/useRealtimeVoice';
import { useToast } from '@/components/ui/use-toast';
import AudioDiagnostics from './AudioDiagnostics';
import { audioDebugger } from '@/utils/AudioDebugger';

interface RealtimeVoiceInterfaceProps {
  category?: 'healthcare' | 'customer-service' | 'compliance-hr';
}

const RealtimeVoiceInterface = ({ category }: RealtimeVoiceInterfaceProps) => {
  const { toast } = useToast();
  const [textInput, setTextInput] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [volume, setVolume] = useState(0.8);
  
  const {
    isConnected,
    isConnecting,
    isRecording,
    isAISpeaking,
    isUserSpeaking,
    transcript,
    aiResponse,
    connectionError,
    connect,
    startAudioCapture,
    stopAudioCapture,
    sendTextMessage,
    disconnect,
    retryConnection,
    audioContext: realtimeAudioContext
  } = useRealtimeVoice();

  // Default scenario for testing
  const defaultScenario: Scenario = {
    id: 'test-scenario',
    title: 'General Voice Test',
    description: 'Test real-time voice communication',
    category: 'general',
    openingMessage: 'Hello! I am ready to help you practice communication. What would you like to work on today?'
  };

  const handleConnect = async () => {
    try {
      audioDebugger.log('User initiated connection');
      await connect(defaultScenario);
      toast({
        title: "Connected",
        description: "Ready for real-time voice conversation",
      });
    } catch (error) {
      audioDebugger.error('Connection failed', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to voice service",
        variant: "destructive",
      });
    }
  };

  const handleStartAudio = async () => {
    try {
      audioDebugger.log('User starting audio capture');
      await startAudioCapture();
      toast({
        title: "Microphone Active",
        description: "Start speaking naturally",
      });
    } catch (error) {
      audioDebugger.error('Microphone error', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const handleSendText = () => {
    if (textInput.trim()) {
      audioDebugger.log(`Sending text message: ${textInput}`);
      sendTextMessage(textInput);
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendText();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioDebugger.log(`Volume changed to ${newVolume}`);
  };

  const handleRetry = () => {
    audioDebugger.log('User retrying connection');
    retryConnection();
  };

  const handleDismissError = () => {
    // Clear error by attempting to disconnect and reset state
    disconnect();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Real-Time Voice Coaching
        </h2>
        <p className="text-muted-foreground">
          Powered by OpenAI's Realtime API - Natural voice conversations with instant feedback
        </p>
      </div>

      {/* Phase 3: Enhanced Error Display */}
      {connectionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>⚠️ Voice error: {connectionError}</span>
            <div className="flex space-x-2">
              <Button onClick={handleRetry} size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
              <Button onClick={handleDismissError} size="sm" variant="outline">
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="voice">Voice Interface</TabsTrigger>
          <TabsTrigger value="diagnostics">Audio Diagnostics</TabsTrigger>
          <TabsTrigger value="debug">Debug Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="space-y-6">
          {/* Connection Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 
                  isConnecting ? 'bg-yellow-500 animate-pulse' : 
                  'bg-gray-400'
                }`}></div>
                <span className="font-medium">
                  {isConnected ? 'Connected to Sharpen AI' : 
                   isConnecting ? 'Connecting...' : 
                   'Disconnected'}
                </span>
                {isUserSpeaking && (
                  <div className="flex items-center text-green-600 ml-4">
                    <Mic className="w-4 h-4 mr-1" />
                    <span className="text-sm">You're speaking</span>
                  </div>
                )}
              </div>
              
              {!isConnected && !isConnecting ? (
                <Button onClick={handleConnect} className="bg-primary hover:bg-primary/90">
                  <Phone className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              ) : isConnecting ? (
                <Button disabled className="bg-gray-400">
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Connecting...
                </Button>
              ) : (
                <Button onClick={disconnect} variant="destructive">
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
          </Card>

          {/* Voice Controls */}
          {isConnected && (
            <Card className="p-6">
              <div className="flex items-center justify-center space-x-6 mb-6">
                <Button
                  onClick={isRecording ? stopAudioCapture : handleStartAudio}
                  size="lg"
                  className={`relative ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      Stop Microphone
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Start Microphone
                    </>
                  )}
                </Button>

                <div className="flex items-center space-x-2 text-sm">
                  {isAISpeaking ? (
                    <div className="flex items-center text-blue-600">
                      <Volume2 className="w-4 h-4 mr-1" />
                      <span>AI Speaking</span>
                      <div className="ml-2 flex space-x-1">
                        <div className="w-1 h-4 bg-blue-600 animate-pulse"></div>
                        <div className="w-1 h-3 bg-blue-600 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-5 bg-blue-600 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-muted-foreground">
                      <VolumeX className="w-4 h-4 mr-1" />
                      <span>AI Silent</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Text Input Alternative */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Or type a message:
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    className="flex-1"
                  />
                  <Button onClick={handleSendText} disabled={!textInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Live Transcription */}
          {isConnected && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  You Said:
                </h3>
                <div className="min-h-[100px] p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm">{transcript || "Start speaking to see transcription..."}</p>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Volume2 className="w-4 h-4 mr-2" />
                  AI Response:
                </h3>
                <div className="min-h-[100px] p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm">{aiResponse || "AI response will appear here..."}</p>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="diagnostics">
          <AudioDiagnostics
            isAISpeaking={isAISpeaking}
          />
        </TabsContent>

        <TabsContent value="debug">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center">
                <Bug className="w-4 h-4 mr-2" />
                Debug Logs
              </h3>
              <Button
                onClick={() => audioDebugger.clearLogs()}
                variant="outline"
                size="sm"
              >
                Clear Logs
              </Button>
            </div>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
              {audioDebugger.getLogs().map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
              {audioDebugger.getLogs().length === 0 && (
                <div className="text-gray-500">No logs yet...</div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <Card className="p-4 bg-muted/30">
        <h4 className="font-medium mb-2">💡 Audio Troubleshooting Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Check the Audio Diagnostics tab if you can't hear the AI</li>
          <li>• Make sure your browser allows audio playback (check for autoplay blocking)</li>
          <li>• Try the "Test Audio Output" button to verify your speakers work</li>
          <li>• If AudioContext is suspended, click "Resume" or interact with the page</li>
          <li>• Check the Debug Logs tab for detailed technical information</li>
          <li>• Use the Retry button if you encounter connection errors</li>
        </ul>
      </Card>
    </div>
  );
};

export default RealtimeVoiceInterface;
