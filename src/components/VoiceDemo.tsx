
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Play } from 'lucide-react';
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
    connect,
    startAudioCapture,
    stopAudioCapture,
    disconnect,
    retryConnection,
    audioContext
  } = useRealtimeVoice();

  const { scenarios, loading: scenariosLoading } = useScenarioPrompts();

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

  const handleScenarioSelect = async (scenario: Scenario) => {
    if (!audioPermissionGranted) {
      await requestAudioPermission();
      if (!audioPermissionGranted) return;
    }

    try {
      await connect(scenario);
      toast({
        title: "Starting Voice Conversation",
        description: `Beginning ${scenario.title} roleplay...`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not start voice conversation. Please try again.",
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

      {/* Use Case Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-muted rounded-lg p-1">
          {Object.entries(useCaseLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedUseCase(key as UseCase)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                selectedUseCase === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Use Case Description */}
      <div className="text-center">
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {useCaseDescriptions[selectedUseCase]}
        </p>
      </div>

      {/* Scenario Selection */}
      {!currentScenario && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-center">Choose Your Practice Scenario</h3>
          
          {scenariosLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading scenarios...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {filteredScenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30 group"
                  onClick={() => handleScenarioSelect(scenario)}
                >
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {scenario.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {scenario.description}
                    </p>
                    <div className="flex items-center text-primary text-sm">
                      <Play className="w-4 h-4 mr-2" />
                      <span>Start Voice Conversation</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Voice Demo */}
      {(isConnected || isConnecting || currentScenario) && (
        <Card className="p-8 max-w-4xl mx-auto">
          {/* Scenario Info */}
          {currentScenario && (
            <div className="text-center mb-6 pb-6 border-b">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {currentScenario.title}
              </h3>
              <p className="text-muted-foreground">
                You're now live with Sharpen. Speak naturally. Sharpen will talk back just like a real person.
              </p>
            </div>
          )}

          {/* Connection Status */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isConnected ? 'bg-green-100 text-green-800' :
              isConnecting ? 'bg-yellow-100 text-yellow-800' :
              connectionError ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-500' :
                isConnecting ? 'bg-yellow-500 animate-pulse' :
                connectionError ? 'bg-red-500' :
                'bg-gray-400'
              }`}></div>
              {isConnected ? 'Connected - Ready to Practice' :
               isConnecting ? 'Connecting...' :
               connectionError ? 'Connection Error' :
               'Disconnected'}
            </div>
          </div>

          {/* Voice Controls */}
          {isConnected && (
            <div className="space-y-6">
              {/* Microphone Control */}
              <div className="text-center">
                <Button
                  onClick={isRecording ? stopAudioCapture : handleStartSpeaking}
                  size="lg"
                  className={`w-20 h-20 rounded-full ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </Button>
                
                <div className="mt-3 space-y-2">
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
                  className="w-24"
                />
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Live Transcript */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-green-800">You said:</h4>
                  <div className="min-h-[100px] p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      {transcript || "Your speech will appear here..."}
                    </p>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-blue-800">AI responded:</h4>
                  <div className="min-h-[100px] p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {aiResponse || "AI response will appear here..."}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Error State */}
          {connectionError && (
            <div className="text-center space-y-4">
              <p className="text-red-600">{connectionError}</p>
              <Button onClick={retryConnection} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3 mt-6 pt-6 border-t">
            <Button onClick={resetDemo} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Another Scenario
            </Button>
          </div>
        </Card>
      )}

      {/* Audio Permission Request */}
      {!audioPermissionGranted && !isConnected && !currentScenario && (
        <Card className="p-6 max-w-2xl mx-auto text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Mic className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Enable Voice Features</h3>
            <p className="text-muted-foreground">
              Sharpen needs microphone access to provide voice-based roleplay training.
            </p>
            <Button onClick={requestAudioPermission} className="bg-primary hover:bg-primary/90">
              Enable Microphone
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VoiceDemo;
