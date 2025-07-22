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
            <h2 className="text-2xl font-bold mb-4">Choose Your Voice Experience</h2>
            <p className="text-muted-foreground">Try both our standard voice chat and real-time voice mode</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-center">Standard Voice Chat</h3>
              <VoiceInterface />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-center">Real-Time Voice Mode</h3>
              <RealtimeVoiceInterface />
            </div>
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
