import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, Loader2, Trash2 } from 'lucide-react';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useToast } from '@/components/ui/use-toast';

const VoiceInterface = () => {
  const { toast } = useToast();
  const {
    messages,
    isRecording,
    isProcessing,
    isPlaying,
    startRecording,
    stopRecording,
    clearChat
  } = useVoiceChat();

  const handleStartRecording = async () => {
    try {
      await startRecording();
      toast({
        title: "Recording started",
        description: "Speak your message...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    toast({
      title: "Processing",
      description: "Converting speech to text...",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          EchoCoach Voice Demo
        </h2>
        <p className="text-muted-foreground">
          Practice conversations with AI voice coaching
        </p>
      </div>

      {/* Chat Messages */}
      <Card className="p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Start a conversation by pressing the microphone button</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Voice Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isProcessing || isPlaying}
          size="lg"
          className={`relative ${
            isRecording
              ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-5 h-5 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </>
          )}
        </Button>

        {messages.length > 0 && (
          <Button
            onClick={clearChat}
            variant="outline"
            size="lg"
            disabled={isRecording || isProcessing}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
        {isRecording && (
          <div className="flex items-center space-x-2 text-destructive">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span>Recording...</span>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
        
        {isPlaying && (
          <div className="flex items-center space-x-2 text-primary">
            <Volume2 className="w-4 h-4" />
            <span>Playing response...</span>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="text-center text-sm text-muted-foreground">
        <p>💡 Tip: Try asking for conversation practice or communication feedback</p>
      </div>
    </div>
  );
};

export default VoiceInterface;