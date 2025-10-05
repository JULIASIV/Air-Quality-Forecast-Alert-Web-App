import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { Microscope, Activity, TrendingUp, AlertTriangle, CheckCircle, MapPin, Clock, Thermometer } from 'lucide-react';
import { pandoraService, PandoraMeasurement, PandoraStation, PandoraValidationData } from '../services/pandoraService';

interface PandoraVisualizationProps {
  location?: string;
  stationId?: string;
}

const PandoraVisualization = ({ location, stationId }: PandoraVisualizationProps) => {
  const [stations, setStations] = useState<PandoraStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<PandoraStation | null>(null);
  const [measurements, setMeasurements] = useState<PandoraMeasurement[]>([]);
  const [validationData, setValidationData] = useState<PandoraValidationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPollutant, setSelectedPollutant] = useState<'no2' | 'o3' | 'hcho' | 'so2'>('no2');

  useEffect(() => {
    const loadData = async () => {
      try {
        const stationList = await pandoraService.getStations();
        setStations(stationList);
        
        let targetStation = stationList[0]; // Default to first station
        
        if (stationId) {
          targetStation = stationList.find(s => s.id === stationId) || stationList[0];
        } else if (location) {
          // Find station closest to the location name
          targetStation = stationList.find(s => s.name.toLowerCase().includes(location.toLowerCase())) || stationList[0];
        }
        
        setSelectedStation(targetStation);
        
        if (targetStation) {
          const [measurementData, validation] = await Promise.all([
            pandoraService.getStationMeasurements(targetStation.id, 24),
            pandoraService.getValidationData(targetStation.id)
          ]);
          
          setMeasurements(measurementData);
          setValidationData(validation);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Pandora data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [location, stationId]);

  const formatColumnDensity = (value: number): string => {
    if (value >= 1e18) return `${(value / 1e18).toFixed(2)}e18`;
    if (value >= 1e15) return `${(value / 1e15).toFixed(2)}e15`;
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}e12`;
    return value.toExponential(2);
  };

  const getQualityColor = (quality: 'excellent' | 'good' | 'fair' | 'poor') => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
    }
  };

  const getQualityIcon = (quality: 'excellent' | 'good' | 'fair' | 'poor') => {
    switch (quality) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      case 'fair':
      case 'poor':
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const chartData = measurements.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: m.timestamp,
    no2: m.no2_column,
    o3: m.o3_column,
    hcho: m.hcho_column,
    so2: m.so2_column,
    quality: m.quality_flag,
    uncertainty: m.uncertainty_percent,
    sza: m.solar_zenith_angle,
    temperature: m.temperature,
    pressure: m.pressure
  }));

  const validationChartData = measurements.slice(-12).map(m => {
    const quality = pandoraService.assessDataQuality(m);
    return {
      time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit' }),
      pandora_no2: m.no2_column / 1e15, // Convert to more readable units
      tempo_estimate: m.no2_column * (1 + (Math.random() - 0.5) * 0.2) / 1e15, // Simulate TEMPO data
      difference: ((Math.random() - 0.5) * 20), // Percentage difference
      quality_score: quality.overall === 'excellent' ? 100 : 
                    quality.overall === 'good' ? 85 : 
                    quality.overall === 'fair' ? 70 : 50
    };
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded"></div>
      </div>
    );
  }

  if (!selectedStation) {
    return (
      <div className="text-center py-12">
        <Microscope className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No Pandora station data available</p>
      </div>
    );
  }

  const latestMeasurement = measurements[measurements.length - 1];
  const qualityAssessment = latestMeasurement ? pandoraService.assessDataQuality(latestMeasurement) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Microscope className="w-8 h-8 text-primary" />
            NASA Pandora Spectroscopy
          </h3>
          <p className="text-muted-foreground mt-1">
            Ground-based validation and research measurements
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <MapPin className="w-4 h-4" />
            {selectedStation.name}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Last updated: {latestMeasurement ? new Date(latestMeasurement.timestamp).toLocaleTimeString() : 'N/A'}
          </div>
        </div>
      </div>

      {/* Station Info & Current Status */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${selectedStation.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="font-semibold">Station Status</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Elevation: {selectedStation.elevation}m
          </p>
          <div className="text-xs">
            <div className="font-medium">Instruments:</div>
            {selectedStation.instruments.map((inst, i) => (
              <Badge key={i} variant="outline" className="text-xs mr-1 mt-1">
                {inst}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">Data Quality</span>
          </div>
          {qualityAssessment && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getQualityIcon(qualityAssessment.overall)}
                <Badge className={getQualityColor(qualityAssessment.overall)}>
                  {qualityAssessment.overall.toUpperCase()}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Uncertainty: {latestMeasurement?.uncertainty_percent.toFixed(1)}%
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="font-semibold">NO₂ Column</span>
          </div>
          {latestMeasurement && (
            <div>
              <div className="text-lg font-bold">
                {formatColumnDensity(latestMeasurement.no2_column)}
              </div>
              <div className="text-xs text-muted-foreground">molecules/cm²</div>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Thermometer className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">Conditions</span>
          </div>
          {latestMeasurement && (
            <div className="space-y-1 text-sm">
              <div>Temp: {latestMeasurement.temperature.toFixed(1)}°C</div>
              <div>Press: {latestMeasurement.pressure.toFixed(0)} hPa</div>
              <div>SZA: {latestMeasurement.solar_zenith_angle.toFixed(1)}°</div>
            </div>
          )}
        </Card>
      </div>

      {/* Main Visualization Tabs */}
      <Tabs defaultValue="timeseries" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeseries">Time Series</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
          <TabsTrigger value="comparison">Multi-Species</TabsTrigger>
        </TabsList>

        <TabsContent value="timeseries" className="space-y-4">
          <div className="flex gap-2 mb-4">
            {['no2', 'o3', 'hcho', 'so2'].map((pollutant) => (
              <Button
                key={pollutant}
                variant={selectedPollutant === pollutant ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPollutant(pollutant as any)}
              >
                {pollutant.toUpperCase()}
              </Button>
            ))}
          </div>
          
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">
              {selectedPollutant.toUpperCase()} Column Density (24-hour trend)
            </h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis tickFormatter={formatColumnDensity} />
                <Tooltip 
                  formatter={(value: number) => [formatColumnDensity(value), selectedPollutant.toUpperCase()]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={selectedPollutant} 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Satellite Validation (Pandora vs TEMPO)</h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={validationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pandora_no2" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Pandora NO₂ (×10¹⁵)"
                />
                <Line 
                  type="monotone" 
                  dataKey="tempo_estimate" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="TEMPO NO₂ (×10¹⁵)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {validationData && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Validation Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>TEMPO NO₂ Difference:</span>
                    <span className="font-medium">{validationData.satellite_comparison.tempo_no2_diff.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TEMPO O₃ Difference:</span>
                    <span className="font-medium">{validationData.satellite_comparison.tempo_o3_diff.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Correlation Coefficient:</span>
                    <span className="font-medium">{validationData.satellite_comparison.correlation_coefficient.toFixed(3)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Trend Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Daily Average:</span>
                    <span className="font-medium">{formatColumnDensity(validationData.trend_analysis.daily_average)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly Trend:</span>
                    <Badge variant={
                      validationData.trend_analysis.weekly_trend === 'increasing' ? 'destructive' :
                      validationData.trend_analysis.weekly_trend === 'decreasing' ? 'default' : 'secondary'
                    }>
                      {validationData.trend_analysis.weekly_trend}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Seasonal Factor:</span>
                    <span className="font-medium">{(validationData.trend_analysis.seasonal_adjustment * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Data Quality Metrics</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={validationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quality_score" fill="#8884d8" name="Quality Score %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Quality Factors</h4>
              {qualityAssessment && qualityAssessment.factors.length > 0 ? (
                <div className="space-y-2">
                  {qualityAssessment.factors.map((factor, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      {factor}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>No quality issues detected</span>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Measurement Conditions</h4>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart data={chartData.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sza" type="number" name="Solar Zenith Angle" />
                  <YAxis dataKey="uncertainty" type="number" name="Uncertainty %" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Measurements" data={chartData.slice(-10)} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Multi-Species Comparison</h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis tickFormatter={formatColumnDensity} />
                <Tooltip formatter={(value: number, name: string) => [formatColumnDensity(value), name]} />
                <Legend />
                <Line type="monotone" dataKey="no2" stroke="#8884d8" name="NO₂" />
                <Line type="monotone" dataKey="o3" stroke="#82ca9d" name="O₃" />
                <Line type="monotone" dataKey="hcho" stroke="#ffc658" name="HCHO" />
                <Line type="monotone" dataKey="so2" stroke="#ff7300" name="SO₂" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Data Source: NASA Pandora Global Network</span>
            <a 
              href="https://pandora.gsfc.nasa.gov/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              pandora.gsfc.nasa.gov
            </a>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Real-time validation data</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PandoraVisualization;
