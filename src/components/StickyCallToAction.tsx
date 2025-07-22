import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";

const StickyCallToAction = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const heroHeight = window.innerHeight;
      
      // Show sticky CTA after scrolling past hero section
      setIsVisible(scrollPosition > heroHeight && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-6 z-40 animate-fade-in">
      <div className="bg-card/95 backdrop-blur-xl rounded-2xl p-4 shadow-glow border border-border/50">
        <div className="flex items-center gap-3">
          <Button 
            size="sm"
            className="bg-gradient-primary hover:shadow-glow font-semibold min-h-[44px] px-6"
            onClick={() => scrollToSection('signup')}
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={() => setIsDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickyCallToAction;