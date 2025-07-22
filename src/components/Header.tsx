import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

const Header = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">
              Sharpen
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-muted-foreground hover:text-foreground transition-colors link-animated"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('use-cases')}
              className="text-muted-foreground hover:text-foreground transition-colors link-animated"
            >
              Use Cases
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-muted-foreground hover:text-foreground transition-colors link-animated"
            >
              Pricing
            </button>
          </nav>

          {/* CTA Button */}
          <Button 
            variant="cta"
            onClick={() => scrollToSection('signup')}
            className="hidden sm:flex"
          >
            Request Early Access
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;