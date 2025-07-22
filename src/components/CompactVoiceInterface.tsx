
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Send } from 'lucide-react';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
import { useToast } from '@/components/ui/use-toast';

const CompactVoiceInterface = () => {
  const { toast } = useToast();
  const [textInput, setTextInput] = useState('');
  
  const {
    isConnected,
    isConnecting,
    isRecording,
    isAISpeaking,
    isUserSpeaking,
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
        description: "Ready for voice coaching",
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

  return (
    <div className="w-full space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 bg-accent-foreground/5 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-400' : 
            isConnecting ? 'bg-yellow-400 animate-pulse' : 
            'bg-gray-400'
          }`}></div>
          <span className="font-medium text-accent-foreground">
            {isConnected ? 'Connected' : 
             isConnecting ? 'Connecting...' : 
             'Disconnected'}
          </span>
          {isUserSpeaking && (
            <div className="flex items-center text-green-400 ml-4">
              <Mic className="w-4 h-4 mr-1" />
              <span className="text-sm">Speaking</span>
            </div>
          )}
        </div>
        
        {!isConnected && !isConnecting ? (
          <Button 
            onClick={handleConnect} 
            className="bg-accent-foreground text-accent hover:bg-accent-foreground/90"
            size="sm"
          >
            <Phone className="w-4 h-4 mr-2" />
            Connect
          </Button>
        ) : isConnecting ? (
          <Button disabled size="sm" className="bg-gray-400">
            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Connecting...
          </Button>
        ) : (
          <Button onClick={disconnect} variant="destructive" size="sm">
            <PhoneOff className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        )}
      </div>

      {/* Voice Controls */}
      {isConnected && (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={isRecording ? stopAudioCapture : handleStartAudio}
              className={`${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-accent-foreground text-accent hover:bg-accent-foreground/90'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Mic
                </>
              )}
            </Button>

            <div className="flex items-center space-x-2 text-sm">
              {isAISpeaking ? (
                <div className="flex items-center text-blue-400">
                  <Volume2 className="w-4 h-4 mr-1" />
                  <span>AI Speaking</span>
                  <div className="ml-2 flex space-x-1">
                    <div className="w-1 h-3 bg-blue-400 animate-pulse"></div>
                    <div className="w-1 h-2 bg-blue-400 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-4 bg-blue-400 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-accent-foreground/60">
                  <VolumeX className="w-4 h-4 mr-1" />
                  <span>AI Silent</span>
                </div>
              )}
            </div>
          </div>

          {/* Text Input */}
          <div className="flex space-x-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
              placeholder="Or type a message..."
              className="flex-1 bg-accent-foreground/10 border-accent-foreground/20 text-accent-foreground placeholder:text-accent-foreground/60"
            />
            <Button 
              onClick={handleSendText} 
              disabled={!textInput.trim()}
              className="bg-accent-foreground text-accent hover:bg-accent-foreground/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Live Conversation */}
          {(transcript || aiResponse) && (
            <div className="space-y-3">
              {transcript && (
                <div className="p-3 bg-accent-foreground/5 rounded-lg">
                  <p className="text-sm text-accent-foreground">
                    <strong>You:</strong> {transcript}
                  </p>
                </div>
              )}
              {aiResponse && (
                <div className="p-3 bg-accent-foreground/10 rounded-lg">
                  <p className="text-sm text-accent-foreground">
                    <strong>AI Coach:</strong> {aiResponse}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <div className="p-4 bg-accent-foreground/5 rounded-xl">
        <h4 className="font-medium text-accent-foreground mb-2">💡 Try saying:</h4>
        <ul className="text-sm text-accent-foreground/80 space-y-1">
          <li>• "Help me practice a difficult customer conversation"</li>
          <li>• "I need feedback on my communication style"</li>
          <li>• "Let's role-play a healthcare consultation"</li>
        </ul>
      </div>
    </div>
  );
};

export default CompactVoiceInterface;
