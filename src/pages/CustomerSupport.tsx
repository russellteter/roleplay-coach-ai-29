
import Header from "@/components/Header";
import CleanVoiceInterface from "@/components/CleanVoiceInterface";
import Footer from "@/components/Footer";
import StickyCallToAction from "@/components/StickyCallToAction";
import { Button } from "@/components/ui/button";
import { ArrowRight, HeadphonesIcon, MessageSquare, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const CustomerSupport = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <StickyCallToAction />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Sharpen Your Support Skills in Real Time
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Practice voice conversations that prepare your agents to deliver fast, empathetic, and accurate customer service.
            </p>
            
            {/* Feature highlights */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <HeadphonesIcon className="w-5 h-5 text-primary" />
                <span>Role-play common support situations in real-time voice</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span>Get instant feedback on tone, clarity, and resolution</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Train for high-pressure moments like escalations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Voice Demo Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Try Live Voice Demo
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Jump into a live voice role-play and sharpen your support instincts. Choose from realistic customer service scenarios and get real-time coaching on how to improve.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <CleanVoiceInterface category="customer-support" />
          </div>
        </div>
      </section>

      {/* Navigation to other use cases */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Explore Other Training Areas
            </h2>
            <p className="text-lg text-muted-foreground">
              Practice specialized scenarios for different industries
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link to="/healthcare" className="group">
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Healthcare Communication
                </h3>
                <p className="text-muted-foreground mb-6">
                  Build empathy and clarity for patient interactions, sensitive conversations, and clinical communications.
                </p>
                <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                  <span className="font-medium">Try Healthcare Scenarios</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
            
            <Link to="/compliance-hr" className="group">
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Compliance & HR
                </h3>
                <p className="text-muted-foreground mb-6">
                  Navigate sensitive workplace conversations, policy discussions, and compliance matters with confidence.
                </p>
                <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                  <span className="font-medium">Try HR Scenarios</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default CustomerSupport;
