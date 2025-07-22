

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Send, Users, MessageSquare } from 'lucide-react';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
import { useToast } from '@/hooks/use-toast';
import { HEALTHCARE_SCENARIOS, Scenario } from '@/utils/scenarioPrompts';

const CompactVoiceInterface = () => {
  const { toast } = useToast();
  const [textInput, setTextInput] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  
  const {
    isConnected,
    isConnecting,
    isRecording,
    isAISpeaking,
    isUserSpeaking,
    transcript,
    aiResponse,
    currentScenario,
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

  const handleConnectWithScenario = async (scenario: Scenario) => {
    try {
      setSelectedScenario(scenario);
      await connect(scenario);
      toast({
        title: "Scenario Started",
        description: `Beginning ${scenario.title} roleplay`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not start scenario",
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
    <div className="w-full space-y-6">
      {/* Scenario Selection */}
      {!isConnected && !isConnecting && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Choose Your Training Scenario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {HEALTHCARE_SCENARIOS.map((scenario) => (
              <Button
                key={scenario.id}
                onClick={() => handleConnectWithScenario(scenario)}
                variant="outline"
                className="h-auto p-4 text-left flex-col items-start border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="font-medium text-foreground mb-1">{scenario.title}</div>
                <div className="text-sm text-muted-foreground">{scenario.description}</div>
              </Button>
            ))}
          </div>
          <div className="text-center pt-4 border-t border-border">
            <Button 
              onClick={handleConnect} 
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              Or connect without a scenario
            </Button>
          </div>
        </Card>
      )}

      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 
            isConnecting ? 'bg-yellow-500 animate-pulse' : 
            'bg-gray-400'
          }`}></div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {isConnected ? 'Connected' : 
               isConnecting ? 'Connecting...' : 
               'Disconnected'}
            </span>
            {currentScenario && (
              <span className="text-sm text-muted-foreground">
                Scenario: {currentScenario.title}
              </span>
            )}
          </div>
          {isUserSpeaking && (
            <div className="flex items-center text-green-500 ml-4">
              <Mic className="w-4 h-4 mr-1" />
              <span className="text-sm">Speaking</span>
            </div>
          )}
        </div>
        
        {!isConnected && !isConnecting ? (
          <Button 
            onClick={handleConnect} 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            <Phone className="w-4 h-4 mr-2" />
            Connect
          </Button>
        ) : isConnecting ? (
          <Button disabled size="sm" className="bg-muted">
            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"></div>
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
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
                <div className="flex items-center text-blue-500">
                  <Volume2 className="w-4 h-4 mr-1" />
                  <span>AI Speaking</span>
                  <div className="ml-2 flex space-x-1">
                    <div className="w-1 h-3 bg-blue-500 animate-pulse"></div>
                    <div className="w-1 h-2 bg-blue-500 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-4 bg-blue-500 animate-pulse" style={{animationDelay: '0.2s'}}></div>
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

          {/* Text Input */}
          <div className="flex space-x-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
              placeholder="Or type a message..."
              className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button 
              onClick={handleSendText} 
              disabled={!textInput.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Live Conversation */}
          {(transcript || aiResponse) && (
            <div className="space-y-3">
              {transcript && (
                <div className="p-3 bg-muted/30 border border-border rounded-lg">
                  <div className="flex items-center mb-2">
                    <MessageSquare className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-sm font-medium text-foreground">You said:</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {transcript}
                  </p>
                </div>
              )}
              {aiResponse && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Volume2 className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {currentScenario ? 'AI Coach' : 'AI Response'}:
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    {aiResponse}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <div className="p-4 bg-muted/20 border border-border rounded-xl">
        <h4 className="font-medium text-foreground mb-2">💡 Try saying:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• "Help me practice a difficult customer conversation"</li>
          <li>• "I need feedback on my communication style"</li>
          <li>• "Let's role-play a healthcare consultation"</li>
        </ul>
      </div>
    </div>
  );
};

export default CompactVoiceInterface;

