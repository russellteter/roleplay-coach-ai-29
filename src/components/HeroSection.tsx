
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroImage from "@/assets/hero-voice-coaching.jpg";

const HeroSection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="pt-20 pb-16 bg-gradient-subtle overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[85vh]">
          {/* Left Column - Content */}
          <div className="fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-foreground leading-tight mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Sharpen Your Voice
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Get sharper every day with AI-powered voice coaching. Practice critical conversations with 
              real-time feedback for customer support, healthcare communication, and compliance training.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                size="lg"
                className="bg-gradient-primary hover:shadow-glow text-lg px-8 py-4 font-semibold group"
                onClick={() => scrollToSection('signup')}
              >
                Get Sharper Today
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-primary/30 text-primary hover:bg-primary/10 text-lg px-8 py-4 font-semibold group"
                onClick={() => scrollToSection('voice-demo')}
              >
                <Play className="w-5 h-5 mr-2" />
                Try Voice Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full pulse-voice"></div>
                Powered by OpenAI
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                Real-Time Feedback
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                HIPAA Compliant
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image with Right-to-left fade */}
          <div className="relative lg:h-[650px] fade-in">
            <div className="absolute inset-0 bg-gradient-primary rounded-3xl opacity-15 blur-2xl"></div>
            <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden shadow-elegant hover-scale">
              <img 
                src={heroImage} 
                alt="AI Voice Coaching Interface" 
                className="w-full h-full object-cover"
              />
              {/* Right-to-left fade overlay */}
              <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/40 to-transparent"></div>
              {/* Accent gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/10 to-accent/15"></div>
            </div>
            
            {/* Floating Voice Indicator */}
            <div className="absolute bottom-8 left-8 bg-background/95 backdrop-blur-lg rounded-2xl p-6 shadow-elegant">
              <div className="flex items-center gap-4">
                <div className="waveform">
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  AI Coach is listening...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
