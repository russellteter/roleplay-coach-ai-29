import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Mic, Users, BarChart3 } from "lucide-react";

const SignupSection = () => {
  const [email, setEmail] = useState("");
  const [useCase, setUseCase] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with actual signup API
    console.log("Signup submitted:", { email, useCase });
    setIsSubmitted(true);
  };

  const benefits = [
    {
      icon: Mic,
      title: "Free Access to Pilot Program",
      description: "Be among the first to experience Sharpen's voice AI technology"
    },
    {
      icon: Users,
      title: "Custom Scenario Setup",
      description: "We'll help configure scenarios specific to your industry and use case"
    },
    {
      icon: BarChart3,
      title: "Dedicated Onboarding",
      description: "Personal training session to maximize your team's success"
    }
  ];

  if (isSubmitted) {
    return (
      <section id="signup" className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-2xl mx-auto p-12 text-center border-0 bg-gradient-accent shadow-glow">
            <CheckCircle className="w-16 h-16 text-accent-foreground mx-auto mb-6" />
            <h2 className="text-3xl font-heading font-bold text-accent-foreground mb-4">
              Welcome to the Future of Training!
            </h2>
            <p className="text-accent-foreground/90 text-lg mb-6">
              Thank you for joining our early access program. We'll be in touch within 24 hours 
              to set up your personalized demo and configure your scenarios.
            </p>
            <p className="text-accent-foreground/80">
              Keep an eye on your inbox for next steps and exclusive updates.
            </p>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="signup" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Benefits */}
          <div>
            <h2 className="text-4xl font-heading font-bold text-foreground mb-6">
              Start Your Free Trial Today
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of professionals using Sharpen to perfect their critical conversations. See results in just 14 days.
            </p>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Signup Form */}
          <Card className="p-8 border-0 bg-gradient-subtle shadow-card">
            <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
              Start Free Trial
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Work Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="use-case" className="block text-sm font-medium text-foreground mb-2">
                  Primary Use Case *
                </label>
                <Select value={useCase} onValueChange={setUseCase} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary use case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer-support">Customer Support Training</SelectItem>
                    <SelectItem value="healthcare">Healthcare Communication</SelectItem>
                    <SelectItem value="hr-compliance">HR & Compliance</SelectItem>
                    <SelectItem value="sales">Sales Training</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-gradient-primary hover:shadow-glow font-semibold min-h-[44px]"
                disabled={!email || !useCase}
              >
                Start Free Trial
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SignupSection;