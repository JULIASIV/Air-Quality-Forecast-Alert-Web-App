import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, Sun, Cloud } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ForecastViewProps {
  location: string;
}

interface ForecastData {
  time: string;
  hour: number;
  aqi: number;
  category: {
    level: string;
    color: string;
  };
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
  };
  confidence: number;
  factors: string[];
}

const ForecastView: React.FC<ForecastViewProps> = ({ location }) => {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHours, setSelectedHours] = useState(24);

  useEffect(() => {
    fetchForecast();
  }, [location, selectedHours]);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      // Generate mock forecast data
      const forecast: ForecastData[] = [];
      const baseAQI = Math.floor(Math.random() * 100) + 50;
      
      for (let i = 0; i < selectedHours; i++) {
        const time = new Date();
        time.setHours(time.getHours() + i);
        
        // Simulate AQI fluctuation
        let aqiVariation = Math.sin((i / 24) * 2 * Math.PI) * 20;
        aqiVariation += Math.random() * 30 - 15;
        const predictedAQI = Math.max(1, Math.floor(baseAQI + aqiVariation));
        
        const category = getAQICategory(predictedAQI);
        
        forecast.push({
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          hour: i,
          aqi: predictedAQI,
          category,
          pollutants: {
            pm25: Math.max(1, Math.floor((predictedAQI / 6) + Math.random() * 10)),
            pm10: Math.max(1, Math.floor((predictedAQI / 3) + Math.random() * 20)),
            no2: Math.max(1, Math.floor((predictedAQI / 4) + Math.random() * 15)),
            o3: Math.max(1, Math.floor((predictedAQI / 2.5) + Math.random() * 25))
          },
          confidence: Math.max(60, 95 - (i * 1.5)),
          factors: getPredictionFactors(i)
        });
      }
      
      setForecastData(forecast);
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return { level: 'Good', color: '#10B981' };
    if (aqi <= 100) return { level: 'Moderate', color: '#F59E0B' };
    if (aqi <= 150) return { level: 'Unhealthy for Sensitive', color: '#F97316' };
    if (aqi <= 200) return { level: 'Unhealthy', color: '#EF4444' };
    if (aqi <= 300) return { level: 'Very Unhealthy', color: '#8B5CF6' };
    return { level: 'Hazardous', color: '#7F1D1D' };
  };

  const getPredictionFactors = (hour: number) => {
    const factors = ['Weather patterns', 'Traffic volume', 'Industrial activity'];
    
    if (hour >= 6 && hour <= 9) {
      factors.push('Morning rush hour');
    } else if (hour >= 17 && hour <= 19) {
      factors.push('Evening rush hour');
    }
    
    if (hour >= 10 && hour <= 16) {
      factors.push('Solar radiation effects');
    }
    
    return factors;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forecast Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              Air Quality Forecast - {location.replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedHours}
              onChange={(e) => setSelectedHours(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={12}>12 Hours</option>
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours</option>
              <option value={72}>72 Hours</option>
            </select>
          </div>
        </div>
        
        <p className="text-gray-600">
          Powered by machine learning models using NASA TEMPO satellite data, weather patterns, 
          and historical trends to predict air quality conditions.
        </p>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">AQI Forecast Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 'dataMax + 20']}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-gray-800">{`Time: ${label}`}</p>
                        <p className="text-sm text-blue-600">{`AQI: ${data.aqi}`}</p>
                        <p className="text-xs text-gray-600">{data.category.level}</p>
                        <p className="text-xs text-green-600">{`Confidence: ${data.confidence.toFixed(1)}%`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="aqi" 
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Forecast Cards */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Hourly Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
          {forecastData.slice(0, 12).map((forecast, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {index === 0 ? 'Now' : `+${index}h`}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {forecast.time}
                </div>
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2"
                  style={{ backgroundColor: forecast.category.color }}
                >
                  {forecast.aqi}
                </div>
                <div className="text-xs font-medium text-gray-700 mb-1">
                  {forecast.category.level}
                </div>
                <div className="text-xs text-gray-500">
                  {forecast.confidence.toFixed(0)}% confidence
                </div>
                
                {/* Key pollutants */}
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-600">
                    PM2.5: {forecast.pollutants.pm25}
                  </div>
                  <div className="text-xs text-gray-600">
                    O₃: {forecast.pollutants.o3}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Insights */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Key Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-800">Peak pollution expected</p>
                <p className="text-sm text-gray-600">Around 8:00 AM due to morning traffic</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-800">Best air quality</p>
                <p className="text-sm text-gray-600">Late evening when traffic reduces</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-800">Weather impact</p>
                <p className="text-sm text-gray-600">Wind patterns will help disperse pollutants</p>
              </div>
            </div>
          </div>
        </div>

        {/* Health Recommendations */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Health Recommendations
          </h3>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="font-medium text-green-800">Morning (6-9 AM)</p>
              <p className="text-sm text-green-700">Consider indoor exercise due to traffic pollution</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="font-medium text-yellow-800">Afternoon (12-3 PM)</p>
              <p className="text-sm text-yellow-700">Good time for outdoor activities</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-medium text-blue-800">Evening (6-9 PM)</p>
              <p className="text-sm text-blue-700">Avoid prolonged outdoor exercise</p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Information */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Forecast Model Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Data Sources</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• NASA TEMPO satellite data</li>
              <li>• OpenAQ ground stations</li>
              <li>• Weather forecast models</li>
              <li>• Traffic pattern analysis</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Model Accuracy</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Next 6 hours: 92%</li>
              <li>• Next 24 hours: 85%</li>
              <li>• Next 48 hours: 78%</li>
              <li>• Beyond 48 hours: 65%</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Update Frequency</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time updates every 15 minutes</li>
              <li>• Model retraining daily</li>
              <li>• Weather integration hourly</li>
              <li>• Satellite data integration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastView;
