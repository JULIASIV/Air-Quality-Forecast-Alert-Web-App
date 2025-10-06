import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Home, TreePine, TrendingUp, TrendingDown, Plus, Minus, Wind, Thermometer } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  co2?: number;
  temperature?: number;
  humidity?: number;
}

interface ComparisonData {
  indoor: {
    data: AirQualityData[];
    averages: AirQualityData;
    trends: {
      aqi: 'increasing' | 'decreasing';
      pm25: 'increasing' | 'decreasing';
    };
  };
  outdoor: {
    data: AirQualityData;
  };
  comparison: {
    aqiDifference: number;
    indoorBetter: boolean;
    ratio: number;
    category: string;
  };
  recommendations: string[];
}

const IndoorOutdoorComparison = () => {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("demo-user");
  const [location, setLocation] = useState({ lat: 34.0522, lon: -118.2437 }); // Default to LA
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    room: '',
    measurements: {
      aqi: '',
      pm25: '',
      pm10: '',
      co2: '',
      temperature: '',
      humidity: ''
    }
  });

  useEffect(() => {
    fetchComparisonData();
    const interval = setInterval(fetchComparisonData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [selectedUserId, location]);

  const fetchComparisonData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/comparison/indoor-outdoor/${selectedUserId}?lat=${location.lat}&lon=${location.lon}&hours=24`
      );
      
      if (response.ok) {
        const data = await response.json();
        setComparisonData(data);
      } else {
        // Mock data for demonstration
        const mockData: ComparisonData = {
          indoor: {
            data: generateMockIndoorData(),
            averages: { aqi: 45, pm25: 12, pm10: 18, co2: 680, temperature: 22, humidity: 55 },
            trends: { aqi: 'decreasing', pm25: 'decreasing' }
          },
          outdoor: {
            data: { aqi: 72, pm25: 28, pm10: 45, temperature: 18, humidity: 65 }
          },
          comparison: {
            aqiDifference: -27,
            indoorBetter: true,
            ratio: 0.625,
            category: 'indoor_better'
          },
          recommendations: [
            'Indoor air quality is better - keep windows closed',
            'Continue using air purifiers to maintain good indoor quality',
            'Monitor outdoor conditions before ventilation'
          ]
        };
        setComparisonData(mockData);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockIndoorData = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      aqi: Math.round(40 + Math.sin(i * Math.PI / 12) * 10 + Math.random() * 8),
      pm25: Math.round(10 + Math.sin(i * Math.PI / 12) * 5 + Math.random() * 4),
      pm10: Math.round(15 + Math.sin(i * Math.PI / 12) * 7 + Math.random() * 6),
      co2: Math.round(650 + Math.sin(i * Math.PI / 8) * 100 + Math.random() * 50),
      temperature: 22 + Math.sin(i * Math.PI / 12) * 2,
      humidity: 55 + Math.sin(i * Math.PI / 10) * 10,
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString()
    }));
  };

  const addIndoorMeasurement = async () => {
    try {
      const measurementData = {
        userId: selectedUserId,
        deviceId: newDevice.deviceId,
        location: {
          coordinates: [location.lon, location.lat],
          room: newDevice.room
        },
        measurements: {
          aqi: parseInt(newDevice.measurements.aqi),
          pm25: { value: parseFloat(newDevice.measurements.pm25) },
          pm10: { value: parseFloat(newDevice.measurements.pm10) },
          co2: { value: parseFloat(newDevice.measurements.co2) },
          temperature: { value: parseFloat(newDevice.measurements.temperature) },
          humidity: { value: parseFloat(newDevice.measurements.humidity) }
        },
        conditions: {
          ventilationStatus: 'natural',
          occupancyCount: 1
        }
      };

      const response = await fetch('/api/comparison/indoor-measurement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(measurementData)
      });

      if (response.ok) {
        setIsAddingDevice(false);
        setNewDevice({
          deviceId: '',
          room: '',
          measurements: { aqi: '', pm25: '', pm10: '', co2: '', temperature: '', humidity: '' }
        });
        fetchComparisonData();
      }
    } catch (error) {
      console.error('Error adding measurement:', error);
    }
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "bg-green-500";
    if (aqi <= 100) return "bg-yellow-500";
    if (aqi <= 150) return "bg-orange-500";
    if (aqi <= 200) return "bg-red-500";
    return "bg-purple-500";
  };

  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive";
    if (aqi <= 200) return "Unhealthy";
    return "Very Unhealthy";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Indoor vs Outdoor Air Quality</h2>
        <p className="text-muted-foreground">
          Compare your indoor environment with outdoor conditions to make informed decisions
        </p>
      </div>

      {/* Quick Stats Cards */}
      {comparisonData && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{comparisonData.indoor.averages.aqi}</div>
                <div className="text-sm text-muted-foreground">Indoor AQI</div>
                <Badge className={getAQIColor(comparisonData.indoor.averages.aqi)}>
                  {getAQICategory(comparisonData.indoor.averages.aqi)}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TreePine className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{comparisonData.outdoor.data.aqi}</div>
                <div className="text-sm text-muted-foreground">Outdoor AQI</div>
                <Badge className={getAQIColor(comparisonData.outdoor.data.aqi)}>
                  {getAQICategory(comparisonData.outdoor.data.aqi)}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              {comparisonData.comparison.indoorBetter ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
              <div>
                <div className="text-2xl font-bold">
                  {Math.abs(comparisonData.comparison.aqiDifference)}
                </div>
                <div className="text-sm text-muted-foreground">AQI Difference</div>
                <Badge variant={comparisonData.comparison.indoorBetter ? 'default' : 'destructive'}>
                  {comparisonData.comparison.indoorBetter ? 'Indoor Better' : 'Outdoor Better'}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {comparisonData.indoor.averages.co2}
                </div>
                <div className="text-sm text-muted-foreground">Indoor CO₂ (ppm)</div>
                <Badge variant={comparisonData.indoor.averages.co2! > 1000 ? 'destructive' : 'default'}>
                  {comparisonData.indoor.averages.co2! > 1000 ? 'High' : 'Normal'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          {comparisonData && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Indoor Environment
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Air Quality Index</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{comparisonData.indoor.averages.aqi}</span>
                      <div className={`w-4 h-4 rounded-full ${getAQIColor(comparisonData.indoor.averages.aqi)}`}></div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>PM2.5</span>
                    <span>{comparisonData.indoor.averages.pm25} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PM10</span>
                    <span>{comparisonData.indoor.averages.pm10} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CO₂</span>
                    <span>{comparisonData.indoor.averages.co2} ppm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature</span>
                    <span>{comparisonData.indoor.averages.temperature}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Humidity</span>
                    <span>{comparisonData.indoor.averages.humidity}%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TreePine className="w-5 h-5" />
                  Outdoor Environment
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Air Quality Index</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{comparisonData.outdoor.data.aqi}</span>
                      <div className={`w-4 h-4 rounded-full ${getAQIColor(comparisonData.outdoor.data.aqi)}`}></div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>PM2.5</span>
                    <span>{comparisonData.outdoor.data.pm25} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PM10</span>
                    <span>{comparisonData.outdoor.data.pm10} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature</span>
                    <span>{comparisonData.outdoor.data.temperature}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Humidity</span>
                    <span>{comparisonData.outdoor.data.humidity}%</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {comparisonData && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">24-Hour Air Quality Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData.indoor.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="aqi" stroke="#3b82f6" name="Indoor AQI" />
                    <Line type="monotone" dataKey="pm25" stroke="#ef4444" name="Indoor PM2.5" />
                    <Line type="monotone" dataKey="co2" stroke="#f59e0b" name="Indoor CO₂" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {comparisonData && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Personalized Recommendations</h3>
              <div className="space-y-3">
                {comparisonData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Indoor Air Quality Devices</h3>
            <Dialog open={isAddingDevice} onOpenChange={setIsAddingDevice}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Measurement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Indoor Air Quality Measurement</DialogTitle>
                  <DialogDescription>
                    Enter manual measurements from your indoor air quality device
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="deviceId">Device ID</Label>
                    <Input
                      id="deviceId"
                      value={newDevice.deviceId}
                      onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                      placeholder="e.g., sensor-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room">Room</Label>
                    <Select 
                      value={newDevice.room} 
                      onValueChange={(value) => setNewDevice({ ...newDevice, room: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="living_room">Living Room</SelectItem>
                        <SelectItem value="bedroom">Bedroom</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="bathroom">Bathroom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aqi">AQI</Label>
                      <Input
                        id="aqi"
                        type="number"
                        value={newDevice.measurements.aqi}
                        onChange={(e) => setNewDevice({
                          ...newDevice,
                          measurements: { ...newDevice.measurements, aqi: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pm25">PM2.5 (µg/m³)</Label>
                      <Input
                        id="pm25"
                        type="number"
                        step="0.1"
                        value={newDevice.measurements.pm25}
                        onChange={(e) => setNewDevice({
                          ...newDevice,
                          measurements: { ...newDevice.measurements, pm25: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co2">CO₂ (ppm)</Label>
                      <Input
                        id="co2"
                        type="number"
                        value={newDevice.measurements.co2}
                        onChange={(e) => setNewDevice({
                          ...newDevice,
                          measurements: { ...newDevice.measurements, co2: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temp">Temperature (°C)</Label>
                      <Input
                        id="temp"
                        type="number"
                        step="0.1"
                        value={newDevice.measurements.temperature}
                        onChange={(e) => setNewDevice({
                          ...newDevice,
                          measurements: { ...newDevice.measurements, temperature: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <Button onClick={addIndoorMeasurement} className="w-full">
                    Add Measurement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-6">
            <p className="text-muted-foreground text-center py-8">
              No devices connected. Add measurements manually or connect IoT air quality sensors.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IndoorOutdoorComparison;
