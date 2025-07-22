
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

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
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
