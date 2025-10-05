import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, School, Siren, Users2 } from "lucide-react";

const stakeholders = [
  {
    icon: Building2,
    title: "Public Health Officials",
    description: "Monitor air quality trends, issue health advisories, and coordinate emergency responses.",
    features: [
      "Real-time population exposure analytics",
      "Customizable alert thresholds",
      "Historical trend analysis",
      "Multi-region dashboard"
    ],
    cta: "Access Dashboard"
  },
  {
    icon: School,
    title: "Schools & Universities",
    description: "Protect students with automated outdoor activity recommendations and air quality monitoring.",
    features: [
      "Automated PE class recommendations",
      "Campus air quality maps",
      "Student health notifications",
      "Parent communication tools"
    ],
    cta: "School Portal"
  },
  {
    icon: Siren,
    title: "Emergency Responders",
    description: "Access critical air quality data for emergency planning and response coordination.",
    features: [
      "Emergency alert integration",
      "Resource allocation tools",
      "Evacuation planning support",
      "Multi-agency coordination"
    ],
    cta: "Emergency Access"
  },
  {
    icon: Users2,
    title: "Community Members",
    description: "Stay informed about local air quality with personalized alerts and health recommendations.",
    features: [
      "Location-based notifications",
      "Health profile customization",
      "Activity planning suggestions",
      "Community air quality reports"
    ],
    cta: "Get Started Free"
  }
];

const StakeholderCTA = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Built for Every
            <span className="block mt-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Stakeholder
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tailored dashboards and tools for public health officials, schools, emergency responders, and citizens
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {stakeholders.map((stakeholder, index) => {
            const Icon = stakeholder.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-card-foreground mb-2">
                        {stakeholder.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {stakeholder.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pl-[72px]">
                    {stakeholder.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pl-[72px] pt-2">
                    <Button className="bg-accent hover:bg-accent/90 text-white w-full md:w-auto">
                      {stakeholder.cta}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Partnership CTA */}
        <Card className="mt-12 p-8 bg-gradient-to-r from-primary to-accent text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <div className="relative z-10 text-center space-y-6">
            <h3 className="text-3xl font-bold">Ready to Implement in Your Community?</h3>
            <p className="text-white/90 max-w-2xl mx-auto text-lg">
              Partner with us to deploy this air quality forecasting system in your region. 
              We provide training, integration support, and ongoing technical assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Request Partnership Info
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Schedule Demo
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default StakeholderCTA;