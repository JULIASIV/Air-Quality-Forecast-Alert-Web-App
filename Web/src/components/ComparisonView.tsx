import React, { useState, useEffect } from 'react';
import { Users, Plus, X, TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ComparisonData {
  location: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  co: number;
  category: string;
  color: string;
}

const ComparisonView: React.FC = () => {
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['New-York', 'Los-Angeles', 'London']);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('aqi');

  const availableLocations = [
    'New-York', 'Los-Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'London', 'Paris', 'Berlin', 'Tokyo', 'Beijing', 'Mumbai', 'Sydney'
  ];

  useEffect(() => {
    fetchComparisonData();
  }, [selectedLocations]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const data: ComparisonData[] = [];
      
      for (const location of selectedLocations) {
        // Generate mock data for each location
        const aqi = Math.floor(Math.random() * 200) + 20;
        const category = getAQICategory(aqi);
        
        data.push({
          location: location.replace('-', ' '),
          aqi,
          pm25: Math.max(1, Math.round(aqi / 6 + Math.random() * 10)),
          pm10: Math.max(1, Math.round(aqi / 3 + Math.random() * 20)),
          no2: Math.max(1, Math.round(aqi / 4 + Math.random() * 15)),
          o3: Math.max(1, Math.round(aqi / 2.5 + Math.random() * 25)),
          co: Math.max(1, Math.round(Math.random() * 10)),
          category: category.level,
          color: category.color
        });
      }
      
      setComparisonData(data.sort((a, b) => b.aqi - a.aqi));
    } catch (error) {
      console.error('Failed to fetch comparison data:', error);
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

  const addLocation = (location: string) => {
    if (!selectedLocations.includes(location) && selectedLocations.length < 6) {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  const removeLocation = (location: string) => {
    if (selectedLocations.length > 2) {
      setSelectedLocations(selectedLocations.filter(loc => loc !== location));
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'aqi': return 'AQI';
      case 'pm25': return 'PM2.5';
      case 'pm10': return 'PM10';
      case 'no2': return 'NO₂';
      case 'o3': return 'O₃';
      case 'co': return 'CO';
      default: return 'AQI';
    }
  };

  const getBestWorst = () => {
    if (comparisonData.length === 0) return { best: null, worst: null };
    
    const sorted = [...comparisonData].sort((a, b) => a.aqi - b.aqi);
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1]
    };
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

  const { best, worst } = getBestWorst();

  return (
    <div className="space-y-6">
      {/* Comparison Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-800">City Comparison</h2>
          </div>
          
          <div className="flex items-center gap-3">
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
              <option value="co">CO</option>
            </select>
          </div>
        </div>

        {/* Location Management */}
        <div className="flex flex-wrap gap-3 mb-4">
          {selectedLocations.map(location => (
            <div key={location} className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              <span className="text-sm">{location.replace('-', ' ')}</span>
              <button
                onClick={() => removeLocation(location)}
                className="hover:bg-blue-200 rounded-full p-1 transition-colors"
                disabled={selectedLocations.length <= 2}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {selectedLocations.length < 6 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addLocation(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">+ Add City</option>
                {availableLocations
                  .filter(loc => !selectedLocations.includes(loc))
                  .map(location => (
                    <option key={location} value={location}>
                      {location.replace('-', ' ')}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Best/Worst Summary */}
        {best && worst && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Best Air Quality</span>
              </div>
              <div className="text-lg font-bold text-green-900">{best.location}</div>
              <div className="text-sm text-green-700">AQI: {best.aqi} ({best.category})</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Needs Attention</span>
              </div>
              <div className="text-lg font-bold text-red-900">{worst.location}</div>
              <div className="text-sm text-red-700">AQI: {worst.aqi} ({worst.category})</div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {getMetricLabel(selectedMetric)} Comparison
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="location" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-gray-800">{label}</p>
                        <p className="text-sm" style={{ color: data.color }}>
                          {`${getMetricLabel(selectedMetric)}: ${payload[0].value}`}
                        </p>
                        <p className="text-xs text-gray-600">{data.category}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey={selectedMetric} 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              >
                {comparisonData.map((entry, index) => (
                  <Bar key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Detailed Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-800">City</th>
                <th className="text-center py-3 px-4 font-medium text-gray-800">AQI</th>
                <th className="text-center py-3 px-4 font-medium text-gray-800">PM2.5</th>
                <th className="text-center py-3 px-4 font-medium text-gray-800">PM10</th>
                <th className="text-center py-3 px-4 font-medium text-gray-800">NO₂</th>
                <th className="text-center py-3 px-4 font-medium text-gray-800">O₃</th>
                <th className="text-center py-3 px-4 font-medium text-gray-800">Category</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((city, index) => (
                <tr key={city.location} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-800">{city.location}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span 
                      className="inline-block px-3 py-1 rounded-full text-white font-medium"
                      style={{ backgroundColor: city.color }}
                    >
                      {city.aqi}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">{city.pm25}</td>
                  <td className="text-center py-3 px-4 text-gray-700">{city.pm10}</td>
                  <td className="text-center py-3 px-4 text-gray-700">{city.no2}</td>
                  <td className="text-center py-3 px-4 text-gray-700">{city.o3}</td>
                  <td className="text-center py-3 px-4">
                    <span className="text-sm text-gray-600">{city.category}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">🏆 Rankings (Best to Worst)</h3>
          <div className="space-y-3">
            {comparisonData
              .sort((a, b) => a.aqi - b.aqi)
              .map((city, index) => (
                <div key={city.location} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{city.location}</div>
                    <div className="text-sm text-gray-600">AQI {city.aqi}</div>
                  </div>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: city.color }}
                  ></div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cities compared:</span>
              <span className="font-medium text-gray-800">{comparisonData.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average AQI:</span>
              <span className="font-medium text-gray-800">
                {comparisonData.length > 0 ? 
                  Math.round(comparisonData.reduce((sum, city) => sum + city.aqi, 0) / comparisonData.length) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">AQI Range:</span>
              <span className="font-medium text-gray-800">
                {best && worst ? `${best.aqi} - ${worst.aqi}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cities with Good AQ:</span>
              <span className="font-medium text-green-600">
                {comparisonData.filter(city => city.aqi <= 50).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cities needing attention:</span>
              <span className="font-medium text-red-600">
                {comparisonData.filter(city => city.aqi > 150).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
