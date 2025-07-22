
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import UseCasesPanelSection from "@/components/UseCasesPanelSection";
import ProblemSection from "@/components/ProblemSection";
import UseCasesSection from "@/components/UseCasesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import VoiceAISection from "@/components/VoiceAISection";
import ContextUploadSection from "@/components/ContextUploadSection";
import SocialProofSection from "@/components/SocialProofSection";
import SignupSection from "@/components/SignupSection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      
      {/* Use Cases Navigation */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
              Choose Your Use Case
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Start practicing with scenarios tailored to your industry and role
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Link to="/customer-support" className="group">
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Customer Support
                </h3>
                <p className="text-muted-foreground mb-6">
                  Practice handling difficult customers, technical issues, and service complaints with empathy and efficiency.
                </p>
                <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                  <span className="font-medium">Start Training</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
            
            <Link to="/healthcare" className="group">
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Healthcare Communication
                </h3>
                <p className="text-muted-foreground mb-6">
                  Build empathy and clarity for patient interactions, sensitive conversations, and clinical communications.
                </p>
                <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                  <span className="font-medium">Start Training</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
            
            <Link to="/compliance-hr" className="group">
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Compliance & HR
                </h3>
                <p className="text-muted-foreground mb-6">
                  Navigate sensitive workplace conversations, policy discussions, and compliance matters with confidence.
                </p>
                <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                  <span className="font-medium">Start Training</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
      
      <UseCasesPanelSection />
      <ProblemSection />
      <VoiceAISection /> {/* Now contains the real-time voice demo */}
      <ContextUploadSection />
      <UseCasesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <SignupSection />
      <Footer />
    </div>
  );
};

export default Index;
