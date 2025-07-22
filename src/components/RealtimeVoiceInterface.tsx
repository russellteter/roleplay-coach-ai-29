import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, MessageSquare, Send } from 'lucide-react';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
import { useToast } from '@/components/ui/use-toast';

const RealtimeVoiceInterface = () => {
  const { toast } = useToast();
  const [textInput, setTextInput] = useState('');
  
  const {
    isConnected,
    isRecording,
    isAISpeaking,
    transcript,
    aiResponse,
    connect,
    startAudioCapture,
    stopAudioCapture,
    sendTextMessage,
    disconnect
  } = useRealtimeVoice();

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Connected",
        description: "Ready for real-time voice conversation",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to voice service",
        variant: "destructive",
      });
    }
  };

  const handleStartAudio = async () => {
    try {
      await startAudioCapture();
      toast({
        title: "Microphone Active",
        description: "Start speaking naturally",
      });
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const handleSendText = () => {
    if (textInput.trim()) {
      sendTextMessage(textInput);
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendText();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Real-Time Voice Coaching
        </h2>
        <p className="text-muted-foreground">
          Powered by OpenAI's Realtime API - Natural voice conversations with instant feedback
        </p>
      </div>

      {/* Connection Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="font-medium">
              {isConnected ? 'Connected to EchoCoach AI' : 'Disconnected'}
            </span>
          </div>
          
          {!isConnected ? (
            <Button onClick={handleConnect} className="bg-primary hover:bg-primary/90">
              <Phone className="w-4 h-4 mr-2" />
              Connect
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

      {/* Tips */}
      <Card className="p-4 bg-muted/30">
        <h4 className="font-medium mb-2">💡 Real-Time Voice Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Speak naturally - the AI can interrupt and be interrupted</li>
          <li>• Try: "Help me practice a difficult customer conversation"</li>
          <li>• Try: "I need feedback on my communication style"</li>
          <li>• The AI responds in real-time with natural voice</li>
        </ul>
      </Card>
    </div>
  );
};

export default RealtimeVoiceInterface;