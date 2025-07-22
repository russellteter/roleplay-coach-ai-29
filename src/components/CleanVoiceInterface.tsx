
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Send, Users, MessageSquare, RefreshCw, Play } from 'lucide-react';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
import { useScenarioPrompts } from '@/hooks/useScenarioPrompts';
import { useToast } from '@/hooks/use-toast';
import { Scenario } from '@/utils/scenarioPrompts';

interface CleanVoiceInterfaceProps {
  category: 'healthcare' | 'customer-support' | 'compliance-hr';
}

const CleanVoiceInterface = ({ category }: CleanVoiceInterfaceProps) => {
  const { toast } = useToast();
  const [textInput, setTextInput] = useState('');
  const [volume, setVolume] = useState(0.8);
  
  const {
    isConnected,
    isConnecting,
    isRecording,
    isAISpeaking,
    isUserSpeaking,
    transcript,
    aiResponse,
    currentScenario,
    selectedScenario,
    connectionError,
    connect,
    startAudioCapture,
    stopAudioCapture,
    sendTextMessage,
    setVolume: updateVolume,
    disconnect,
    retryConnection
  } = useRealtimeVoice();

  const { scenarios, loading: scenariosLoading } = useScenarioPrompts();
  
  // Filter scenarios by category and limit to 4
  const availableScenarios = scenarios.filter(scenario => 
    scenario.category === category
  ).slice(0, 4);

  const handleConnectWithScenario = async (scenario: Scenario) => {
    try {
      await connect(scenario);
      toast({
        title: "Scenario Starting",
        description: `Preparing ${scenario.title} roleplay...`,
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
      toast({
        title: "Microphone Active",
        description: "Start speaking naturally",
      });
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
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

  const handleRetry = () => {
    retryConnection();
    toast({
      title: "Retrying Connection",
      description: "Attempting to reconnect...",
    });
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    updateVolume(newVolume);
  };

  const showScenarioSelection = !selectedScenario && !isConnected && !isConnecting;

  return (
    <div className="w-full space-y-6">
      {/* Scenario Selection */}
      {showScenarioSelection && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Choose Your Practice Scenario
          </h3>
          
          {scenariosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-2 text-muted-foreground">Loading scenarios...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableScenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30 group"
                  onClick={() => handleConnectWithScenario(scenario)}
                >
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {scenario.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {scenario.description}
                    </p>
                    <div className="flex items-center text-primary text-sm pt-2">
                      <Play className="w-4 h-4 mr-2" />
                      <span>Start Voice Conversation</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Selected Scenario Instructions */}
      {selectedScenario && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Your Role: {selectedScenario.title}
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            {selectedScenario.description}
          </p>
          <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            💡 {isConnected 
              ? "Speak naturally. The AI will play the other role and guide you through the scenario."
              : "Connecting to voice system..."
            }
          </div>
        </Card>
      )}

      {/* Connection Status */}
      {(selectedScenario || isConnected || isConnecting || connectionError) && (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 
              isConnecting ? 'bg-yellow-500 animate-pulse' : 
              connectionError ? 'bg-red-500' :
              'bg-gray-400'
            }`}></div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {isConnected ? 'Connected - Ready to practice!' : 
                 isConnecting ? 'Connecting...' : 
                 connectionError ? 'Connection Error' :
                 'Disconnected'}
              </span>
              {selectedScenario && (
                <span className="text-sm text-muted-foreground">
                  {selectedScenario.title}
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
          
          <div className="flex space-x-2">
            {connectionError && !isConnecting && (
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            {(isConnected || connectionError) && (
              <Button onClick={disconnect} variant="destructive" size="sm">
                <PhoneOff className="w-4 h-4 mr-2" />
                End Session
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Voice Controls */}
      {isConnected && (
        <div className="space-y-6">
          {/* Microphone Status */}
          <div className="text-center p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              <h4 className="font-medium text-green-800 dark:text-green-200">
                {isRecording ? 'Listening - Speak now!' : 'Ready to listen'}
              </h4>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mb-4">
              The AI will hear you and respond naturally in voice
            </p>

            {/* Voice Control Button */}
            <Button
              onClick={isRecording ? stopAudioCapture : handleStartAudio}
              size="lg"
              className={`w-16 h-16 rounded-full ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>

            {/* AI Speaking Indicator */}
            {isAISpeaking && (
              <div className="flex items-center justify-center text-blue-500 mt-4">
                <Volume2 className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">AI Responding</span>
                <div className="ml-2 flex space-x-1">
                  <div className="w-1 h-3 bg-blue-500 animate-pulse"></div>
                  <div className="w-1 h-2 bg-blue-500 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-4 bg-blue-500 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center space-x-3">
            <VolumeX className="w-4 h-4 text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-32"
            />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground min-w-[3rem]">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Text Input Alternative */}
          <div className="flex space-x-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
              placeholder="Or type a message..."
              className="flex-1"
            />
            <Button 
              onClick={handleSendText} 
              disabled={!textInput.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Live Conversation Transcript */}
          <Card className="p-4">
            <h4 className="font-medium text-foreground mb-3 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Live Conversation
            </h4>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {!transcript && !aiResponse ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Conversation will appear here as you speak...
                </p>
              ) : (
                <div className="space-y-3">
                  {transcript && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded">
                      <div className="flex items-center mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">You:</span>
                      </div>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        {transcript}
                      </p>
                    </div>
                  )}
                  {aiResponse && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded">
                      <div className="flex items-center mb-1">
                        <Volume2 className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">AI Coach:</span>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {aiResponse}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Error State */}
      {connectionError && (
        <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 text-center">
            {connectionError}
          </p>
        </Card>
      )}
    </div>
  );
};

export default CleanVoiceInterface;
