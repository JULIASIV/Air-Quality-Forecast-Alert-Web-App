import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AQIIndicator from "./AQIIndicator";
import TempoVisualization from "./TempoVisualization";
import ForecastChart from "./ForecastChart";
import AlertPanel from "./AlertPanel";
import PandoraVisualization from "./PandoraVisualization";
import { Activity, MapPin, Clock, Satellite, Wind, Thermometer, Droplets, Microscope } from "lucide-react";
import { useState, useEffect } from "react";

interface AirQualityData {
  location: string;
  aqi: number;
  dominant_pollutant: string;
  tempo_data?: any;
  weather?: any;
  timestamp: string;
}

const Dashboard = () => {
  const [airQualityData, setAirQualityData] = useState<AirQualityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [forecastData, setForecastData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Simulate real-time data updates (in production, use WebSocket)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate NASA TEMPO + ground station data
        const mockData = [
          { 
            location: "Los Angeles, CA", 
            aqi: 85, 
            dominant_pollutant: "PM2.5",
            tempo_data: { no2: 32.5, pm: 28.2, o3: 65.1, hcho: 12.3 },
            weather: { temp: 24, humidity: 65, wind_speed: 3.2 },
            timestamp: new Date().toISOString()
          },
          { 
            location: "New York, NY", 
            aqi: 72, 
            dominant_pollutant: "NO₂",
            tempo_data: { no2: 42.1, pm: 18.5, o3: 48.7, hcho: 8.9 },
            weather: { temp: 18, humidity: 72, wind_speed: 5.8 },
            timestamp: new Date().toISOString()
          },
          { 
            location: "Chicago, IL", 
            aqi: 95, 
            dominant_pollutant: "O₃",
            tempo_data: { no2: 28.3, pm: 22.1, o3: 78.4, hcho: 10.2 },
            weather: { temp: 22, humidity: 58, wind_speed: 4.1 },
            timestamp: new Date().toISOString()
          },
          { 
            location: "Denver, CO", 
            aqi: 105, 
            dominant_pollutant: "PM2.5",
            tempo_data: { no2: 35.7, pm: 45.2, o3: 52.8, hcho: 15.6 },
            weather: { temp: 16, humidity: 45, wind_speed: 2.9 },
            timestamp: new Date().toISOString()
          }
        ];
        
        setAirQualityData(mockData);
        setSelectedLocation(mockData[0].location);
        
        // Simulate alerts
        const mockAlerts = mockData
          .filter(d => d.aqi > 100)
          .map(d => ({
            location: d.location,
            severity: d.aqi > 150 ? 'high' : 'moderate',
            message: `Air quality is unhealthy in ${d.location} due to elevated ${d.dominant_pollutant}`,
            timestamp: d.timestamp
          }));
        
        setAlerts(mockAlerts);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching air quality data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchForecast = async (location: string) => {
    try {
      // Simulate forecast API call
      const mockForecast = {
        location,
        forecast_hours: 24,
        aqi: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
          aqi: Math.max(20, Math.min(200, 75 + Math.sin(i * Math.PI / 12) * 30 + Math.random() * 20)),
          category: 'moderate',
          dominant_pollutant: 'pm'
        })),
        parameters: {
          no2: Array.from({ length: 24 }, (_, i) => ({
            timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
            value: Math.max(5, 30 + Math.sin(i * Math.PI / 12) * 10 + Math.random() * 8),
            confidence: 0.85 - (i * 0.02)
          })),
          pm: Array.from({ length: 24 }, (_, i) => ({
            timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
            value: Math.max(2, 20 + Math.sin(i * Math.PI / 12) * 8 + Math.random() * 6),
            confidence: 0.82 - (i * 0.015)
          }))
        }
      };
      setForecastData(mockForecast);
    } catch (error) {
      console.error('Error fetching forecast:', error);
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      fetchForecast(selectedLocation);
    }
  }, [selectedLocation]);

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Live Air Quality
            <span className="block mt-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Monitoring Dashboard
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time air quality data powered by NASA TEMPO satellite and ground stations
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="group p-6 bg-card border-border hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-accent/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Activity className="w-7 h-7 text-accent group-hover:animate-pulse" />
              </div>
              <div>
                <div className="text-3xl font-bold text-card-foreground">152</div>
                <div className="text-sm text-muted-foreground font-medium">Active Monitors</div>
                <div className="text-xs text-muted-foreground mt-1">+26 Pandora stations</div>
              </div>
            </div>
          </Card>

          <Card className="group p-6 bg-card border-border hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-primary/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MapPin className="w-7 h-7 text-primary group-hover:animate-pulse" />
              </div>
              <div>
                <div className="text-3xl font-bold text-card-foreground">48</div>
                <div className="text-sm text-muted-foreground font-medium">Cities Covered</div>
              </div>
            </div>
          </Card>

          <Card className="group p-6 bg-card border-border hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-accent/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Clock className="w-7 h-7 text-accent group-hover:animate-pulse" />
              </div>
              <div>
                <div className="text-3xl font-bold text-card-foreground">5 min</div>
                <div className="text-sm text-muted-foreground font-medium">Update Frequency</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Alerts Panel */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <AlertPanel alerts={alerts} />
          </div>
        )}

        {/* Location Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg" />
              </div>
            ))
          ) : (
            airQualityData.map((data, index) => (
              <div 
                key={index} 
                className={`animate-fade-in cursor-pointer ${
                  selectedLocation === data.location ? 'ring-2 ring-primary' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedLocation(data.location)}
              >
                <Card className="p-4 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{data.location}</h3>
                    <Badge variant={data.aqi <= 50 ? 'default' : data.aqi <= 100 ? 'secondary' : 'destructive'}>
                      AQI {data.aqi}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Dominant: {data.dominant_pollutant}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      {data.weather?.temp}°C
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3 h-3" />
                      {data.weather?.humidity}%
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3" />
                      {data.weather?.wind_speed}m/s
                    </div>
                  </div>
                </Card>
              </div>
            ))
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tempo">NASA TEMPO</TabsTrigger>
            <TabsTrigger value="pandora">Pandora</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="comparison">Data Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Satellite className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">NASA TEMPO Data</h3>
                </div>
                {selectedLocation && airQualityData.find(d => d.location === selectedLocation)?.tempo_data && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">NO₂</span>
                      <span className="font-medium">{airQualityData.find(d => d.location === selectedLocation)?.tempo_data.no2.toFixed(1)} µg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">PM2.5</span>
                      <span className="font-medium">{airQualityData.find(d => d.location === selectedLocation)?.tempo_data.pm.toFixed(1)} µg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">O₃</span>
                      <span className="font-medium">{airQualityData.find(d => d.location === selectedLocation)?.tempo_data.o3.toFixed(1)} µg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">HCHO</span>
                      <span className="font-medium">{airQualityData.find(d => d.location === selectedLocation)?.tempo_data.hcho.toFixed(1)} µg/m³</span>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Wind className="w-6 h-6 text-blue-500" />
                  <h3 className="font-semibold">Weather Impact</h3>
                </div>
                {selectedLocation && airQualityData.find(d => d.location === selectedLocation)?.weather && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Temperature</span>
                      <span className="font-medium">{airQualityData.find(d => d.location === selectedLocation)?.weather.temp}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Humidity</span>
                      <span className="font-medium">{airQualityData.find(d => d.location === selectedLocation)?.weather.humidity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Wind Speed</span>
                      <span className="font-medium">{airQualityData.find(d => d.location === selectedLocation)?.weather.wind_speed} m/s</span>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-6 h-6 text-green-500" />
                  <h3 className="font-semibold">Health Impact</h3>
                </div>
                {selectedLocation && (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <Badge className={`mb-2 ${
                        airQualityData.find(d => d.location === selectedLocation)?.aqi <= 50 ? 'bg-green-500' :
                        airQualityData.find(d => d.location === selectedLocation)?.aqi <= 100 ? 'bg-yellow-500' :
                        airQualityData.find(d => d.location === selectedLocation)?.aqi <= 150 ? 'bg-orange-500' : 'bg-red-500'
                      }`}>
                        {
                          airQualityData.find(d => d.location === selectedLocation)?.aqi <= 50 ? 'Good' :
                          airQualityData.find(d => d.location === selectedLocation)?.aqi <= 100 ? 'Moderate' :
                          airQualityData.find(d => d.location === selectedLocation)?.aqi <= 150 ? 'Unhealthy for Sensitive' : 'Unhealthy'
                        }
                      </Badge>
                      <p className="text-muted-foreground">
                        {
                          airQualityData.find(d => d.location === selectedLocation)?.aqi <= 50 ? 'Air quality is satisfactory for most people.' :
                          airQualityData.find(d => d.location === selectedLocation)?.aqi <= 100 ? 'Sensitive groups should limit outdoor activities.' :
                          airQualityData.find(d => d.location === selectedLocation)?.aqi <= 150 ? 'Everyone should reduce outdoor activities.' : 'Everyone should avoid outdoor activities.'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tempo" className="space-y-6">
            <TempoVisualization 
              location={selectedLocation} 
              data={airQualityData.find(d => d.location === selectedLocation)?.tempo_data} 
            />
          </TabsContent>

          <TabsContent value="pandora" className="space-y-6">
            <PandoraVisualization 
              location={selectedLocation}
            />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            {forecastData && (
              <ForecastChart 
                data={forecastData} 
                location={selectedLocation}
              />
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Data Source Comparison</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Satellite className="w-4 h-4" />
                    NASA TEMPO (Satellite)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Continental-scale coverage</li>
                    <li>• Hourly daytime measurements</li>
                    <li>• High spatial resolution</li>
                    <li>• Multiple pollutants (NO₂, HCHO, O₃)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Microscope className="w-4 h-4" />
                    NASA Pandora (Validation)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ground-based spectroscopy</li>
                    <li>• Satellite validation reference</li>
                    <li>• Research-grade precision</li>
                    <li>• Global network coverage</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Ground Stations (OpenAQ)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Point measurements</li>
                    <li>• Continuous monitoring</li>
                    <li>• High temporal resolution</li>
                    <li>• Direct health-relevant data</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Last updated: {new Date().toLocaleTimeString()} | Data from NASA TEMPO + OpenAQ Ground Stations
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-card-foreground">Live Data Feed Active</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;