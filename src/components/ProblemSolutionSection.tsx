import { Card } from "@/components/ui/card";
import { CheckCircle, Users, Clock, Target } from "lucide-react";

const ProblemSolutionSection = () => {
  const features = [
    {
      icon: Users,
      title: "Live AI role-play with realistic scenarios",
      description: "Practice critical conversations in real-time"
    },
    {
      icon: Target,
      title: "Instant, actionable feedback on tone & content",
      description: "Get immediate coaching on your performance"
    },
    {
      icon: Clock,
      title: "Fully customizable to your scripts & policies",
      description: "Tailored training for your specific needs"
    }
  ];

  return (
    <section className="py-20 bg-background" id="problem-solution">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Problem Statement */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <h2 className="text-4xl font-heading font-bold text-foreground mb-6">
              Call center agents spend weeks onboarding; coaching is inconsistent and costly.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Traditional training methods leave gaps in performance and confidence. It's time for a better approach.
            </p>
          </div>
        </div>

        {/* Solution Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 text-center card-elegant">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;