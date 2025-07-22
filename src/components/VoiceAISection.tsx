
import { Card } from "@/components/ui/card";
import { Brain, Volume2, Zap, Users } from "lucide-react";
import CompactVoiceInterface from "@/components/CompactVoiceInterface";

const VoiceAISection = () => {
  const features = [
    {
      icon: Brain,
      title: "Scenario-Based Training",
      description: "Pre-built healthcare communication scenarios with expert-crafted prompts for realistic practice."
    },
    {
      icon: Volume2,
      title: "Natural Voice Synthesis",
      description: "Human-like speech patterns with adjustable tone, pace, and personality settings."
    },
    {
      icon: Users,
      title: "Interactive Roleplay",
      description: "Engage in realistic conversations with AI that responds naturally and provides constructive feedback."
    },
    {
      icon: Zap,
      title: "Real-Time Processing",
      description: "Instant feedback and coaching suggestions without breaking conversation flow."
    }
  ];

  return (
    <section id="voice-demo" className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-y border-border/50 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-32 h-32 border border-primary/20 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-secondary/20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 border border-muted-foreground/10 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-card/80 backdrop-blur-sm px-6 py-3 rounded-full border border-border/50 mb-6 shadow-lg">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Powered by OpenAI's GPT-4o + Realtime Voice</span>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Content */}
          <div className="text-foreground">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight text-foreground">
              Real-Time Voice Coaching
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Experience natural conversations with instant feedback. Our AI understands context, emotion, and provides coaching through structured healthcare scenarios.
            </p>

            {/* Features Grid */}
            <div className="grid gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2 text-lg">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - LIVE VOICE DEMO */}
          <div className="relative">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-8 rounded-2xl shadow-2xl border border-primary/20">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-primary-foreground mb-3">
                  Try Live Voice Demo
                </h3>
                <p className="text-primary-foreground/90">
                  Connect and practice conversations with real-time AI coaching
                </p>
              </div>
              
              {/* Integration of the compact voice interface */}
              <CompactVoiceInterface />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/20 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoiceAISection;
