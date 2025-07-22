import { Card } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";

const EnhancedSocialProofSection = () => {
  const testimonials = [
    {
      quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
      author: "Sarah Johnson",
      role: "Training Manager",
      company: "TechFlow Solutions",
      avatar: "/placeholder.svg"
    },
    {
      quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
      author: "Michael Chen", 
      role: "Customer Success Director",
      company: "Innovation Corp",
      avatar: "/placeholder.svg"
    },
    {
      quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
      author: "Emily Rodriguez",
      role: "VP of Operations", 
      company: "ServiceFirst Inc",
      avatar: "/placeholder.svg"
    }
  ];

  const partnerLogos = [
    { name: "TechFlow", logo: "/placeholder.svg" },
    { name: "Innovation Corp", logo: "/placeholder.svg" },
    { name: "ServiceFirst", logo: "/placeholder.svg" },
    { name: "Global Solutions", logo: "/placeholder.svg" },
    { name: "NextGen Support", logo: "/placeholder.svg" }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Metrics */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-primary text-primary-foreground font-bold text-lg mb-6">
            Powered over 50,000 practice sessions
          </div>
          <h2 className="text-4xl font-heading font-bold text-foreground mb-6">
            Trusted by Leading Organizations
          </h2>
        </div>

        {/* Partner Logos */}
        <div className="flex flex-wrap items-center justify-center gap-8 mb-16 opacity-60">
          {partnerLogos.map((partner, index) => (
            <div key={index} className="h-12 w-32 flex items-center justify-center">
              <span className="text-muted-foreground font-semibold">{partner.name}</span>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-8 card-elegant">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>
              
              <Quote className="w-8 h-8 text-accent mb-4" />
              
              <p className="text-muted-foreground mb-6 italic">
                "{testimonial.quote}"
              </p>
              
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-foreground font-bold">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EnhancedSocialProofSection;