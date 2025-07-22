import { Card } from "@/components/ui/card";
import { Star, Quote, Shield, Award, Users } from "lucide-react";

const SocialProofSection = () => {
  const testimonials = [
    {
      quote: "EchoCoach helped our agents reduce onboarding time by 25% while improving customer satisfaction scores.",
      author: "Sarah Chen",
      title: "Head of Customer Success",
      company: "TechFlow Solutions"
    },
    {
      quote: "The realistic scenarios and immediate feedback transformed how we train our healthcare staff on difficult conversations.",
      author: "Dr. Michael Rodriguez",
      title: "Training Director",
      company: "Regional Medical Center"
    },
    {
      quote: "Finally, a tool that lets our HR team practice sensitive conversations before they happen in real life.",
      author: "Jennifer Walsh",
      title: "VP of Human Resources",
      company: "Global Industries"
    }
  ];

  const trustBadges = [
    { icon: Shield, label: "HIPAA Compliant" },
    { icon: Award, label: "SOC 2 Certified" },
    { icon: Users, label: "Enterprise Ready" }
  ];

  const companyLogos = [
    "TechFlow",
    "MedCenter",
    "GlobalCorp",
    "InnovateLabs",
    "HealthPlus",
    "ServicePro"
  ];

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-6">
            Trusted by Forward-Thinking Teams
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Organizations across customer experience, healthcare, and HR are already using EchoCoach 
            to transform their training programs.
          </p>
        </div>

        {/* Company Logos */}
        <div className="mb-16">
          <p className="text-center text-muted-foreground mb-8">
            Used by teams at:
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {companyLogos.map((company, index) => (
              <div 
                key={index}
                className="px-6 py-3 bg-muted/30 rounded-lg text-muted-foreground font-medium"
              >
                {company}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-8 border-0 bg-background card-elegant relative">
              <Quote className="w-8 h-8 text-accent mb-4" />
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center">
                  <span className="text-accent-foreground font-semibold text-sm">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                </div>
              </div>
              
              {/* Star Rating */}
              <div className="flex items-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center items-center gap-8 flex-wrap">
          {trustBadges.map((badge, index) => (
            <div key={index} className="flex items-center gap-3 text-muted-foreground">
              <div className="w-10 h-10 bg-muted/30 rounded-xl flex items-center justify-center">
                <badge.icon className="w-5 h-5" />
              </div>
              <span className="font-medium">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;