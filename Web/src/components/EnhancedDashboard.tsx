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
  CloudRain,
  Download,
  Share2,
  Settings,
  Bell,
  BellOff,
  Calendar,
  BarChart3,
  Map,
  Heart,
  Users,
  Zap,
  Globe,
  Camera,
  BookmarkPlus,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AQIChart from './AQIChart';
import PollutantChart from './PollutantChart';
import WeatherCard from './WeatherCard';
import AlertsPanel from './AlertsPanel';
import LocationSearch from './LocationSearch';
import ForecastView from './ForecastView';
import HistoricalView from './HistoricalView';
import SettingsModal from './SettingsModal';
import ComparisonView from './ComparisonView';

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

type ViewMode = 'current' | 'forecast' | 'historical' | 'comparison';

const EnhancedDashboard: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState('New-York');
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('current');
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(['New-York', 'London']);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPollutant, setSelectedPollutant] = useState<string>('all');

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

  // Auto-refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAirQualityData(currentLocation);
      fetchWeatherData(currentLocation);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentLocation, autoRefresh]);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-600 bg-green-100 border-green-200';
    if (aqi <= 100) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (aqi <= 150) return 'text-orange-600 bg-orange-100 border-orange-200';
    if (aqi <= 200) return 'text-red-600 bg-red-100 border-red-200';
    if (aqi <= 300) return 'text-purple-600 bg-purple-100 border-purple-200';
    return 'text-red-800 bg-red-200 border-red-300';
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

  const exportData = async () => {
    if (!airQualityData) return;
    
    const exportData = {
      location: airQualityData.location,
      timestamp: airQualityData.timestamp,
      aqi: airQualityData.aqi,
      category: getAQICategory(airQualityData.aqi),
      pollutants: airQualityData.pollutants,
      weather: weatherData,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `air-quality-${airQualityData.location}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareData = async () => {
    if (!airQualityData) return;
    
    const shareText = `🌍 Air Quality in ${airQualityData.location.replace('-', ' ')}\n\n` +
      `AQI: ${airQualityData.aqi} (${getAQICategory(airQualityData.aqi)})\n` +
      `PM2.5: ${airQualityData.pollutants.pm25} µg/m³\n` +
      `Updated: ${lastUpdate.toLocaleTimeString()}\n\n` +
      `#AirQuality #Environment #Health`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Air Quality Report',
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Air quality data copied to clipboard!');
    }
  };

  const toggleFavorite = (location: string) => {
    setFavorites(prev => 
      prev.includes(location) 
        ? prev.filter(loc => loc !== location)
        : [...prev, location]
    );
  };

  const getHealthRecommendation = (aqi: number) => {
    if (aqi <= 50) return "Great day for outdoor activities! 🌟";
    if (aqi <= 100) return "Good air quality. Normal outdoor activities are fine.";
    if (aqi <= 150) return "⚠️ Sensitive individuals should limit prolonged outdoor exertion.";
    if (aqi <= 200) return "🚨 Everyone should reduce prolonged outdoor exertion.";
    if (aqi <= 300) return "⛔ Avoid outdoor activities. Health alert!";
    return "🆘 Emergency conditions! Stay indoors!";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header with Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                🌍 Air Quality Dashboard
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  NASA TEMPO
                </span>
                {notifications && (
                  <span className="animate-pulse bg-red-500 w-2 h-2 rounded-full"></span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">Real-time air quality monitoring and forecasts</p>
            </div>
            
            {/* Action Buttons Row 1 */}
            <div className="flex flex-wrap items-center gap-3">
              <LocationSearch onLocationChange={handleLocationChange} currentLocation={currentLocation} />
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setNotifications(!notifications)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  notifications ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title={notifications ? 'Disable notifications' : 'Enable notifications'}
              >
                {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                <span className="hidden sm:inline">Alerts</span>
              </button>

              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Export data"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={shareData}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                title="Share data"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>

          {/* View Mode Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('current')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Current
            </button>
            <button
              onClick={() => setViewMode('forecast')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'forecast' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Forecast
            </button>
            <button
              onClick={() => setViewMode('historical')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'historical' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              History
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'comparison' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Compare
            </button>

            {/* Additional Feature Buttons */}
            <button
              onClick={() => toggleFavorite(currentLocation)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                favorites.includes(currentLocation) 
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Add to favorites"
            >
              <BookmarkPlus className="w-4 h-4 inline mr-2" />
              Favorite
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              title="Toggle detailed view"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4 inline mr-2" /> : <ChevronDown className="w-4 h-4 inline mr-2" />}
              {isExpanded ? 'Less' : 'More'}
            </button>
          </div>

          {/* Status Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Live data from NASA TEMPO & OpenAQ
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
              <button className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors">
                📊 View Trends
              </button>
              <button className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors">
                🗺️ Air Quality Map
              </button>
              <button className="text-xs px-3 py-1 bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors">
                📱 Mobile App
              </button>
              <button className="text-xs px-3 py-1 bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200 transition-colors">
                ⚡ Real-time Alerts
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <select 
                value={selectedPollutant}
                onChange={(e) => setSelectedPollutant(e.target.value)}
                className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Pollutants</option>
                <option value="pm25">PM2.5</option>
                <option value="pm10">PM10</option>
                <option value="no2">NO₂</option>
                <option value="o3">O₃</option>
                <option value="co">CO</option>
              </select>
              <Filter className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Main Content Based on View Mode */}
        {viewMode === 'current' && airQualityData && (
          <>
            {/* Health Alert Banner */}
            <div className={`rounded-xl p-4 border-2 ${getAQIColor(airQualityData.aqi)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold">Health Recommendation</h3>
                    <p className="text-sm">{getHealthRecommendation(airQualityData.aqi)}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white bg-opacity-50 rounded-lg hover:bg-opacity-75 transition-colors">
                  Learn More
                </button>
              </div>
            </div>

            {/* Main AQI Display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current AQI */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">{airQualityData.location.replace('-', ' ')}</h2>
                    <button
                      onClick={() => toggleFavorite(airQualityData.location)}
                      className={`p-1 rounded-full ${
                        favorites.includes(airQualityData.location) ? 'text-yellow-500' : 'text-gray-400'
                      }`}
                    >
                      <BookmarkPlus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold border-4 ${getAQIColor(airQualityData.aqi)}`}>
                      {airQualityData.aqi}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mt-4">Air Quality Index</h3>
                    <p className={`text-lg font-semibold mt-2 px-4 py-2 rounded-lg ${getAQIColor(airQualityData.aqi)}`}>
                      {getAQICategory(airQualityData.aqi)}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Data from NASA TEMPO + Ground Stations
                    </p>
                    
                    {/* Action buttons for current location */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <button className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors">
                        📸 Take Screenshot
                      </button>
                      <button className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors">
                        📍 Save Location
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Pollutants Grid */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">Pollutant Levels</h3>
                    <button className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      View Details
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg relative">
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
                      <div className="mt-2 text-xs text-red-600">
                        WHO limit: 15 µg/m³
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
                      <div className="mt-2 text-xs text-orange-600">
                        WHO limit: 45 µg/m³
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
                      <div className="mt-2 text-xs text-blue-600">
                        WHO limit: 25 µg/m³
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
                      <div className="mt-2 text-xs text-purple-600">
                        WHO limit: 100 µg/m³
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
                      <div className="mt-2 text-xs text-gray-600">
                        Safe level: < 10 mg/m³
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700">Health Index</p>
                          <p className="text-lg font-bold text-green-800">
                            {airQualityData.aqi <= 50 ? 'Excellent' : airQualityData.aqi <= 100 ? 'Good' : airQualityData.aqi <= 150 ? 'Moderate' : 'Poor'}
                          </p>
                          <p className="text-xs text-green-600">Overall</p>
                        </div>
                        <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                          {airQualityData.aqi <= 100 ? (
                            <TrendingUp className="w-4 h-4 text-green-700" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-700" />
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-green-600">
                        Based on WHO standards
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Weather Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AQI Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">24-Hour AQI Trend</h3>
                  <button className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors">
                    View Full History
                  </button>
                </div>
                <AQIChart location={currentLocation} />
              </div>

              {/* Weather Card */}
              {weatherData && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Weather Conditions</h3>
                    <button className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors">
                      7-Day Forecast
                    </button>
                  </div>
                  <WeatherCard data={weatherData} />
                </div>
              )}
            </div>

            {/* Bottom Row: Pollutant Chart and Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pollutant Breakdown Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Pollutant Breakdown</h3>
                  <div className="flex gap-2">
                    <button className="text-sm px-3 py-1 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors">
                      Bar Chart
                    </button>
                    <button className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      Pie Chart
                    </button>
                  </div>
                </div>
                <PollutantChart data={airQualityData.pollutants} />
              </div>

              {/* Alerts Panel */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Active Alerts
                  </h3>
                  <button className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors">
                    Manage
                  </button>
                </div>
                <AlertsPanel location={currentLocation} />
              </div>
            </div>
          </>
        )}

        {/* Other View Modes */}
        {viewMode === 'forecast' && <ForecastView location={currentLocation} />}
        {viewMode === 'historical' && <HistoricalView location={currentLocation} />}
        {viewMode === 'comparison' && <ComparisonView />}

        {/* Enhanced Footer with More Features */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Data Sources</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>🛰️</span>
                  <span>NASA TEMPO Satellite Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🌐</span>
                  <span>OpenAQ Ground Stations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🌤️</span>
                  <span>Weather Integration</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Quick Links</h4>
              <div className="space-y-1 text-sm text-blue-600">
                <button className="block hover:text-blue-800">📊 Historical Trends</button>
                <button className="block hover:text-blue-800">🗺️ Global Air Quality Map</button>
                <button className="block hover:text-blue-800">📱 Download Mobile App</button>
                <button className="block hover:text-blue-800">📧 Subscribe to Alerts</button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">System Status</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Updated every 5 minutes</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Real-time monitoring active</span>
                </div>
                <div>Next update: {new Date(Date.now() + 5*60*1000).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          notifications={notifications}
          setNotifications={setNotifications}
        />
      )}
    </div>
  );
};

export default EnhancedDashboard;
