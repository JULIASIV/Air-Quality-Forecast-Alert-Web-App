import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Layers, Maximize2, Satellite, Navigation } from "lucide-react";

const MapPreview = () => {
  // Mock data points for visualization
  const mockLocations = [
    { name: "Los Angeles", aqi: 42, left: "15%", top: "45%" },
    { name: "Phoenix", aqi: 85, left: "22%", top: "52%" },
    { name: "Denver", aqi: 128, left: "35%", top: "38%" },
    { name: "Seattle", aqi: 35, left: "10%", top: "18%" },
    { name: "New York", aqi: 58, left: "75%", top: "30%" },
    { name: "Dallas", aqi: 92, left: "45%", top: "58%" },
  ];

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "bg-green-500";
    if (aqi <= 100) return "bg-yellow-500";
    if (aqi <= 150) return "bg-orange-500";
    if (aqi <= 200) return "bg-red-500";
    return "bg-purple-500";
  };

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Interactive Air Quality
            <span className="block mt-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Coverage Map
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore real-time and forecasted air quality data across North America
          </p>
        </div>

        <div className="relative">
          <Card className="overflow-hidden border-border shadow-2xl">
            <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
              {/* Mock map background */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20" />
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                  backgroundSize: '40px 40px'
                }} />
              </div>

              {/* Mock data points */}
              {mockLocations.map((location, index) => (
                <div
                  key={index}
                  className="absolute animate-fade-in cursor-pointer group"
                  style={{ 
                    left: location.left, 
                    top: location.top,
                    animationDelay: `${index * 0.2}s`
                  }}
                >
                  <div className={`w-4 h-4 ${getAQIColor(location.aqi)} rounded-full animate-pulse shadow-lg group-hover:scale-150 transition-transform`} />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
                      <div className="text-sm font-bold text-card-foreground">{location.name}</div>
                      <div className="text-xs text-muted-foreground">AQI: {location.aqi}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Overlay content */}
              <div className="relative z-10 text-center space-y-4 p-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Satellite className="w-12 h-12 text-accent animate-pulse" />
                  <Navigation className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Live TEMPO Satellite Integration</h3>
                  <p className="text-white/70 max-w-md mx-auto">
                    Interactive map with real-time NASA TEMPO data and ground station networks
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                    <Layers className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-white">Multi-layer Data</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                    <Maximize2 className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-white">Fullscreen Mode</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-white">48 Cities</span>
                  </div>
                </div>

                <Button className="mt-6 bg-accent hover:bg-accent/90 text-white hover:scale-105 transition-transform shadow-xl shadow-accent/20">
                  Launch Full Map Interface
                </Button>
              </div>
            </div>
          </Card>

          {/* Map Legend */}
          <Card className="mt-6 p-6 bg-card border-border">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-card-foreground">Good (0-50)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                <span className="text-sm font-medium text-card-foreground">Moderate (51-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full" />
                <span className="text-sm font-medium text-card-foreground">Unhealthy (101-150)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full" />
                <span className="text-sm font-medium text-card-foreground">Very Unhealthy (151-200)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full" />
                <span className="text-sm font-medium text-card-foreground">Hazardous (201+)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MapPreview;