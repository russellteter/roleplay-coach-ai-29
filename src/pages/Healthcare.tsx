import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RealtimeVoiceInterface from "@/components/RealtimeVoiceInterface";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Healthcare = () => {
  const features = [
    {
      icon: Heart,
      title: "Practice high-stakes clinical conversations in a safe environment",
      description: "Simulate sensitive patient interactions without real-world consequences, building confidence for critical moments."
    },
    {
      icon: Shield,
      title: "Get real-time coaching on empathy, tone, and delivery",
      description: "Receive immediate feedback on your bedside manner and communication effectiveness."
    },
    {
      icon: Users,
      title: "Reinforce clarity in critical communication moments",
      description: "Practice explaining procedures, delivering news, and coordinating care with precision and compassion."
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Demo Section */}
      <section className="pt-24 pb-16 bg-gradient-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl font-heading font-bold text-foreground mb-6">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Sharpen
              </span>{" "}
              Clinical Communication Through Realistic Practice
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Simulate voice conversations that build empathy, clarity, and professionalism for every patient interaction.
            </p>
          </div>

          {/* Live Voice Demo */}
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-3xl p-8 mb-16 border border-blue-200/50">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-heading font-bold text-blue-900 mb-4">
                  Try Live Voice Demo
                </h3>
                <p className="text-blue-700 mb-6">
                  Click to try a live healthcare communication scenario. Whether you're delivering instructions or breaking tough news, Sharpen helps you practice with empathy and precision.
                </p>
                <div className="text-sm text-blue-600 font-medium mb-4">
                  Powered by OpenAI's ChatGPT in voice mode
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/30">
                <RealtimeVoiceInterface category="healthcare" />
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Navigation to Other Use Cases */}
          <div className="bg-muted/30 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Explore Other Use Cases
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link to="/customer-support">
                  Customer Support
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/compliance-hr">
                  Compliance & HR
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 bg-muted/50 rounded-full px-6 py-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-sm font-medium text-muted-foreground">
              Used by Teams at TechFlow
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Healthcare;