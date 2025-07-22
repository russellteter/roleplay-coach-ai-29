
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
    <section id="voice-demo" className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-y border-border/50 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-20 left-20 w-32 h-32 border border-primary/20 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-accent/20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 border border-muted-foreground/10 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-card/80 backdrop-blur-sm px-6 py-3 rounded-full border border-border/50 mb-6 shadow-card">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Powered by OpenAI's ChatGPT + Voice Mode</span>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Content */}
          <div className="text-foreground">
            <h2 className="text-4xl sm:text-5xl font-heading font-bold mb-6 leading-tight">
              Real-Time Voice Coaching
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
              Experience natural conversations with instant feedback. Our AI understands context, emotion, and provides coaching in real-time.
            </p>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2 text-lg">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - REAL-TIME VOICE DEMO */}
          <div className="relative">
            <Card className="p-8 bg-card/50 backdrop-blur-xl border border-border/50 shadow-glow">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-3">
                  Try Live Voice Demo
                </h3>
                <p className="text-muted-foreground">
                  Connect and practice conversations with real-time AI coaching
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
