import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import UseCasesSection from "@/components/UseCasesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import VoiceAISection from "@/components/VoiceAISection";
import SocialProofSection from "@/components/SocialProofSection";
import SignupSection from "@/components/SignupSection";
import Footer from "@/components/Footer";
import VoiceInterface from "@/components/VoiceInterface";

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
          <VoiceInterface />
        </div>
      </section>
      
      <SocialProofSection />
      <SignupSection />
      <Footer />
    </div>
  );
};

export default Index;
