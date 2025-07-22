import { Card } from "@/components/ui/card";
import { Headphones, Heart, Shield } from "lucide-react";

const UseCasesPanelSection = () => {
  const useCases = [
    {
      icon: Headphones,
      title: "Customer Support",
      description: "Master difficult customer interactions with confidence and empathy."
    },
    {
      icon: Heart,
      title: "Healthcare Communication",
      description: "Practice sensitive patient conversations with professional care."
    },
    {
      icon: Shield,
      title: "Compliance & HR",
      description: "Navigate complex workplace conversations with precision and tact."
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-4">
            Use Cases
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sharpen your skills across critical conversation scenarios
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <Card key={index} className="p-8 text-center card-elegant">
              <div className="w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <useCase.icon className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-4">
                {useCase.title}
              </h3>
              <p className="text-muted-foreground">
                {useCase.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesPanelSection;