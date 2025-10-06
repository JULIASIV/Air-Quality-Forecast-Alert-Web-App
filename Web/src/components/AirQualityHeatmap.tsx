import React, { useState, useEffect } from 'react';
import { MapPin, Thermometer, Wind, Eye, Zap } from 'lucide-react';

interface HeatmapData {
  city: string;
  lat: number;
  lng: number;
  aqi: number;
  temperature: number;
  humidity: number;
}

const AirQualityHeatmap: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'aqi' | 'temperature' | 'humidity'>('aqi');

  // Mock data - in real app, this would come from API
  const mockData: HeatmapData[] = [
    { city: 'New York', lat: 40.7128, lng: -74.0060, aqi: 85, temperature: 22, humidity: 65 },
    { city: 'Los Angeles', lat: 34.0522, lng: -118.2437, aqi: 120, temperature: 28, humidity: 45 },
    { city: 'Chicago', lat: 41.8781, lng: -87.6298, aqi: 65, temperature: 18, humidity: 70 },
    { city: 'Houston', lat: 29.7604, lng: -95.3698, aqi: 95, temperature: 30, humidity: 80 },
    { city: 'Phoenix', lat: 33.4484, lng: -112.0740, aqi: 110, temperature: 35, humidity: 25 },
    { city: 'Philadelphia', lat: 39.9526, lng: -75.1652, aqi: 75, temperature: 20, humidity: 60 },
    { city: 'San Antonio', lat: 29.4241, lng: -98.4936, aqi: 88, temperature: 32, humidity: 75 },
    { city: 'San Diego', lat: 32.7157, lng: -117.1611, aqi: 55, temperature: 25, humidity: 55 },
    { city: 'Dallas', lat: 32.7767, lng: -96.7970, aqi: 105, temperature: 29, humidity: 65 },
    { city: 'San Jose', lat: 37.3382, lng: -121.8863, aqi: 70, temperature: 24, humidity: 50 }
  ];

  useEffect(() => {
    setHeatmapData(mockData);
  }, []);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-red-800';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp <= 10) return 'bg-blue-600';
    if (temp <= 20) return 'bg-blue-400';
    if (temp <= 25) return 'bg-green-400';
    if (temp <= 30) return 'bg-yellow-400';
    if (temp <= 35) return 'bg-orange-500';
    return 'bg-red-600';
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity <= 30) return 'bg-red-300';
    if (humidity <= 50) return 'bg-yellow-300';
    if (humidity <= 70) return 'bg-green-300';
    return 'bg-blue-300';
  };

  const getColorForMode = (data: HeatmapData) => {
    switch (viewMode) {
      case 'aqi':
        return getAQIColor(data.aqi);
      case 'temperature':
        return getTemperatureColor(data.temperature);
      case 'humidity':
        return getHumidityColor(data.humidity);
      default:
        return getAQIColor(data.aqi);
    }
  };

  const getValue = (data: HeatmapData) => {
    switch (viewMode) {
      case 'aqi':
        return data.aqi;
      case 'temperature':
        return `${data.temperature}°C`;
      case 'humidity':
        return `${data.humidity}%`;
      default:
        return data.aqi;
    }
  };

  const getUnit = () => {
    switch (viewMode) {
      case 'aqi':
        return 'AQI';
      case 'temperature':
        return '°C';
      case 'humidity':
        return '%';
      default:
        return 'AQI';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Air Quality Heatmap
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('aqi')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'aqi' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Wind className="w-4 h-4 inline mr-1" />
            AQI
          </button>
          <button
            onClick={() => setViewMode('temperature')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'temperature' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Thermometer className="w-4 h-4 inline mr-1" />
            Temp
          </button>
          <button
            onClick={() => setViewMode('humidity')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'humidity' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Humidity
          </button>
        </div>
      </div>

      {/* Heatmap Visualization */}
      <div className="relative bg-gray-100 rounded-lg p-4 min-h-96">
        <div className="grid grid-cols-5 gap-4 h-full">
          {heatmapData.map((city, index) => (
            <div
              key={city.city}
              className={`relative rounded-lg p-3 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${getColorForMode(city)} ${
                selectedCity === city.city ? 'ring-4 ring-white shadow-xl' : ''
              }`}
              onClick={() => setSelectedCity(selectedCity === city.city ? null : city.city)}
              style={{
                opacity: 0.8 + (index % 3) * 0.1,
                transform: `translate(${(index % 3) * 10}px, ${Math.floor(index / 3) * 20}px)`
              }}
            >
              <div className="text-white text-center">
                <div className="font-semibold text-sm mb-1">{city.city}</div>
                <div className="text-lg font-bold">{getValue(city)}</div>
                <div className="text-xs opacity-90">{getUnit()}</div>
              </div>
              
              {selectedCity === city.city && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl p-3 z-10 min-w-48">
                  <div className="text-gray-800 space-y-2">
                    <div className="font-semibold border-b pb-1">{city.city}</div>
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-gray-600" />
                      <span>AQI: {city.aqi}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-gray-600" />
                      <span>Temp: {city.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-600" />
                      <span>Humidity: {city.humidity}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        {viewMode === 'aqi' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Good (0-50)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-600">Moderate (51-100)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Unhealthy (101-150)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Very Unhealthy (151+)</span>
            </div>
          </>
        )}
        
        {viewMode === 'temperature' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-sm text-gray-600">Cold (&lt;10°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span className="text-sm text-gray-600">Cool (10-25°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-sm text-gray-600">Warm (25-30°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-sm text-gray-600">Hot (30°C+)</span>
            </div>
          </>
        )}
        
        {viewMode === 'humidity' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-300 rounded"></div>
              <span className="text-sm text-gray-600">Dry (&lt;30%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <span className="text-sm text-gray-600">Comfortable (30-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-300 rounded"></div>
              <span className="text-sm text-gray-600">Humid (70%+)</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          Click on any city to see detailed information • Updated every 5 minutes
        </p>
      </div>
    </div>
  );
};

export default AirQualityHeatmap;
