
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Play, Headset, Heart, Scale, RefreshCw, AlertTriangle, Users } from 'lucide-react';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
import { useScenarioPrompts } from '@/hooks/useScenarioPrompts';
import { useToast } from '@/hooks/use-toast';
import { Scenario } from '@/utils/scenarioPrompts';

type UseCase = 'customer-support' | 'healthcare' | 'compliance-hr';

const useCaseLabels = {
  'customer-support': 'Customer Support',
  'healthcare': 'Healthcare Communication',
  'compliance-hr': 'Compliance & HR'
};

const useCaseDescriptions = {
  'customer-support': 'Practice handling difficult customers, technical issues, and service complaints with empathy and efficiency.',
  'healthcare': 'Build empathy and clarity for patient interactions, sensitive conversations, and clinical communications.',
  'compliance-hr': 'Navigate sensitive workplace conversations, policy discussions, and compliance matters with confidence.'
};

const useCaseIcons = {
  'customer-support': Headset,
  'healthcare': Heart,
  'compliance-hr': Scale,
};

const useCaseColors = {
  'customer-support': 'bg-blue-500 text-white hover:bg-blue-600',
  'healthcare': 'bg-green-500 text-white hover:bg-green-600',
  'compliance-hr': 'bg-purple-500 text-white hover:bg-purple-600',
};

const VoiceDemo = () => {
  const { toast } = useToast();
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase>('customer-support');
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
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
    connectionError,
    isReadyToStart,
    isScenarioStarted,
    connect,
    startScenario,
    startAudioCapture,
    stopAudioCapture,
    disconnect,
    retryConnection,
    audioContext
  } = useRealtimeVoice();

  const { scenarios, loading: scenariosLoading, error: scenariosError } = useScenarioPrompts();

  // Filter scenarios by selected use case
  const filteredScenarios = scenarios.filter(scenario => 
    scenario.category === selectedUseCase
  ).slice(0, 4); // Only show 4 scenarios per use case

  const requestAudioPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioPermissionGranted(true);
      
      // Resume audio context if suspended
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      toast({
        title: "Audio Ready",
        description: "Microphone access granted. You can now start voice conversations.",
      });
    } catch (error) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice features.",
        variant: "destructive",
      });
    }
  };

  const handleStartVoiceSession = async (scenario: Scenario) => {
    if (!audioPermissionGranted) {
      await requestAudioPermission();
      if (!audioPermissionGranted) return;
    }

    try {
      await connect(scenario);
      toast({
        title: "Voice Session Started",
        description: "Microphone is ready. Click 'Begin Roleplay' to start the conversation.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "We couldn't connect. Please refresh and try again, or check your audio settings.",
        variant: "destructive",
      });
    }
  };

  const handleBeginRoleplay = async () => {
    try {
      await startScenario();
      toast({
        title: "Roleplay Started",
        description: "AI is now speaking. The conversation has begun!",
      });
    } catch (error) {
      toast({
        title: "Failed to Start Roleplay",
        description: "Could not start the scenario. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartSpeaking = async () => {
    if (!audioPermissionGranted) {
      await requestAudioPermission();
      return;
    }

    try {
      await startAudioCapture();
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // Apply volume to audio context if available
    if (audioContext) {
      // Volume control will be handled by the audio queue
    }
  };

  const resetDemo = () => {
    disconnect();
    setAudioPermissionGranted(false);
  };

  const handleRetry = () => {
    if (currentScenario) {
      retryConnection();
    }
  };

  const handleDismissError = () => {
    // Clear error by attempting to disconnect and reset state
    disconnect();
  };

  return (
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Practice the Conversations That Matter Most — Live with AI
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Speak directly with Sharpen, your voice-based AI role-play coach. Choose a scenario and start talking — it talks back.
        </p>
      </div>

      {/* Enhanced Use Case Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-muted rounded-xl p-2 gap-2">
          {Object.entries(useCaseLabels).map(([key, label]) => {
            const IconComponent = useCaseIcons[key as UseCase];
            const isSelected = selectedUseCase === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedUseCase(key as UseCase)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isSelected
                    ? useCaseColors[key as UseCase] + ' shadow-lg transform scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50 hover:shadow-md'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Use Case Description */}
      <div className="text-center">
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {useCaseDescriptions[selectedUseCase]}
        </p>
      </div>

      {/* Error Display for Scenarios */}
      {scenariosError && (
        <Card className="p-6 max-w-4xl mx-auto bg-red-50 border-red-200">
          <div className="text-center text-red-600">
            <p className="font-medium">Failed to load scenarios</p>
            <p className="text-sm mt-1">{scenariosError}</p>
          </div>
        </Card>
      )}

      {/* Scenario Selection */}
      {!currentScenario && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-center">Choose Your Practice Scenario</h3>
          
          {scenariosLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading scenarios...</p>
            </div>
          ) : filteredScenarios.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {filteredScenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  className="p-6 hover:shadow-xl transition-all duration-300 hover:border-primary/50 group rounded-xl border-2 hover:scale-[1.02] bg-gradient-to-br from-background to-muted/20"
                >
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {scenario.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {scenario.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-primary text-sm font-medium group-hover:text-primary/80 transition-colors">
                        <Play className="w-4 h-4 mr-2" />
                        <span>Start Voice Session</span>
                      </div>
                      <div className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                        Voice Practice
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleStartVoiceSession(scenario)}
                      disabled={isConnecting}
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                    >
                      {isConnecting ? 'Connecting...' : 'Start Voice Session'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 max-w-2xl mx-auto text-center bg-yellow-50 border-yellow-200">
              <p className="text-yellow-800 font-medium">No scenarios available for {useCaseLabels[selectedUseCase]}</p>
              <p className="text-yellow-600 text-sm mt-1">Please try a different use case or contact support.</p>
            </Card>
          )}
        </div>
      )}

      {/* Active Voice Demo */}
      {(isConnected || isConnecting || currentScenario) && (
        <Card className="p-8 max-w-4xl mx-auto rounded-xl shadow-lg">
          {/* Scenario Info */}
          {currentScenario && (
            <div className="text-center mb-6 pb-6 border-b">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {currentScenario.title}
              </h3>
              <p className="text-muted-foreground">
                {isReadyToStart && !isScenarioStarted ? 
                  'Voice session is ready. Click "Begin Roleplay" to start the conversation.' :
                  isScenarioStarted ? 
                  'You\'re now live with Sharpen. Speak naturally. Sharpen will talk back just like a real person.' :
                  'Setting up voice session...'
                }
              </p>
            </div>
          )}

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
                    Choose Different Scenario
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Connection Status */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isConnected && isScenarioStarted ? 'bg-green-100 text-green-800' :
              isConnected && isReadyToStart ? 'bg-blue-100 text-blue-800' :
              isConnecting ? 'bg-yellow-100 text-yellow-800' :
              connectionError ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isConnected && isScenarioStarted ? 'bg-green-500' :
                isConnected && isReadyToStart ? 'bg-blue-500' :
                isConnecting ? 'bg-yellow-500 animate-pulse' :
                connectionError ? 'bg-red-500' :
                'bg-gray-400'
              }`}></div>
              {isConnected && isScenarioStarted ? 'Live Roleplay - Speaking with AI' :
               isConnected && isReadyToStart ? 'Ready to Begin Roleplay' :
               isConnecting ? 'Connecting...' :
               connectionError ? 'Connection Error' :
               'Disconnected'}
            </div>
          </div>

          {/* Begin Roleplay Button - Only show when ready */}
          {isReadyToStart && !isScenarioStarted && (
            <div className="text-center mb-6">
              <Button
                onClick={handleBeginRoleplay}
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Users className="w-6 h-6 mr-2" />
                Begin Roleplay
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Click to start the AI conversation - the AI will speak first!
              </p>
            </div>
          )}

          {/* Voice Controls */}
          {isScenarioStarted && (
            <div className="space-y-6">
              {/* Microphone Control */}
              <div className="text-center">
                <Button
                  onClick={isRecording ? stopAudioCapture : handleStartSpeaking}
                  size="lg"
                  className={`w-20 h-20 rounded-full transition-all duration-200 ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg scale-110'
                      : 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </Button>
                
                <div className="mt-4 space-y-2">
                  {isUserSpeaking && (
                    <div className="flex items-center justify-center text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-sm font-medium">You're speaking</span>
                    </div>
                  )}
                  
                  {isAISpeaking && (
                    <div className="flex items-center justify-center text-blue-600">
                      <Volume2 className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">AI is responding</span>
                      <div className="ml-2 flex space-x-1">
                        <div className="w-1 h-3 bg-blue-600 animate-pulse"></div>
                        <div className="w-1 h-2 bg-blue-600 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-4 bg-blue-600 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  )}
                  
                  {!isRecording && !isUserSpeaking && !isAISpeaking && (
                    <p className="text-sm text-muted-foreground">
                      {isRecording ? 'Speak now - AI is listening' : 'Click to start speaking'}
                    </p>
                  )}
                </div>
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
                  className="w-24 accent-primary"
                />
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Live Transcript */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4 rounded-lg border-green-200 bg-green-50">
                  <h4 className="font-medium mb-3 text-green-800 flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    You said:
                  </h4>
                  <div className="min-h-[100px] p-3 bg-white rounded-lg border">
                    <p className="text-sm text-green-800">
                      {transcript || "Your speech will appear here..."}
                    </p>
                  </div>
                </Card>

                <Card className="p-4 rounded-lg border-blue-200 bg-blue-50">
                  <h4 className="font-medium mb-3 text-blue-800 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    AI responded:
                  </h4>
                  <div className="min-h-[100px] p-3 bg-white rounded-lg border">
                    <p className="text-sm text-blue-800">
                      {aiResponse || "AI response will appear here..."}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isConnected && (
            <div className="flex justify-center space-x-3 mt-6 pt-6 border-t">
              <Button onClick={resetDemo} variant="outline" className="hover:shadow-md transition-all">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Another Scenario
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Enhanced Audio Permission Request */}
      {!audioPermissionGranted && !isConnected && !currentScenario && (
        <Card className="p-8 max-w-2xl mx-auto text-center rounded-xl border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Mic className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Enable Voice Features</h3>
              <p className="text-muted-foreground">
                Sharpen needs microphone access to provide voice-based roleplay training.
              </p>
            </div>
            <Button onClick={requestAudioPermission} className="bg-primary hover:bg-primary/90 px-8 py-3 shadow-md hover:shadow-lg transition-all">
              <Mic className="w-4 h-4 mr-2" />
              Enable Microphone
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VoiceDemo;
