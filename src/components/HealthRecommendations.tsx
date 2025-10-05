import { Card } from "@/components/ui/card";
import { Heart, Users, Activity, Shield, AlertTriangle, Info } from "lucide-react";

const recommendations = [
  {
    aqi: "0-50",
    level: "Good",
    color: "hsl(var(--aqi-good))",
    icon: Heart,
    general: "Air quality is ideal for outdoor activities.",
    sensitive: "No precautions needed.",
    actions: [
      "Perfect day for outdoor exercise",
      "Open windows for fresh air",
      "Great conditions for children's outdoor play"
    ]
  },
  {
    aqi: "51-100",
    level: "Moderate",
    color: "hsl(var(--aqi-moderate))",
    icon: Info,
    general: "Air quality is acceptable for most people.",
    sensitive: "Unusually sensitive people should consider reducing prolonged outdoor exertion.",
    actions: [
      "Outdoor activities are generally safe",
      "Sensitive groups: monitor symptoms",
      "Good ventilation recommended indoors"
    ]
  },
  {
    aqi: "101-150",
    level: "Unhealthy for Sensitive Groups",
    color: "hsl(var(--aqi-sensitive))",
    icon: Users,
    general: "General public can continue normal activities.",
    sensitive: "Children, elderly, and people with respiratory conditions should limit prolonged outdoor exertion.",
    actions: [
      "Sensitive groups: reduce outdoor activities",
      "Keep rescue medications accessible",
      "Consider air purifiers indoors",
      "Monitor local air quality alerts"
    ]
  },
  {
    aqi: "151-200",
    level: "Unhealthy",
    color: "hsl(var(--aqi-unhealthy))",
    icon: Activity,
    general: "Everyone may begin to experience health effects.",
    sensitive: "Members of sensitive groups should avoid outdoor exertion.",
    actions: [
      "Limit outdoor activities for everyone",
      "Keep windows and doors closed",
      "Use air purifiers if available",
      "Reschedule outdoor events",
      "Check on vulnerable neighbors"
    ]
  },
  {
    aqi: "201-300",
    level: "Very Unhealthy",
    color: "hsl(var(--aqi-very-unhealthy))",
    icon: AlertTriangle,
    general: "Health alert: everyone may experience serious health effects.",
    sensitive: "Sensitive groups should remain indoors and keep activity levels low.",
    actions: [
      "Everyone: avoid outdoor activities",
      "Stay indoors with filtered air",
      "Seek medical attention if symptoms worsen",
      "Schools should cancel outdoor activities",
      "Emergency services on standby"
    ]
  },
  {
    aqi: "300+",
    level: "Hazardous",
    color: "hsl(var(--aqi-hazardous))",
    icon: Shield,
    general: "Health warnings of emergency conditions. Entire population is likely to be affected.",
    sensitive: "Everyone should avoid all outdoor exertion.",
    actions: [
      "Emergency conditions - stay indoors",
      "Use N95 masks if must go outside",
      "Seek immediate medical care for symptoms",
      "Follow emergency broadcast instructions",
      "Consider evacuation if advised"
    ]
  }
];

const HealthRecommendations = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Health Protection
            <span className="block mt-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Guidelines & Actions
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Know what actions to take based on current air quality levels to protect your health
          </p>
        </div>

        <div className="space-y-6">
          {recommendations.map((rec, index) => {
            const Icon = rec.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 animate-fade-in"
                style={{ 
                  borderLeftColor: rec.color,
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="grid md:grid-cols-[auto,1fr] gap-6">
                  <div className="flex flex-col items-center md:items-start gap-3">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${rec.color}15` }}
                    >
                      <Icon className="w-8 h-8" style={{ color: rec.color }} />
                    </div>
                    <div className="text-center md:text-left">
                      <div className="font-bold text-lg" style={{ color: rec.color }}>
                        {rec.level}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        AQI {rec.aqi}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">General Population</h4>
                        <p className="text-sm text-muted-foreground">{rec.general}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Sensitive Groups</h4>
                        <p className="text-sm text-muted-foreground">{rec.sensitive}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Recommended Actions</h4>
                      <ul className="grid md:grid-cols-2 gap-2">
                        {rec.actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: rec.color }} />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-12 p-8 bg-gradient-to-r from-accent/5 to-primary/5 border-accent/20">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-foreground">Vulnerable Populations</h3>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Special attention should be given to children, elderly adults, pregnant women, and individuals with 
              pre-existing conditions such as asthma, COPD, heart disease, or compromised immune systems.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <div className="px-4 py-2 bg-background rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground">Children under 12</span>
              </div>
              <div className="px-4 py-2 bg-background rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground">Adults 65+</span>
              </div>
              <div className="px-4 py-2 bg-background rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground">Pregnant Women</span>
              </div>
              <div className="px-4 py-2 bg-background rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground">Respiratory Conditions</span>
              </div>
              <div className="px-4 py-2 bg-background rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground">Heart Disease</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default HealthRecommendations;