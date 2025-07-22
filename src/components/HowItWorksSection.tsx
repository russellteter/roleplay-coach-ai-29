import { Card } from "@/components/ui/card";
import { FileText, Mic, BarChart3 } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      icon: FileText,
      title: "Pick a Scenario",
      description: "Choose from our library of industry-specific scenarios or import your company scripts and training materials.",
      details: [
        "Pre-built scenario library",
        "Custom script import",
        "Role-specific training paths",
        "Difficulty level adjustment"
      ]
    },
    {
      number: "02",
      icon: Mic,
      title: "Speak Naturally",
      description: "EchoCoach responds in real-time with human-like voice interactions, adapting to your conversation style.",
      details: [
        "Natural voice AI responses",
        "Real-time conversation flow",
        "Contextual understanding",
        "Emotional intelligence"
      ]
    },
    {
      number: "03",
      icon: BarChart3,
      title: "Receive Feedback",
      description: "Get actionable insights on what worked, what to improve, and specific coaching recommendations.",
      details: [
        "Detailed performance analytics",
        "Tone and clarity scoring",
        "Personalized coaching tips",
        "Progress tracking over time"
      ]
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-6">
            How EchoCoach Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Three simple steps to transform your team's conversation skills with AI-powered coaching.
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-accent to-transparent z-0"></div>
              )}
              
              <Card className="relative z-10 p-8 text-center card-elegant border-0 bg-gradient-subtle h-full">
                {/* Step Number */}
                <div className="text-6xl font-heading font-bold text-accent/20 mb-4">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-accent-foreground" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {step.description}
                </p>
                
                {/* Details */}
                <ul className="text-sm text-muted-foreground space-y-2">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0"></div>
                      {detail}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="inline-block p-6 bg-muted/30 rounded-2xl">
            <p className="text-lg text-muted-foreground mb-4">
              Ready to see it in action?
            </p>
            <button 
              onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-accent font-semibold link-animated text-lg"
            >
              Request a personalized demo →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;