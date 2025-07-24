
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Play, Headset, Heart, Scale, RefreshCw, AlertTriangle, Users, CheckCircle, Loader2, Zap } from 'lucide-react';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
import { useScenarioPrompts } from '@/hooks/useScenarioPrompts';
import { useToast } from '@/hooks/use-toast';
import { Scenario } from '@/utils/scenarioPrompts';
import AudioDiagnostics from '@/components/AudioDiagnostics';

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
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
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
    connectionStable,
    hasError,
    isReadyToStart,
    isScenarioStarted,
    connectionQuality,
    retryCount,
    connect,
    startScenario,
    startAudioCapture,
    stopAudioCapture,
    disconnect,
    retryConnection
  } = useRealtimeVoice();

  const { scenarios, loading: scenariosLoading, error: scenariosError } = useScenarioPrompts();

  // Enhanced connection state management
  useEffect(() => {
    if (isReadyToStart && !isScenarioStarted && currentScenario) {
      toast({
        title: "🎯 Voice Session Ready",
        description: "Connection stable. Click 'Begin Roleplay' to start the conversation.",
      });
    }
  }, [isReadyToStart, isScenarioStarted, currentScenario, toast]);

  // Show connection quality feedback
  useEffect(() => {
    if (connectionQuality === 'poor' && isConnecting) {
      toast({
        title: "⚠️ Connection Quality",
        description: "Detecting connection issues. Retrying...",
        variant: "destructive",
      });
    }
  }, [connectionQuality, isConnecting, toast]);

  // Filter scenarios by selected use case
  const filteredScenarios = scenarios.filter(scenario => 
    scenario.category === selectedUseCase
  ).slice(0, 4);

  const requestAudioPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioPermissionGranted(true);
      
      toast({
        title: "🎤 Audio Ready",
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
    console.log('🎯 User clicked Start Voice Session for:', scenario.title);
    setConnectionAttempts(prev => prev + 1);
    
    if (!audioPermissionGranted) {
      await requestAudioPermission();
      if (!audioPermissionGranted) return;
    }

    try {
      await connect(scenario);
      toast({
        title: "🔗 Connecting to Sharpen",
        description: "Establishing secure voice connection...",
      });
    } catch (error) {
      console.error('🎯 Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "We couldn't connect. Please refresh and try again.",
        variant: "destructive",
      });
    }
  };

  const handleBeginRoleplay = async () => {
    console.log('🎯 User clicked Begin Roleplay');
    try {
      await startScenario();
      toast({
        title: "🎭 Roleplay Started",
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
  };

  const resetDemo = () => {
    disconnect();
    setAudioPermissionGranted(false);
    setConnectionAttempts(0);
  };

  const handleRetry = () => {
    if (currentScenario) {
      retryConnection();
    }
  };

  const handleDismissError = () => {
    disconnect();
  };

  // Enhanced connection status display
  const getConnectionStatusInfo = () => {
    if (hasError) {
      return {
        text: 'Connection Error',
        color: 'bg-red-500',
        icon: AlertTriangle
      };
    }
    
    if (isScenarioStarted) {
      return {
        text: 'Live Roleplay - Speaking with AI',
        color: 'bg-green-500',
        icon: Users
      };
    }
    
    if (isReadyToStart) {
      return {
        text: 'Ready to Begin Roleplay',
        color: 'bg-blue-500',
        icon: CheckCircle
      };
    }
    
    if (isConnecting) {
      return {
        text: connectionStable ? 'Finalizing Connection...' : 'Connecting to Sharpen...',
        color: 'bg-yellow-500 animate-pulse',
        icon: Loader2
      };
    }
    
    return {
      text: 'Disconnected',
      color: 'bg-gray-400',
      icon: AlertTriangle
    };
  };

  const statusInfo = getConnectionStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="w-full space-y-12 py-16 px-4">
        {/* Header Section - Sharpen Branding */}
        <div className="text-center space-y-6">
          <div className="space-y-2">
            {/* Sharpen Logo */}
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-glow">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-primary font-inter">SHARPEN</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground font-inter tracking-tight">
              AI Voice Coaching Platform
            </h1>
            <p className="text-xl text-foreground/90 font-medium">
              Critical Conversation Training
            </p>
          </div>

          {/* Central Icon Set */}
          <div className="flex items-center justify-center space-x-8 py-8">
            <div className="w-16 h-16 bg-background-secondary rounded-2xl flex items-center justify-center shadow-glow">
              <Mic className="w-8 h-8 text-foreground" />
            </div>
            <div className="text-foreground/60 text-2xl">→</div>
            <div className="w-16 h-16 bg-background-secondary rounded-2xl flex items-center justify-center shadow-glow">
              <Users className="w-8 h-8 text-foreground" />
            </div>
            <div className="text-foreground/60 text-2xl">=</div>
            <div className="w-16 h-16 bg-background-secondary rounded-2xl flex items-center justify-center shadow-glow">
              <Heart className="w-8 h-8 text-foreground" />
            </div>
          </div>
          
          <p className="text-lg text-foreground/80 max-w-4xl mx-auto leading-relaxed">
            AI-powered voice simulation for customer service, healthcare, and compliance training that drives measurable outcomes
          </p>
        </div>

        {/* Enhanced Use Case Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-background-secondary/50 backdrop-blur-sm rounded-2xl p-2 gap-2 shadow-elegant border border-border/20">
            {Object.entries(useCaseLabels).map(([key, label]) => {
              const IconComponent = useCaseIcons[key as UseCase];
              const isSelected = selectedUseCase === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedUseCase(key as UseCase)}
                  className={`px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-3 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-glow transform scale-105'
                      : 'text-foreground/70 hover:text-foreground hover:bg-background-secondary/50 hover:shadow-md'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Use Case Description */}
        <div className="text-center">
          <p className="text-foreground/80 max-w-2xl mx-auto text-lg">
            {useCaseDescriptions[selectedUseCase]}
          </p>
        </div>

        {/* Error Display for Scenarios */}
        {scenariosError && (
          <Card className="p-6 max-w-4xl mx-auto bg-destructive/10 border-destructive/20 backdrop-blur-sm">
            <div className="text-center text-destructive-foreground">
              <p className="font-semibold">Failed to load scenarios</p>
              <p className="text-sm mt-1 opacity-80">{scenariosError}</p>
            </div>
          </Card>
        )}

        {/* Scenario Selection - Only show when no current scenario */}
        {!currentScenario && (
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-center text-foreground font-inter">Choose Your Practice Scenario</h3>
            
            {scenariosLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-foreground/70 mt-4 text-lg">Loading scenarios...</p>
              </div>
            ) : filteredScenarios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {filteredScenarios.map((scenario) => (
                  <Card
                    key={scenario.id}
                    className="p-8 hover:shadow-glow transition-all duration-500 hover:border-primary/50 group rounded-2xl border-2 border-border/20 hover:scale-[1.02] bg-background-secondary/30 backdrop-blur-sm"
                  >
                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors font-inter">
                        {scenario.title}
                      </h4>
                      <p className="text-foreground/70 leading-relaxed line-clamp-3">
                        {scenario.description}
                      </p>
                      
                      <Button
                        onClick={() => handleStartVoiceSession(scenario)}
                        disabled={isConnecting}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl shadow-glow hover:shadow-elegant transition-all duration-300"
                      >
                        {isConnecting ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting to Sharpen...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Start Voice Session
                          </div>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-10 max-w-3xl mx-auto text-center bg-background-secondary/30 border-border/20 backdrop-blur-sm rounded-2xl">
                <p className="text-foreground font-semibold text-lg">No scenarios available for {useCaseLabels[selectedUseCase]}</p>
                <p className="text-foreground/60 text-sm mt-2">Please try a different use case or contact support.</p>
              </Card>
            )}
          </div>
        )}

        {/* Active Voice Demo - Show when we have a current scenario */}
        {currentScenario && (
          <Card className="p-10 max-w-5xl mx-auto rounded-2xl shadow-glow bg-background-secondary/30 backdrop-blur-sm border border-border/20">
            {/* Scenario Info */}
            <div className="text-center mb-6 pb-6 border-b">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {currentScenario.title}
              </h3>
              <p className="text-muted-foreground">
                {isReadyToStart && !isScenarioStarted ? 
                  'Voice session is ready. Click "Begin Roleplay" to start the conversation.' :
                  isScenarioStarted ? 
                  'You\'re now live with Sharpen. Speak naturally. Sharpen will talk back just like a real person.' :
                  isConnecting ?
                  'Setting up voice session...' :
                  'Initializing connection...'
                }
              </p>
            </div>

            {/* Enhanced Error Display */}
            {connectionError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Connection Error</div>
                    <div className="text-sm mt-1">{connectionError}</div>
                    {connectionError.includes('timeout') && (
                      <div className="text-xs mt-2 text-muted-foreground">
                        Try checking your internet connection or switching to a different network.
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleRetry} size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Retry ({retryCount}/{5})
                    </Button>
                    <Button onClick={handleDismissError} size="sm" variant="outline">
                      Choose Different Scenario
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Enhanced Connection Status */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                hasError ? 'bg-red-100 text-red-800' :
                isScenarioStarted ? 'bg-green-100 text-green-800' :
                isReadyToStart ? 'bg-blue-100 text-blue-800' :
                isConnecting ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-600'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${statusInfo.color}`}></div>
                {statusInfo.text}
                {connectionStable && isConnecting && (
                  <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                )}
              </div>
              
              {/* Connection Quality Indicator */}
              {connectionQuality !== 'unknown' && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Connection Quality: {connectionQuality === 'good' ? '🟢 Good' : '🟡 Poor'}
                  {retryCount > 0 && ` (Retry ${retryCount})`}
                </div>
              )}
            </div>

            {/* Begin Roleplay Button - Enhanced visibility */}
            {isReadyToStart && !isScenarioStarted && (
              <div className="text-center mb-6">
                <Button
                  onClick={handleBeginRoleplay}
                  size="lg"
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Users className="w-6 h-6 mr-2" />
                  Begin Roleplay
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Click to start the AI conversation - the AI will speak first!
                </p>
              </div>
            )}

            {/* Voice Controls - Only show during active scenario */}
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
                        Click to start speaking
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

            {/* Audio Diagnostics - Show during active scenario */}
            {isScenarioStarted && (
              <div className="mt-6">
                <AudioDiagnostics 
                  isRecording={isRecording}
                  isAISpeaking={isAISpeaking}
                  audioLevel={0} // You can add actual audio level detection later
                />
              </div>
            )}

            {/* Action Buttons */}
            {(isConnected || isConnecting) && (
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
          <Card className="p-12 max-w-3xl mx-auto text-center rounded-2xl border-2 border-primary/20 bg-background-secondary/30 backdrop-blur-sm shadow-glow">
            <div className="space-y-8">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-glow">
                <Mic className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground font-inter">Enable Voice Features</h3>
                <p className="text-foreground/80 text-lg">
                  Sharpen needs microphone access to provide voice-based roleplay training.
                </p>
              </div>
              <Button 
                onClick={requestAudioPermission} 
                className="bg-primary hover:bg-primary/90 px-10 py-4 text-lg font-semibold shadow-glow hover:shadow-elegant transition-all duration-300 rounded-xl"
              >
                <Mic className="w-5 h-5 mr-3" />
                Enable Microphone
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VoiceDemo;
