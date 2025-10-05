
import * as Location from 'expo-location';

export interface AirQualityData {
  aqi: number;
  location: string;
  lastUpdated: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  pollutants: Pollutant[];
  forecast: ForecastItem[];
  weather?: WeatherData;
}

export interface Pollutant {
  name: string;
  value: number;
  unit: string;
  level: 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  description: string;
}

export interface ForecastItem {
  time: string;
  aqi: number;
  condition: string;
  timestamp?: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
}

export interface OpenAQResponse {
  results: Array<{
    location: string;
    city: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    measurements: Array<{
      parameter: string;
      value: number;
      unit: string;
      lastUpdated: string;
    }>;
  }>;
}

export interface WeatherResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    surface_pressure: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
  };
}

class ApiService {
  private readonly OPENAQ_BASE_URL = 'https://api.openaq.org/v2';
  private readonly WEATHER_BASE_URL = 'https://api.open-meteo.com/v1';

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      console.log('Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Location permission denied');
        return null;
      }

      console.log('Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 100,
      });

      console.log('Location obtained:', location.coords);
      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result.length > 0) {
        const address = result[0];
        return `${address.city || address.subregion || 'Unknown'}, ${address.region || address.country || 'Unknown'}`;
      }
      
      return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    }
  }

  async fetchAirQualityData(latitude: number, longitude: number): Promise<AirQualityData | null> {
    try {
      console.log(`Fetching air quality data for ${latitude}, ${longitude}`);
      
      // Fetch air quality data from OpenAQ
      const airQualityUrl = `${this.OPENAQ_BASE_URL}/latest?coordinates=${latitude},${longitude}&radius=25000&limit=1&order_by=lastUpdated&sort=desc`;
      
      console.log('Fetching from OpenAQ:', airQualityUrl);
      const airQualityResponse = await fetch(airQualityUrl);
      
      if (!airQualityResponse.ok) {
        throw new Error(`OpenAQ API error: ${airQualityResponse.status}`);
      }
      
      const airQualityJson: OpenAQResponse = await airQualityResponse.json();
      console.log('OpenAQ response:', airQualityJson);

      // Fetch weather data from Open-Meteo
      const weatherUrl = `${this.WEATHER_BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m&timezone=auto&forecast_days=2`;
      
      console.log('Fetching weather data:', weatherUrl);
      const weatherResponse = await fetch(weatherUrl);
      
      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status}`);
      }
      
      const weatherJson: WeatherResponse = await weatherResponse.json();
      console.log('Weather response:', weatherJson);

      // Get location name
      const locationName = await this.reverseGeocode(latitude, longitude);

      // Process the data
      return this.processAirQualityData(airQualityJson, weatherJson, latitude, longitude, locationName);
      
    } catch (error) {
      console.error('Error fetching air quality data:', error);
      return null;
    }
  }

  private processAirQualityData(
    airQualityData: OpenAQResponse,
    weatherData: WeatherResponse,
    latitude: number,
    longitude: number,
    locationName: string
  ): AirQualityData {
    console.log('Processing air quality data...');
    
    // Default values if no data available
    let pollutants: Pollutant[] = [
      { name: 'PM2.5', value: 0, unit: 'μg/m³', level: 'good', description: 'Fine particulate matter' },
      { name: 'PM10', value: 0, unit: 'μg/m³', level: 'good', description: 'Coarse particulate matter' },
      { name: 'O₃', value: 0, unit: 'μg/m³', level: 'good', description: 'Ground-level ozone' },
      { name: 'NO₂', value: 0, unit: 'μg/m³', level: 'good', description: 'Nitrogen dioxide' },
    ];

    let aqi = 25; // Default good AQI
    let lastUpdated = 'Just now';

    // Process OpenAQ data if available
    if (airQualityData.results && airQualityData.results.length > 0) {
      const result = airQualityData.results[0];
      console.log('Processing measurements:', result.measurements);
      
      // Update pollutants with real data
      result.measurements.forEach(measurement => {
        const pollutantIndex = pollutants.findIndex(p => 
          p.name.toLowerCase().includes(measurement.parameter.toLowerCase()) ||
          measurement.parameter.toLowerCase().includes(p.name.toLowerCase().replace('₃', '3'))
        );
        
        if (pollutantIndex !== -1) {
          pollutants[pollutantIndex] = {
            ...pollutants[pollutantIndex],
            value: measurement.value,
            unit: measurement.unit,
            level: this.getPollutantLevel(measurement.parameter, measurement.value),
          };
        }
      });

      // Calculate AQI from PM2.5 if available
      const pm25 = pollutants.find(p => p.name === 'PM2.5');
      if (pm25 && pm25.value > 0) {
        aqi = this.calculateAQIFromPM25(pm25.value);
      }

      // Get last updated time
      if (result.measurements.length > 0) {
        lastUpdated = this.formatLastUpdated(result.measurements[0].lastUpdated);
      }
    }

    // Generate forecast (mock data for now, in real app would use ML models)
    const forecast = this.generateForecast(aqi);

    // Process weather data
    const weather: WeatherData = {
      temperature: weatherData.current.temperature_2m,
      humidity: weatherData.current.relative_humidity_2m,
      windSpeed: weatherData.current.wind_speed_10m,
      windDirection: weatherData.current.wind_direction_10m,
      pressure: weatherData.current.surface_pressure,
    };

    return {
      aqi,
      location: locationName,
      lastUpdated,
      coordinates: { latitude, longitude },
      pollutants,
      forecast,
      weather,
    };
  }

  private getPollutantLevel(parameter: string, value: number): 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous' {
    // Simplified thresholds - in real app would use official EPA/WHO standards
    switch (parameter.toLowerCase()) {
      case 'pm25':
        if (value <= 12) return 'good';
        if (value <= 35) return 'moderate';
        if (value <= 55) return 'unhealthy';
        if (value <= 150) return 'very_unhealthy';
        return 'hazardous';
      case 'pm10':
        if (value <= 54) return 'good';
        if (value <= 154) return 'moderate';
        if (value <= 254) return 'unhealthy';
        if (value <= 354) return 'very_unhealthy';
        return 'hazardous';
      case 'o3':
        if (value <= 108) return 'good';
        if (value <= 140) return 'moderate';
        if (value <= 170) return 'unhealthy';
        if (value <= 210) return 'very_unhealthy';
        return 'hazardous';
      case 'no2':
        if (value <= 100) return 'good';
        if (value <= 200) return 'moderate';
        if (value <= 400) return 'unhealthy';
        if (value <= 800) return 'very_unhealthy';
        return 'hazardous';
      default:
        return 'good';
    }
  }

  private calculateAQIFromPM25(pm25: number): number {
    // EPA AQI calculation for PM2.5
    if (pm25 <= 12.0) return Math.round((50 / 12.0) * pm25);
    if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
    if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
    if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
    if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
    return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301);
  }

  private formatLastUpdated(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  }

  private generateForecast(currentAqi: number): ForecastItem[] {
    // Simple forecast generation - in real app would use ML models
    const forecast: ForecastItem[] = [];
    const now = new Date();
    
    const timeLabels = ['Now', '6 AM', '12 PM', '6 PM', 'Tomorrow', '+24h', '+36h', '+48h'];
    
    for (let i = 0; i < timeLabels.length; i++) {
      const variation = (Math.random() - 0.5) * 30; // Random variation
      const aqiValue = Math.max(10, Math.min(300, currentAqi + variation));
      
      forecast.push({
        time: timeLabels[i],
        aqi: Math.round(aqiValue),
        condition: this.getAQICondition(aqiValue),
        timestamp: now.getTime() + (i * 6 * 60 * 60 * 1000), // 6 hour intervals
      });
    }
    
    return forecast;
  }

  private getAQICondition(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  // Fallback to major cities if location access fails
  async getFallbackCityData(): Promise<AirQualityData | null> {
    const majorCities = [
      { name: 'New York, NY', lat: 40.7128, lon: -74.0060 },
      { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
      { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298 },
      { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
    ];

    // Try each city until we get data
    for (const city of majorCities) {
      try {
        const data = await this.fetchAirQualityData(city.lat, city.lon);
        if (data) {
          console.log(`Using fallback city: ${city.name}`);
          return data;
        }
      } catch (error) {
        console.error(`Failed to get data for ${city.name}:`, error);
      }
    }

    return null;
  }
}

export const apiService = new ApiService();
