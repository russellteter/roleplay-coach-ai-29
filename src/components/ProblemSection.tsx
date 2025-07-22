import { Card } from "@/components/ui/card";
import { AlertCircle, Users, Target } from "lucide-react";

const ProblemSection = () => {
  const problems = [
    {
      icon: AlertCircle,
      title: "Poor Training Retention",
      description: "Static e-learning fails to stick. Teams need interactive practice to build real skills."
    },
    {
      icon: Users,
      title: "No Safe Practice Space",
      description: "High-stakes conversations are too risky to learn on the job. Teams need a judgment-free environment."
    },
    {
      icon: Target,
      title: "Inconsistent Coaching",
      description: "Manual coaching doesn't scale. Teams need personalized, consistent feedback every time."
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Problem Statement */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-6">
            Traditional Training Falls Short
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            When it comes to difficult conversations, reading about it isn't enough. 
            Your team needs real practice with real feedback.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {problems.map((problem, index) => (
            <Card key={index} className="p-8 text-center card-elegant border-0 bg-muted/30">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <problem.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                {problem.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {problem.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Solution Statement */}
        <div className="text-center">
          <div className="inline-block p-8 bg-gradient-accent rounded-3xl shadow-glow">
            <h3 className="text-2xl sm:text-3xl font-heading font-bold text-accent-foreground mb-4">
              EchoCoach lets your team practice, improve, and build confidence—on demand.
            </h3>
            <p className="text-accent-foreground/90 text-lg">
              Real conversations. Real-time coaching. Real results.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;