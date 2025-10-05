import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  Gauge, 
  Sun,
  Cloud,
  CloudRain,
  Snowflake
} from 'lucide-react';

interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  pressure: number;
  visibility: number;
  windDirection?: number;
  uvIndex?: number;
}

interface WeatherCardProps {
  data: WeatherData;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'partly cloudy':
        return <Cloud className="w-8 h-8 text-gray-400" />;
      case 'rainy':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'snowy':
        return <Snowflake className="w-8 h-8 text-blue-300" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getWindDirection = (degrees: number = 0) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getUVLevel = (uvIndex: number = 0) => {
    if (uvIndex <= 2) return { level: 'Low', color: 'text-green-600 bg-green-100' };
    if (uvIndex <= 5) return { level: 'Moderate', color: 'text-yellow-600 bg-yellow-100' };
    if (uvIndex <= 7) return { level: 'High', color: 'text-orange-600 bg-orange-100' };
    if (uvIndex <= 10) return { level: 'Very High', color: 'text-red-600 bg-red-100' };
    return { level: 'Extreme', color: 'text-purple-600 bg-purple-100' };
  };

  return (
    <div className="space-y-6">
      {/* Main Weather Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {getWeatherIcon(data.condition)}
          <div>
            <div className="text-3xl font-bold text-gray-800">
              {data.temperature}°C
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {data.condition}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">Feels like</div>
          <div className="text-xl font-semibold text-gray-800">
            {data.temperature + Math.round((Math.random() - 0.5) * 6)}°C
          </div>
        </div>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Humidity</span>
          </div>
          <div className="text-2xl font-bold text-blue-800">{data.humidity}%</div>
          <div className="text-xs text-blue-600">
            {data.humidity > 70 ? 'High' : data.humidity > 40 ? 'Moderate' : 'Low'}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Wind Speed</span>
          </div>
          <div className="text-2xl font-bold text-green-800">{data.windSpeed} km/h</div>
          <div className="text-xs text-green-600">
            {data.windDirection ? getWindDirection(data.windDirection) : 'Variable'}
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Pressure</span>
          </div>
          <div className="text-2xl font-bold text-purple-800">{data.pressure} hPa</div>
          <div className="text-xs text-purple-600">
            {data.pressure > 1013 ? 'High' : 'Low'}
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Visibility</span>
          </div>
          <div className="text-2xl font-bold text-orange-800">{data.visibility} km</div>
          <div className="text-xs text-orange-600">
            {data.visibility > 8 ? 'Excellent' : data.visibility > 5 ? 'Good' : 'Poor'}
          </div>
        </div>
      </div>

      {/* UV Index (if available) */}
      {data.uvIndex && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">UV Index</span>
              </div>
              <div className="text-2xl font-bold text-yellow-800">{data.uvIndex}</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getUVLevel(data.uvIndex).color}`}>
              {getUVLevel(data.uvIndex).level}
            </div>
          </div>
        </div>
      )}

      {/* Weather Impact on Air Quality */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Weather Impact on Air Quality</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            <strong>Wind:</strong> {data.windSpeed > 15 ? 'Good dispersion of pollutants' : 'Limited pollutant dispersion'}
          </div>
          <div>
            <strong>Humidity:</strong> {data.humidity > 70 ? 'May increase particle formation' : 'Favorable for air quality'}
          </div>
          <div>
            <strong>Temperature:</strong> {data.temperature > 25 ? 'May increase ozone formation' : 'Low ozone formation risk'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
