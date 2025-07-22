import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Headphones, Heart, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const UseCasesSection = () => {
  const [activeUseCase, setActiveUseCase] = useState(0);

  const useCases = [
    {
      id: "customer-support",
      title: "Customer Support",
      icon: Headphones,
      description: "Practice tough calls and empathy with simulated customers.",
      benefits: [
        "Handle escalated complaints with confidence",
        "Improve empathy and active listening skills",
        "Reduce call resolution time by 30%",
        "Master de-escalation techniques"
      ],
      scenarios: [
        "Angry customer demanding refund",
        "Technical support for complex issues",
        "Billing dispute resolution",
        "Product complaint handling"
      ]
    },
    {
      id: "healthcare",
      title: "Healthcare Communication",
      icon: Heart,
      description: "Simulate difficult patient conversations to improve care.",
      benefits: [
        "Deliver sensitive news with compassion",
        "Improve patient satisfaction scores",
        "Build trust through better communication",
        "Handle family dynamics effectively"
      ],
      scenarios: [
        "Breaking bad news to patients",
        "Discussing treatment options",
        "Managing anxious families",
        "End-of-life conversations"
      ]
    },
    {
      id: "compliance",
      title: "Compliance & HR",
      icon: Shield,
      description: "Rehearse sensitive workplace scenarios and receive behavioral feedback.",
      benefits: [
        "Navigate HR issues professionally",
        "Ensure regulatory compliance",
        "Reduce workplace conflicts",
        "Improve team management skills"
      ],
      scenarios: [
        "Performance improvement discussions",
        "Harassment complaint handling",
        "Termination conversations",
        "Diversity and inclusion training"
      ]
    }
  ];

  const currentUseCase = useCases[activeUseCase];

  return (
    <section id="use-cases" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-6">
            Tailored for Your Industry
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            EchoCoach adapts to your specific training needs with industry-focused scenarios and coaching.
          </p>
        </div>

        {/* Use Case Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {useCases.map((useCase, index) => (
            <button
              key={useCase.id}
              onClick={() => setActiveUseCase(index)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300",
                activeUseCase === index
                  ? "bg-accent text-accent-foreground shadow-glow"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <useCase.icon className="w-5 h-5" />
              {useCase.title}
            </button>
          ))}
        </div>

        {/* Active Use Case Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Description and Benefits */}
          <div className="fade-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center">
                <currentUseCase.icon className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-heading font-bold text-foreground">
                  {currentUseCase.title}
                </h3>
                <p className="text-muted-foreground">
                  {currentUseCase.description}
                </p>
              </div>
            </div>

            <Card className="p-8 mb-8 border-0 bg-background shadow-card">
              <h4 className="text-lg font-semibold text-foreground mb-4">
                Key Benefits:
              </h4>
              <ul className="space-y-3">
                {currentUseCase.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Button variant="cta" size="lg" className="group">
              Start with {currentUseCase.title}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Right Column - Scenarios */}
          <div className="fade-in">
            <h4 className="text-xl font-heading font-semibold text-foreground mb-6">
              Practice Scenarios:
            </h4>
            <div className="grid gap-4">
              {currentUseCase.scenarios.map((scenario, index) => (
                <Card 
                  key={index} 
                  className="p-6 border-0 bg-background/50 backdrop-blur-sm card-elegant group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">{scenario}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;