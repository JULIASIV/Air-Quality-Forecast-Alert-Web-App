import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Clock, BarChart3, Activity } from "lucide-react";
import { useMemo } from "react";

interface ForecastChartProps {
  data: {
    location: string;
    forecast_hours: number;
    aqi: Array<{
      timestamp: string;
      aqi: number;
      category: string;
      dominant_pollutant: string;
    }>;
    parameters: {
      no2: Array<{
        timestamp: string;
        value: number;
        confidence: number;
      }>;
      pm: Array<{
        timestamp: string;
        value: number;
        confidence: number;
      }>;
    };
  };
  location: string;
}

const ForecastChart = ({ data }: ForecastChartProps) => {
  const maxAQI = useMemo(() => {
    return Math.max(...data.aqi.map(d => d.aqi));
  }, [data.aqi]);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    return 'bg-purple-500';
  };

  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    return 'Very Unhealthy';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };

  const ChartBar = ({ value, maxValue, color, height = 100 }: {
    value: number;
    maxValue: number;
    color: string;
    height?: number;
  }) => {
    const barHeight = (value / maxValue) * height;
    
    return (
      <div 
        className="flex flex-col justify-end" 
        style={{ height: `${height}px` }}
      >
        <div 
          className={`${color} rounded-t transition-all duration-300 hover:opacity-80`}
          style={{ height: `${barHeight}px`, minHeight: '2px' }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              24-Hour Air Quality Forecast
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Predicted conditions for {data.location}
            </p>
          </div>
          <div className="text-right">
            <Badge className="mb-1">
              Forecast Confidence: 85%+
            </Badge>
            <div className="text-xs text-muted-foreground">
              ML-powered predictions
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="aqi" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="aqi" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            AQI Forecast
          </TabsTrigger>
          <TabsTrigger value="pollutants" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Pollutants
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aqi" className="space-y-4">
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Air Quality Index (AQI) Trend</h4>
            
            {/* Chart */}
            <div className="mb-6">
              <div className="flex items-end justify-between gap-1 mb-2" style={{ height: '120px' }}>
                {data.aqi.slice(0, 24).map((point, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      {Math.round(point.aqi)}
                    </div>
                    <ChartBar 
                      value={point.aqi}
                      maxValue={maxAQI}
                      color={getAQIColor(point.aqi)}
                      height={100}
                    />
                  </div>
                ))}
              </div>
              
              {/* Time labels */}
              <div className="flex justify-between text-xs text-muted-foreground">
                {data.aqi.slice(0, 24).filter((_, index) => index % 4 === 0).map((point, index) => (
                  <div key={index} className="text-center">
                    <div>{formatTime(point.timestamp)}</div>
                    <div className="text-xs opacity-70">{formatDate(point.timestamp)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-5 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Good (0-50)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded" />
                <span>Moderate (51-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded" />
                <span>Unhealthy (101-150)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>Unhealthy (151-200)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span>Very Unhealthy (201+)</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pollutants" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* NO2 Forecast */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                NO₂ Concentration
              </h4>
              <div className="space-y-3">
                {data.parameters.no2.slice(0, 6).map((point, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {formatTime(point.timestamp)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {point.value.toFixed(1)} µg/m³
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(point.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* PM2.5 Forecast */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                PM2.5 Concentration
              </h4>
              <div className="space-y-3">
                {data.parameters.pm.slice(0, 6).map((point, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {formatTime(point.timestamp)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {point.value.toFixed(1)} µg/m³
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(point.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Key Insights */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Key Insights</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div>
                    <p className="font-medium text-sm">Peak AQI Expected</p>
                    <p className="text-xs text-muted-foreground">
                      {getAQICategory(maxAQI)} conditions around {
                        formatTime(data.aqi.find(d => d.aqi === maxAQI)?.timestamp || '')
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div>
                    <p className="font-medium text-sm">Best Air Quality</p>
                    <p className="text-xs text-muted-foreground">
                      Early morning hours typically show lowest pollution levels
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                  <div>
                    <p className="font-medium text-sm">Weather Impact</p>
                    <p className="text-xs text-muted-foreground">
                      Wind patterns and temperature changes affecting dispersion
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Health Recommendations */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Health Recommendations</h4>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${
                  maxAQI <= 50 ? 'bg-green-50 dark:bg-green-900/10' :
                  maxAQI <= 100 ? 'bg-yellow-50 dark:bg-yellow-900/10' :
                  maxAQI <= 150 ? 'bg-orange-50 dark:bg-orange-900/10' :
                  'bg-red-50 dark:bg-red-900/10'
                }`}>
                  <Badge className={getAQIColor(maxAQI)}>
                    {getAQICategory(maxAQI)}
                  </Badge>
                  <p className="text-sm mt-2">
                    {maxAQI <= 50 
                      ? "Great day for outdoor activities!"
                      : maxAQI <= 100 
                      ? "Sensitive groups should consider limiting outdoor activities."
                      : maxAQI <= 150
                      ? "Everyone should reduce prolonged outdoor exertion."
                      : "Avoid outdoor activities, especially for sensitive groups."}
                  </p>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>• Check forecast before planning outdoor activities</p>
                  <p>• Consider indoor alternatives during peak pollution hours</p>
                  <p>• Keep windows closed during high pollution periods</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ForecastChart;
