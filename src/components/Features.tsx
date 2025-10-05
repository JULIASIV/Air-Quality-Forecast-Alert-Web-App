import { Card } from "@/components/ui/card";
import { Satellite, Brain, Bell, Users, Shield, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Satellite,
    title: "NASA TEMPO Integration",
    description: "Real-time air quality data from NASA's cutting-edge satellite technology with hourly updates across North America.",
    color: "text-accent"
  },
  {
    icon: Brain,
    title: "ML-Powered Forecasting",
    description: "Advanced machine learning models predict air quality 24-48 hours ahead with 85%+ accuracy using time-series analysis.",
    color: "text-accent"
  },
  {
    icon: Bell,
    title: "Intelligent Alerts",
    description: "Personalized health alerts via push notifications, email, and SMS based on your location and sensitivity levels.",
    color: "text-accent"
  },
  {
    icon: Users,
    title: "Multi-Stakeholder Platform",
    description: "Tailored dashboards for public health officials, schools, emergency responders, and everyday citizens.",
    color: "text-accent"
  },
  {
    icon: Shield,
    title: "Health Protection",
    description: "Actionable recommendations to protect vulnerable populations including children, elderly, and those with respiratory conditions.",
    color: "text-accent"
  },
  {
    icon: TrendingUp,
    title: "Historical Analytics",
    description: "Track air quality trends over time with comprehensive data visualization and comparative analysis tools.",
    color: "text-accent"
  }
];

const Features = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Powerful Features for
            <span className="block mt-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Cleaner Air Tomorrow
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Combining satellite data, machine learning, and real-time alerts to protect public health
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border bg-card animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <Card className="p-8 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Data Sources & Validation
            </h3>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-foreground">NASA TEMPO Satellite</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-foreground">Ground Station Networks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-foreground">Pandora Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-foreground">Weather Data Integration</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Features;