import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import UseCasesSection from "@/components/UseCasesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import VoiceAISection from "@/components/VoiceAISection";
import SocialProofSection from "@/components/SocialProofSection";
import SignupSection from "@/components/SignupSection";
import Footer from "@/components/Footer";
import RealtimeVoiceInterface from "@/components/RealtimeVoiceInterface";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <ProblemSection />
      <UseCasesSection />
      <HowItWorksSection />
      <VoiceAISection />
      
      {/* Voice Demo Section */}
      <section id="voice-demo" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Real-Time Voice Coaching</h2>
            <p className="text-muted-foreground">Experience natural voice conversations with AI-powered coaching</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <RealtimeVoiceInterface />
          </div>
        </div>
      </section>
      
      <SocialProofSection />
      <SignupSection />
      <Footer />
    </div>
  );
};

export default Index;
