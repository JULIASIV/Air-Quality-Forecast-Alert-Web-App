import { Card } from "@/components/ui/card";
import { Satellite, Database, CloudRain, Network, Check, Microscope } from "lucide-react";

const dataSources = [
  {
    name: "NASA TEMPO",
    icon: Satellite,
    description: "Tropospheric Emissions Monitoring of Pollution satellite provides hourly daytime observations of air quality across North America.",
    features: [
      "Hourly measurements of NO₂, O₃, and aerosols",
      "4-8 km spatial resolution",
      "Coverage: North America",
      "Real-time data delivery"
    ],
    color: "text-accent"
  },
  {
    name: "Ground Stations",
    icon: Database,
    description: "Network of EPA and partner monitoring stations providing real-time surface-level air quality measurements.",
    features: [
      "PM2.5, PM10, O₃, NO₂, SO₂, CO measurements",
      "5-minute to hourly updates",
      "1,000+ stations across US",
      "Historical data since 1980s"
    ],
    color: "text-accent"
  },
  {
    name: "Weather Data",
    icon: CloudRain,
    description: "Meteorological data integration for wind patterns, temperature, humidity, and precipitation forecasting.",
    features: [
      "Wind speed and direction",
      "Temperature and humidity",
      "Precipitation forecasts",
      "Pressure systems tracking"
    ],
    color: "text-accent"
  },
  {
    name: "NASA Pandora Global Network",
    icon: Microscope,
    description: "Ground-based spectroscopic measurements providing reference data for satellite validation and air quality research across the globe.",
    features: [
      "Direct Sun and Sky spectroscopy",
      "NO₂, O₃, HCHO, SO₂ column measurements",
      "Real-time satellite validation",
      "Global network of 100+ stations",
      "Research-grade precision (<5% uncertainty)"
    ],
    color: "text-primary"
  },
  {
    name: "Validation Networks",
    icon: Network,
    description: "TolNet and other ground-based spectrometers for additional satellite data validation and calibration.",
    features: [
      "Lidar O₃ profile measurements",
      "High-precision validation",
      "Continuous monitoring",
      "Complementary to Pandora data"
    ],
    color: "text-accent"
  }
];

const methodology = [
  {
    step: "1",
    title: "Data Integration",
    description: "Combine satellite, ground station, and weather data in real-time"
  },
  {
    step: "2",
    title: "Quality Validation",
    description: "Cross-validate satellite data with ground measurements"
  },
  {
    step: "3",
    title: "ML Processing",
    description: "Apply time-series forecasting models (LSTM, Prophet)"
  },
  {
    step: "4",
    title: "Forecast Generation",
    description: "Generate 24-48 hour predictions with confidence intervals"
  },
  {
    step: "5",
    title: "Alert Distribution",
    description: "Trigger personalized alerts based on thresholds and location"
  }
];

const DataSources = () => {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Data Sources &
            <span className="block mt-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Methodology
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Multi-source data integration with validated machine learning models for accurate predictions
          </p>
        </div>

        {/* Data Sources */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {dataSources.map((source, index) => {
            const Icon = source.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-6 h-6 ${source.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">
                      {source.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {source.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 pl-16">
                  {source.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Methodology */}
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-accent/20">
          <h3 className="text-2xl font-bold text-center mb-8 text-foreground">
            Forecasting Methodology
          </h3>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/20 via-accent to-accent/20" />
            
            <div className="grid md:grid-cols-5 gap-6">
              {methodology.map((item, index) => (
                <div key={index} className="relative animate-fade-in" style={{ animationDelay: `${index * 0.15}s` }}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-3xl font-bold text-white shadow-lg relative z-10">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Accuracy Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="p-6 text-center bg-card">
            <div className="text-4xl font-bold text-accent mb-2">85%+</div>
            <div className="text-sm text-muted-foreground">24-hour Forecast Accuracy</div>
          </Card>
          <Card className="p-6 text-center bg-card">
            <div className="text-4xl font-bold text-accent mb-2">&lt;5min</div>
            <div className="text-sm text-muted-foreground">Alert Delivery Time</div>
          </Card>
          <Card className="p-6 text-center bg-card">
            <div className="text-4xl font-bold text-accent mb-2">1000+</div>
            <div className="text-sm text-muted-foreground">Data Points per Hour</div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DataSources;