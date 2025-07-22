
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Send, Users, MessageSquare, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
import { useScenarioPrompts } from '@/hooks/useScenarioPrompts';
import { useToast } from '@/hooks/use-toast';
import { HEALTHCARE_SCENARIOS, Scenario } from '@/utils/scenarioPrompts';

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
    currentScenario,
    connectionError,
    connect,
    startAudioCapture,
    stopAudioCapture,
    sendTextMessage,
    disconnect,
    retryConnection
  } = useRealtimeVoice();

  // Use Supabase scenarios if available, fallback to static ones
  const { scenarios, loading: scenariosLoading, error: scenariosError } = useScenarioPrompts();
  const availableScenarios = scenarios.length > 0 ? scenarios : HEALTHCARE_SCENARIOS;

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

  // Show scenario selection only if no scenario selected or fully disconnected
  const showScenarioSelection = !currentScenario && !isConnected && !isConnecting;

  return (
    <div className="w-full space-y-6">
      {/* Scenario Selection */}
      {showScenarioSelection && (
        <Card className="p-6 bg-primary border-primary/20 shadow-xl">
          <h3 className="text-lg font-semibold text-primary-foreground mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Choose Your Training Scenario
          </h3>
          
          {scenariosLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-foreground" />
              <span className="ml-2 text-primary-foreground">Loading scenarios...</span>
            </div>
          )}
          
          {scenariosError && (
            <div className="flex items-center p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-destructive mr-2" />
              <span className="text-destructive text-sm">
                Could not load scenarios from database. Using default scenarios.
              </span>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            {availableScenarios.map((scenario) => (
              <Button
                key={scenario.id}
                onClick={() => handleConnectWithScenario(scenario)}
                variant="outline"
                className="h-auto p-4 text-left flex-col items-start border-white/30 hover:border-white/50 hover:bg-white/10 text-white bg-white/5"
              >
                <div className="font-medium mb-1 text-white">{scenario.title}</div>
                <div className="text-sm text-white/90">{scenario.description}</div>
              </Button>
            ))}
          </div>
          
          <div className="text-center pt-4 border-t border-primary-foreground/20">
            <Button 
              onClick={handleConnect} 
              variant="ghost"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              Or connect without a scenario
            </Button>
          </div>
        </Card>
      )}

      {/* Selected Scenario Instructions - Show immediately when scenario is selected */}
      {currentScenario && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Your Role: {currentScenario.title}
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            {currentScenario.description}
          </p>
          <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            💡 {isConnected 
              ? "Start speaking when ready - the AI will play the other role and guide you through the scenario."
              : "Connecting to voice system..."
            }
          </div>
        </Card>
      )}

      {/* Connection Status */}
      {(currentScenario || isConnected || isConnecting || connectionError) && (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-lg">
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
              {currentScenario && (
                <span className="text-sm text-muted-foreground">
                  Selected scenario: {currentScenario.title}
                </span>
              )}
              {connectionError && (
                <span className="text-sm text-destructive">
                  {connectionError}
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

      {/* Voice Controls - Show when connected */}
      {isConnected && (
        <div className="space-y-4">
          {/* Microphone Status Banner */}
          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="font-medium text-green-800 dark:text-green-200">
                {isRecording ? 'Listening - Speak now!' : 'Microphone ready - Click to start speaking'}
              </span>
            </div>
            {!isRecording && (
              <p className="text-sm text-green-700 dark:text-green-300">
                The AI will hear you and respond naturally in voice
              </p>
            )}
          </div>

          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={isRecording ? stopAudioCapture : handleStartAudio}
              size="lg"
              className={`${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop Speaking
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Start Speaking
                </>
              )}
            </Button>

            <div className="flex items-center space-x-2 text-sm">
              {isAISpeaking ? (
                <div className="flex items-center text-blue-500">
                  <Volume2 className="w-4 h-4 mr-1" />
                  <span>AI Responding</span>
                  <div className="ml-2 flex space-x-1">
                    <div className="w-1 h-3 bg-blue-500 animate-pulse"></div>
                    <div className="w-1 h-2 bg-blue-500 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-4 bg-blue-500 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <VolumeX className="w-4 h-4 mr-1" />
                  <span>AI Ready</span>
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

          {/* Live Conversation Transcript */}
          <Card className="p-4">
            <h4 className="font-medium text-foreground mb-3 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Conversation Transcript
            </h4>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {!transcript && !aiResponse ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Conversation will appear here as you speak...
                </p>
              ) : (
                <>
                  {transcript && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">You:</span>
                      </div>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        {transcript}
                      </p>
                    </div>
                  )}
                  {aiResponse && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Volume2 className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {currentScenario ? 'AI Coach' : 'AI'} (spoken aloud):
                        </span>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {aiResponse}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Quick Tips - Only show when no scenario selected */}
      {showScenarioSelection && (
        <div className="p-4 bg-muted/30 border border-muted rounded-xl">
          <h4 className="font-medium text-foreground mb-2">💡 Choose a scenario above or try saying:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• "Help me practice a difficult customer conversation"</li>
            <li>• "I need feedback on my communication style"</li>
            <li>• "Let's role-play a healthcare consultation"</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompactVoiceInterface;
