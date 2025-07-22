
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const Header = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 w-full bg-background/90 backdrop-blur-lg border-b border-border z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-heading font-bold text-foreground">
              Sharpen
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-muted-foreground hover:text-foreground transition-colors link-animated font-medium"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('use-cases')}
              className="text-muted-foreground hover:text-foreground transition-colors link-animated font-medium"
            >
              Use Cases
            </button>
            <button 
              onClick={() => scrollToSection('voice-demo')}
              className="text-muted-foreground hover:text-foreground transition-colors link-animated font-medium"
            >
              Voice Demo
            </button>
          </nav>

          {/* CTA Button */}
          <Button 
            className="hidden sm:flex bg-gradient-primary hover:shadow-glow font-semibold"
            onClick={() => scrollToSection('signup')}
          >
            Get Sharper Today
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
