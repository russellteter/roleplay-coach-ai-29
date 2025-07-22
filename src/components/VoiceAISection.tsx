
import { Card } from "@/components/ui/card";
import { Brain, Volume2, Zap } from "lucide-react";
import CompactVoiceInterface from "@/components/CompactVoiceInterface";

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
    <section id="voice-demo" className="py-20 bg-gradient-accent relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 border-2 border-accent-foreground/20 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 border-2 border-accent-foreground/20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-20 h-20 border border-accent-foreground/20 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Content */}
          <div className="text-accent-foreground">
            <h2 className="text-4xl sm:text-5xl font-heading font-bold mb-6">
              Powered by OpenAI's ChatGPT + Voice Mode
            </h2>
            <p className="text-xl text-accent-foreground/90 mb-8 leading-relaxed">
              Experience the next generation of voice AI technology. Our integration with OpenAI's advanced 
              language models delivers natural-sounding conversations with real-time context understanding.
            </p>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent-foreground/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent-foreground mb-2 text-lg">
                      {feature.title}
                    </h3>
                    <p className="text-accent-foreground/80">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - REAL-TIME VOICE DEMO */}
          <div className="relative">
            <Card className="p-8 bg-accent-foreground/10 backdrop-blur-sm border-accent-foreground/20 shadow-elegant">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-heading font-bold text-accent-foreground mb-2">
                  Real-Time Voice Demo
                </h3>
                <p className="text-accent-foreground/80">
                  Connect and start practicing conversations with AI coaching
                </p>
              </div>
              
              {/* Integration of the compact voice interface */}
              <CompactVoiceInterface />
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoiceAISection;
