
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroImage from "@/assets/hero-voice-coaching.jpg";

const HeroSection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="min-h-screen flex items-center pt-20 pb-16 bg-gradient-subtle overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground leading-tight mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Real-Time AI Role-Play
              </span>{" "}
              <span className="text-foreground">for Perfecting Critical Conversations</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-light max-w-lg">
              Practice live conversations, get instant tone & content feedback, and boost call quality by 20%.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 mb-12">
              <Button 
                size="lg"
                className="text-lg px-12 py-5 rounded-full shadow-glow hover:shadow-elegant transition-all duration-300 font-semibold min-h-[44px]"
                onClick={() => scrollToSection('signup')}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="font-medium">Powered by OpenAI</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="font-medium">Real-Time Coaching</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-medium">Used by Teams at TechFlow</span>
              </div>
            </div>
          </div>

          {/* Right Column - Modern Visual */}
          <div className="relative lg:h-[650px] fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl opacity-60"></div>
            <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden shadow-card border border-border/20 bg-card">
              <img 
                src={heroImage} 
                alt="AI Voice Coaching Interface" 
                className="w-full h-full object-cover opacity-90"
              />
              {/* Modern gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-transparent to-primary/20"></div>
            </div>
            
            {/* Modern Voice Indicator */}
            <div className="absolute bottom-8 left-8 bg-card/95 backdrop-blur-xl rounded-2xl p-6 shadow-glow border border-border/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-8 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-1 h-6 bg-primary/70 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-10 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-1 h-4 bg-primary/70 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-1 h-7 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span className="text-sm font-medium text-foreground">
                  AI listening & analyzing...
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
