
import Header from "@/components/Header";
import VoiceDemo from "@/components/VoiceDemo";
import ProblemSolutionSection from "@/components/ProblemSolutionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";
import EnhancedSocialProofSection from "@/components/EnhancedSocialProofSection";
import PricingSection from "@/components/PricingSection";
import SignupSection from "@/components/SignupSection";
import Footer from "@/components/Footer";
import StickyCallToAction from "@/components/StickyCallToAction";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <StickyCallToAction />
      
      {/* Main Voice Demo Section - Replaces Hero */}
      <section className="py-20 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <VoiceDemo />
        </div>
      </section>
      
      <ProblemSolutionSection />
      <HowItWorksSection />
      <FeaturesSection />
      <EnhancedSocialProofSection />
      <PricingSection />
      
      {/* Use Cases Navigation */}
      <section className="py-20 bg-background" id="resources">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold text-foreground mb-6">
              Need More Focused Training?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Visit our specialized pages for deeper role-play scenarios in your industry
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
                  <span className="font-medium">Specialized Training</span>
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
                  <span className="font-medium">Specialized Training</span>
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
                  <span className="font-medium">Specialized Training</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
      
      <SignupSection />
      <Footer />
    </div>
  );
};

export default Index;
