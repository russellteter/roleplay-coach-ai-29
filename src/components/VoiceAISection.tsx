import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Brain, Volume2, Zap } from "lucide-react";

const VoiceAISection = () => {
  const features = [
    {
      icon: Brain,
      title: "Advanced AI Understanding",
      description: "Context-aware responses that understand nuance, emotion, and conversation flow."
    },
    {
      icon: Volume2,
      title: "Natural Voice Synthesis",
      description: "Human-like speech patterns with adjustable tone, pace, and personality settings."
    },
    {
      icon: Zap,
      title: "Real-Time Processing",
      description: "Instant feedback and coaching suggestions without breaking conversation flow."
    }
  ];

  return (
    <section className="py-20 bg-gradient-accent relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-accent-foreground rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-accent-foreground rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-accent-foreground rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-accent-foreground">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-6">
              Powered by OpenAI's ChatGPT + Voice Mode
            </h2>
            <p className="text-xl text-accent-foreground/90 mb-8 leading-relaxed">
              Experience the next generation of voice AI technology. Our integration with OpenAI's advanced 
              language models delivers natural-sounding conversations with real-time context understanding.
            </p>

            {/* Features */}
            <div className="space-y-6 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent-foreground/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-accent-foreground/80 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              variant="outline-hero" 
              size="lg"
              className="bg-accent-foreground text-accent hover:bg-accent-foreground/90"
              onClick={() => {
                const voiceDemo = document.getElementById('voice-demo');
                if (voiceDemo) {
                  voiceDemo.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <Mic className="w-5 h-5" />
              Try a Voice Demo
            </Button>
          </div>

          {/* Right Column - Voice Demo moved from separate section */}
          <div className="relative">
            <Card className="p-8 bg-accent-foreground/10 backdrop-blur-sm border-accent-foreground/20">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-accent-foreground mb-6">
                  Real-Time Voice Demo
                </h3>
                
                {/* Waveform Visualization */}
                <div className="bg-accent-foreground/20 rounded-xl p-8 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="waveform">
                      <div className="waveform-bar bg-accent-foreground"></div>
                      <div className="waveform-bar bg-accent-foreground"></div>
                      <div className="waveform-bar bg-accent-foreground"></div>
                      <div className="waveform-bar bg-accent-foreground"></div>
                      <div className="waveform-bar bg-accent-foreground"></div>
                      <div className="waveform-bar bg-accent-foreground"></div>
                      <div className="waveform-bar bg-accent-foreground"></div>
                    </div>
                  </div>
                  <p className="text-accent-foreground/80 text-sm">
                    "How can I handle an upset customer who wants a refund?"
                  </p>
                </div>

                {/* AI Response */}
                <div className="bg-accent-foreground/10 rounded-xl p-6 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-accent-foreground/20 rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-accent-foreground text-sm mb-2">
                        "I understand your frustration. Let me see what I can do to make this right for you. 
                        Can you tell me more about what happened?"
                      </p>
                      <p className="text-accent-foreground/60 text-xs">
                        ✓ Empathetic tone • ✓ Open-ended question • ✓ Solution-focused
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoiceAISection;