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
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Column - Content */}
          <div className="fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground leading-tight mb-6">
              <span className="bg-gradient-accent bg-clip-text text-transparent">
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
                variant="hero" 
                size="lg"
                onClick={() => scrollToSection('signup')}
                className="group"
              >
                Request Early Access
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline-hero" 
                size="lg"
                onClick={() => scrollToSection('how-it-works')}
                className="group"
              >
                <Play className="w-5 h-5" />
                See How It Works
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full pulse-voice"></div>
                Powered by OpenAI Voice Mode
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                HIPAA Compliant
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative lg:h-[600px] fade-in">
            <div className="absolute inset-0 bg-gradient-accent rounded-2xl opacity-10 blur-xl"></div>
            <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden shadow-elegant hover-scale">
              <img 
                src={heroImage} 
                alt="AI Voice Coaching Interface" 
                className="w-full h-full object-cover"
              />
              {/* Blurred fade-in overlay from top to middle */}
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/20 to-transparent"></div>
              {/* Gradient overlay blending to accent color */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-accent/10 to-accent/20"></div>
            </div>
            
            {/* Floating Voice Indicator */}
            <div className="absolute bottom-6 left-6 bg-background/90 backdrop-blur-sm rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="waveform">
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                </div>
                <span className="text-sm font-medium text-foreground">
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