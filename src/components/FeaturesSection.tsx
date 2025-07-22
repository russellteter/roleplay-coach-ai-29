import { Card } from "@/components/ui/card";
import { Mic, Target, Zap, BarChart3, Shield, Clock } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Mic,
      title: "Instant Empathy Coaching",
      description: "Get real-time feedback on your tone, pace, and emotional intelligence. Increase CSAT scores by 7% through improved empathy skills.",
      highlight: "+7% CSAT Improvement"
    },
    {
      icon: Target,
      title: "Real-Time Performance Analytics",
      description: "Track conversation metrics, response quality, and coaching improvements. See measurable progress with detailed performance dashboards.",
      highlight: "100% Measurable Results"
    },
    {
      icon: Zap,
      title: "Lightning-Fast Onboarding",
      description: "Reduce agent training time from weeks to days. Get new hires conversation-ready 60% faster with AI-powered role-play scenarios.",
      highlight: "60% Faster Training"
    },
    {
      icon: BarChart3,
      title: "Custom Scenario Library",
      description: "Build unlimited scenarios tailored to your industry, policies, and common customer issues. Train for exactly what your agents face daily.",
      highlight: "Unlimited Scenarios"
    },
    {
      icon: Shield,
      title: "Quality Assurance Integration",
      description: "Seamlessly connect with your QA processes. Ensure consistent coaching standards and maintain compliance across all interactions.",
      highlight: "Full QA Integration"
    },
    {
      icon: Clock,
      title: "24/7 Practice Availability",
      description: "Agents can practice anytime, anywhere. No need to schedule coaching sessions or wait for trainer availability.",
      highlight: "Always Available"
    }
  ];

  return (
    <section className="py-20 bg-secondary/30" id="features">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-heading font-bold text-foreground mb-6">
            Features That Drive Results
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive AI coaching tools designed to transform your team's conversation skills and boost performance metrics.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 card-elegant h-full">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              
              <h3 className="text-xl font-heading font-bold text-foreground mb-4">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground mb-4 flex-grow">
                {feature.description}
              </p>
              
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent font-semibold text-sm">
                {feature.highlight}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;