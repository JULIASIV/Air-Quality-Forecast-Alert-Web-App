import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, Download, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface HistoricalViewProps {
  location: string;
}

interface HistoricalData {
  date: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
}

const HistoricalView: React.FC<HistoricalViewProps> = ({ location }) => {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('aqi');

  useEffect(() => {
    fetchHistoricalData();
  }, [location, selectedPeriod]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      
      // Generate mock historical data
      const data: HistoricalData[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const baseAQI = 50 + Math.sin(i / 7) * 30 + Math.random() * 40;
        const aqi = Math.max(1, Math.round(baseAQI));
        
        data.push({
          date: date.toISOString().split('T')[0],
          aqi,
          pm25: Math.max(1, Math.round(aqi / 6 + Math.random() * 10)),
          pm10: Math.max(1, Math.round(aqi / 3 + Math.random() * 20)),
          no2: Math.max(1, Math.round(aqi / 4 + Math.random() * 15)),
          o3: Math.max(1, Math.round(aqi / 2.5 + Math.random() * 25))
        });
      }
      
      setHistoricalData(data);
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'aqi': return 'Air Quality Index';
      case 'pm25': return 'PM2.5 (µg/m³)';
      case 'pm10': return 'PM10 (µg/m³)';
      case 'no2': return 'NO₂ (µg/m³)';
      case 'o3': return 'O₃ (µg/m³)';
      default: return 'Air Quality Index';
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'aqi': return '#3B82F6';
      case 'pm25': return '#EF4444';
      case 'pm10': return '#F97316';
      case 'no2': return '#8B5CF6';
      case 'o3': return '#10B981';
      default: return '#3B82F6';
    }
  };

  const calculateStats = () => {
    if (historicalData.length === 0) return null;
    
    const values = historicalData.map(d => d[selectedMetric as keyof HistoricalData] as number);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg: avg.toFixed(1), min, max };
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

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Historical Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              Historical Data - {location.replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="aqi">Air Quality Index</option>
              <option value="pm25">PM2.5</option>
              <option value="pm10">PM10</option>
              <option value="no2">NO₂</option>
              <option value="o3">O₃</option>
            </select>

            <button 
              onClick={() => {}}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-3 gap-6 mt-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">{stats.avg}</div>
              <div className="text-sm text-blue-600">Average {getMetricLabel(selectedMetric)}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-800">{stats.min}</div>
              <div className="text-sm text-green-600">Minimum</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-800">{stats.max}</div>
              <div className="text-sm text-red-600">Maximum</div>
            </div>
          </div>
        )}
      </div>

      {/* Historical Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {getMetricLabel(selectedMetric)} Trend
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getMetricColor(selectedMetric)} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={getMetricColor(selectedMetric)} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 'dataMax + 10']}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(label).toLocaleDateString()}
                        </p>
                        <p className="text-sm" style={{ color: getMetricColor(selectedMetric) }}>
                          {`${getMetricLabel(selectedMetric)}: ${payload[0].value}`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={getMetricColor(selectedMetric)}
                strokeWidth={2}
                fill="url(#colorMetric)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-metric Comparison */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">All Pollutants Comparison</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-gray-800 mb-2">
                          {new Date(label).toLocaleDateString()}
                        </p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}`}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="aqi" stroke="#3B82F6" strokeWidth={2} name="AQI" />
              <Line type="monotone" dataKey="pm25" stroke="#EF4444" strokeWidth={2} name="PM2.5" />
              <Line type="monotone" dataKey="pm10" stroke="#F97316" strokeWidth={2} name="PM10" />
              <Line type="monotone" dataKey="no2" stroke="#8B5CF6" strokeWidth={2} name="NO₂" />
              <Line type="monotone" dataKey="o3" stroke="#10B981" strokeWidth={2} name="O₃" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500"></div>
            <span className="text-sm text-gray-700">AQI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-500"></div>
            <span className="text-sm text-gray-700">PM2.5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-orange-500"></div>
            <span className="text-sm text-gray-700">PM10</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-purple-500"></div>
            <span className="text-sm text-gray-700">NO₂</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-500"></div>
            <span className="text-sm text-gray-700">O₃</span>
          </div>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Trends Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overall trend:</span>
              <span className="font-medium text-green-600">Improving</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Best day this period:</span>
              <span className="font-medium text-blue-600">
                {historicalData.length > 0 && 
                 new Date(historicalData.reduce((min, curr) => curr.aqi < min.aqi ? curr : min).date)
                   .toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Worst day this period:</span>
              <span className="font-medium text-red-600">
                {historicalData.length > 0 && 
                 new Date(historicalData.reduce((max, curr) => curr.aqi > max.aqi ? curr : max).date)
                   .toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Key Insights</h3>
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800">Weekly Pattern</p>
              <p className="text-xs text-blue-700">Weekends typically show better air quality</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800">Seasonal Trend</p>
              <p className="text-xs text-green-700">Air quality improving with weather changes</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm font-medium text-orange-800">Pollutant Focus</p>
              <p className="text-xs text-orange-700">PM2.5 levels need attention during peak hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalView;
