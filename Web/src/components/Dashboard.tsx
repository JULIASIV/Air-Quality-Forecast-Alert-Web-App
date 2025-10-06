import React, { useState, useEffect } from 'react';
import { 
  Wind, 
  Thermometer, 
  Eye, 
  AlertTriangle, 
  MapPin, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  CloudRain
} from 'lucide-react';
import AQIChart from './AQIChart';
import PollutantChart from './PollutantChart';
import WeatherCard from './WeatherCard';
import AlertsPanel from './AlertsPanel';
import LocationSearch from './LocationSearch';

interface AirQualityData {
  location: string;
  aqi: number;
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
  };
  timestamp: string;
}

interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  pressure: number;
  visibility: number;
}

const Dashboard: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState('New-York');
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAirQualityData = async (location: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/air-quality/current/${location}`);
      const data = await response.json();
      setAirQualityData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch air quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async (location: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/weather/current/${location}`);
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  };

  useEffect(() => {
    fetchAirQualityData(currentLocation);
    fetchWeatherData(currentLocation);
  }, [currentLocation]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAirQualityData(currentLocation);
      fetchWeatherData(currentLocation);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentLocation]);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-600 bg-green-100';
    if (aqi <= 100) return 'text-yellow-600 bg-yellow-100';
    if (aqi <= 150) return 'text-orange-600 bg-orange-100';
    if (aqi <= 200) return 'text-red-600 bg-red-100';
    if (aqi <= 300) return 'text-purple-600 bg-purple-100';
    return 'text-red-800 bg-red-200';
  };

  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const handleLocationChange = (newLocation: string) => {
    setCurrentLocation(newLocation);
  };

  const handleRefresh = () => {
    fetchAirQualityData(currentLocation);
    fetchWeatherData(currentLocation);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                🌍 Air Quality Dashboard
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  NASA TEMPO
                </span>
              </h1>
              <p className="text-gray-600 mt-1">Real-time air quality monitoring and forecasts</p>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <LocationSearch onLocationChange={handleLocationChange} currentLocation={currentLocation} />
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Main AQI Display */}
        {airQualityData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current AQI */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-800">{airQualityData.location.replace('-', ' ')}</h2>
                </div>
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold ${getAQIColor(airQualityData.aqi)}`}>
                    {airQualityData.aqi}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mt-4">Air Quality Index</h3>
                  <p className={`text-lg font-semibold mt-2 px-4 py-2 rounded-lg ${getAQIColor(airQualityData.aqi)}`}>
                    {getAQICategory(airQualityData.aqi)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Data from NASA TEMPO + Ground Stations
                  </p>
                </div>
              </div>
            </div>

            {/* Pollutants Grid */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Pollutant Levels</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-700">PM2.5</p>
                        <p className="text-2xl font-bold text-red-800">{airQualityData.pollutants.pm25}</p>
                        <p className="text-xs text-red-600">µg/m³</p>
                      </div>
                      <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                        <Wind className="w-4 h-4 text-red-700" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">PM10</p>
                        <p className="text-2xl font-bold text-orange-800">{airQualityData.pollutants.pm10}</p>
                        <p className="text-xs text-orange-600">µg/m³</p>
                      </div>
                      <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                        <Wind className="w-4 h-4 text-orange-700" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">NO₂</p>
                        <p className="text-2xl font-bold text-blue-800">{airQualityData.pollutants.no2}</p>
                        <p className="text-xs text-blue-600">µg/m³</p>
                      </div>
                      <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-700" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">O₃</p>
                        <p className="text-2xl font-bold text-purple-800">{airQualityData.pollutants.o3}</p>
                        <p className="text-xs text-purple-600">µg/m³</p>
                      </div>
                      <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-purple-700" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">CO</p>
                        <p className="text-2xl font-bold text-gray-800">{airQualityData.pollutants.co}</p>
                        <p className="text-xs text-gray-600">mg/m³</p>
                      </div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <CloudRain className="w-4 h-4 text-gray-700" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Health</p>
                        <p className="text-lg font-bold text-green-800">
                          {airQualityData.aqi <= 50 ? 'Good' : airQualityData.aqi <= 100 ? 'Fair' : 'Poor'}
                        </p>
                        <p className="text-xs text-green-600">Status</p>
                      </div>
                      <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                        {airQualityData.aqi <= 50 ? (
                          <TrendingUp className="w-4 h-4 text-green-700" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-700" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts and Weather Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AQI Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">24-Hour AQI Trend</h3>
            <AQIChart location={currentLocation} />
          </div>

          {/* Weather Card */}
          {weatherData && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Weather Conditions</h3>
              <WeatherCard data={weatherData} />
            </div>
          )}
        </div>

        {/* Bottom Row: Pollutant Chart and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pollutant Breakdown Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Pollutant Breakdown</h3>
            {airQualityData && <PollutantChart data={airQualityData.pollutants} />}
          </div>

          {/* Alerts Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Active Alerts
            </h3>
            <AlertsPanel location={currentLocation} />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>🛰️ NASA TEMPO Satellite Data</span>
              <span>🌐 OpenAQ Ground Stations</span>
              <span>🌤️ Weather Integration</span>
            </div>
            <div>
              Updated every 5 minutes • Real-time monitoring
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
