const axios = require('axios');
const cron = require('node-cron');
const mongoose = require('mongoose');
require('dotenv').config();

// Import data models
const TempoData = require('../models/TempoData');
const WeatherData = require('../models/WeatherData');
const GroundStationData = require('../models/GroundStationData');

class DataCollectorService {
  constructor() {
    this.nasaApiKey = process.env.NASA_API_KEY;
    this.openAQApiKey = process.env.OPENAQ_API_KEY;
    this.weatherApiKey = process.env.OPENWEATHERMAP_API_KEY;
    this.earthdataAuth = {
      username: process.env.EARTHDATA_USERNAME,
      password: process.env.EARTHDATA_PASSWORD
    };
    this.isCollecting = false;
  }

  /**
   * Fetch NASA TEMPO satellite data
   * @param {string} parameter - The pollutant parameter (no2, hcho, aerosol, pm, o3)
   * @param {object} options - Query options (lat, lon, date)
   */
  async fetchTempoData(parameter, options = {}) {
    try {
      console.log(`🛰️ Fetching TEMPO ${parameter.toUpperCase()} data...`);
      
      const { lat, lon, date } = options;
      const baseUrl = 'https://data.larc.nasa.gov/TEMPO';
      
      // Construct NASA TEMPO API URL based on parameter
      const parameterMap = {
        'no2': 'TEMPO_NO2_L2',
        'hcho': 'TEMPO_HCHO_L2', 
        'aerosol': 'TEMPO_AEROSOL_L2',
        'pm': 'TEMPO_PM_L2',
        'o3': 'TEMPO_O3_L2'
      };

      const productName = parameterMap[parameter];
      if (!productName) {
        throw new Error(`Invalid TEMPO parameter: ${parameter}`);
      }

      // Simulate TEMPO data structure (replace with actual NASA API calls)
      const tempoData = await this.simulateTempoData(parameter, { lat, lon, date });
      
      // Store in database
      const tempoRecord = new TempoData({
        parameter,
        latitude: parseFloat(lat) || 0,
        longitude: parseFloat(lon) || 0,
        timestamp: new Date(date) || new Date(),
        value: tempoData.value,
        quality_flag: tempoData.quality_flag,
        unit: tempoData.unit,
        metadata: {
          satellite: 'TEMPO',
          product: productName,
          version: 'v1.0',
          processing_level: 'L2'
        }
      });

      await tempoRecord.save();
      
      return {
        source: 'NASA TEMPO',
        parameter: parameter.toUpperCase(),
        location: { latitude: lat, longitude: lon },
        timestamp: tempoRecord.timestamp,
        value: tempoRecord.value,
        unit: tempoRecord.unit,
        quality_flag: tempoRecord.quality_flag,
        metadata: tempoRecord.metadata
      };

    } catch (error) {
      console.error(`❌ Error fetching TEMPO ${parameter} data:`, error.message);
      throw error;
    }
  }

  /**
   * Simulate TEMPO data for development (replace with real API calls)
   */
  async simulateTempoData(parameter, options) {
    const { lat = 40.7128, lon = -74.0060, date } = options;
    
    const dataTemplates = {
      no2: {
        value: Math.random() * 50 + 10, // 10-60 µg/m³
        unit: 'µg/m³',
        quality_flag: Math.random() > 0.1 ? 'good' : 'uncertain'
      },
      hcho: {
        value: Math.random() * 20 + 2, // 2-22 µg/m³
        unit: 'µg/m³', 
        quality_flag: Math.random() > 0.1 ? 'good' : 'uncertain'
      },
      aerosol: {
        value: Math.random() * 2 + 0.1, // 0.1-2.1 aerosol index
        unit: 'index',
        quality_flag: Math.random() > 0.1 ? 'good' : 'uncertain'
      },
      pm: {
        value: Math.random() * 100 + 10, // 10-110 µg/m³
        unit: 'µg/m³',
        quality_flag: Math.random() > 0.1 ? 'good' : 'uncertain'
      },
      o3: {
        value: Math.random() * 200 + 50, // 50-250 µg/m³
        unit: 'µg/m³',
        quality_flag: Math.random() > 0.1 ? 'good' : 'uncertain'
      }
    };

    return dataTemplates[parameter] || dataTemplates.no2;
  }

  /**
   * Fetch ground-based air quality data from OpenAQ
   */
  async fetchOpenAQData(location) {
    try {
      console.log('🏭 Fetching OpenAQ ground station data...');
      
      const response = await axios.get('https://api.openaq.org/v2/latest', {
        params: {
          coordinates: `${location.lat},${location.lon}`,
          radius: 50000, // 50km radius
          limit: 100
        },
        headers: {
          'X-API-Key': this.openAQApiKey
        }
      });

      const measurements = response.data.results || [];
      const groundData = [];

      for (const measurement of measurements) {
        for (const param of measurement.measurements || []) {
          const groundRecord = new GroundStationData({
            station_id: measurement.location,
            station_name: measurement.location,
            latitude: measurement.coordinates?.latitude,
            longitude: measurement.coordinates?.longitude,
            parameter: param.parameter,
            value: param.value,
            unit: param.unit,
            timestamp: new Date(param.lastUpdated),
            source: 'OpenAQ',
            metadata: {
              country: measurement.country,
              city: measurement.city,
              source_name: measurement.sourceName
            }
          });

          await groundRecord.save();
          groundData.push(groundRecord);
        }
      }

      return groundData;

    } catch (error) {
      console.error('❌ Error fetching OpenAQ data:', error.message);
      // Return simulated data as fallback
      return this.simulateGroundData(location);
    }
  }

  /**
   * Simulate ground station data for development
   */
  async simulateGroundData(location) {
    const parameters = ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'];
    const groundData = [];

    for (const param of parameters) {
      const values = {
        pm25: Math.random() * 50 + 5,
        pm10: Math.random() * 80 + 10,
        no2: Math.random() * 60 + 10,
        o3: Math.random() * 180 + 20,
        so2: Math.random() * 30 + 2,
        co: Math.random() * 2000 + 100
      };

      const groundRecord = new GroundStationData({
        station_id: `simulated_${param}_station`,
        station_name: `Simulated ${param.toUpperCase()} Station`,
        latitude: location.lat + (Math.random() - 0.5) * 0.1,
        longitude: location.lon + (Math.random() - 0.5) * 0.1,
        parameter: param,
        value: values[param],
        unit: param.includes('pm') ? 'µg/m³' : param === 'co' ? 'mg/m³' : 'µg/m³',
        timestamp: new Date(),
        source: 'Simulated',
        metadata: { type: 'development' }
      });

      await groundRecord.save();
      groundData.push(groundRecord);
    }

    return groundData;
  }

  /**
   * Fetch weather data from OpenWeatherMap
   */
  async fetchWeatherData(location) {
    try {
      console.log('🌤️ Fetching weather data...');
      
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat: location.lat,
          lon: location.lon,
          appid: this.weatherApiKey,
          units: 'metric'
        }
      });

      const weather = response.data;
      
      const weatherRecord = new WeatherData({
        latitude: location.lat,
        longitude: location.lon,
        timestamp: new Date(),
        temperature: weather.main.temp,
        humidity: weather.main.humidity,
        pressure: weather.main.pressure,
        wind_speed: weather.wind?.speed || 0,
        wind_direction: weather.wind?.deg || 0,
        visibility: weather.visibility / 1000, // Convert to km
        weather_condition: weather.weather[0]?.main,
        cloud_cover: weather.clouds?.all || 0,
        source: 'OpenWeatherMap',
        metadata: {
          city: weather.name,
          country: weather.sys?.country,
          sunrise: new Date(weather.sys?.sunrise * 1000),
          sunset: new Date(weather.sys?.sunset * 1000)
        }
      });

      await weatherRecord.save();
      return weatherRecord;

    } catch (error) {
      console.error('❌ Error fetching weather data:', error.message);
      return this.simulateWeatherData(location);
    }
  }

  /**
   * Simulate weather data for development
   */
  async simulateWeatherData(location) {
    const weatherRecord = new WeatherData({
      latitude: location.lat,
      longitude: location.lon,
      timestamp: new Date(),
      temperature: Math.random() * 30 + 5, // 5-35°C
      humidity: Math.random() * 60 + 30, // 30-90%
      pressure: Math.random() * 50 + 1000, // 1000-1050 hPa
      wind_speed: Math.random() * 15 + 1, // 1-16 m/s
      wind_direction: Math.random() * 360, // 0-360°
      visibility: Math.random() * 20 + 5, // 5-25 km
      weather_condition: ['Clear', 'Clouds', 'Rain', 'Mist'][Math.floor(Math.random() * 4)],
      cloud_cover: Math.random() * 100, // 0-100%
      source: 'Simulated',
      metadata: { type: 'development' }
    });

    await weatherRecord.save();
    return weatherRecord;
  }

  /**
   * Get latest aggregated data for a location
   */
  async getLatestData(location) {
    try {
      const [lat, lon] = location.split(',').map(parseFloat);
      
      // Get latest TEMPO data
      const tempoData = await TempoData.find({
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).sort({ timestamp: -1 }).limit(10);

      // Get latest ground station data
      const groundData = await GroundStationData.find({
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
        timestamp: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } // Last 6 hours
      }).sort({ timestamp: -1 }).limit(10);

      // Get latest weather data
      const weatherData = await WeatherData.findOne({
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
        timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last 1 hour
      }).sort({ timestamp: -1 });

      return {
        location: { latitude: lat, longitude: lon },
        satellite_data: tempoData,
        ground_data: groundData,
        weather_data: weatherData,
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error getting latest data:', error.message);
      throw error;
    }
  }

  /**
   * Start automated data collection
   */
  startDataCollection() {
    if (this.isCollecting) {
      console.log('⚠️ Data collection already running');
      return;
    }

    console.log('🔄 Starting automated data collection...');
    this.isCollecting = true;

    // Collect TEMPO data every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log('📊 Running scheduled TEMPO data collection...');
      try {
        const locations = [
          { lat: 40.7128, lon: -74.0060, name: 'New York' },
          { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' },
          { lat: 41.8781, lon: -87.6298, name: 'Chicago' },
          { lat: 39.7392, lon: -104.9903, name: 'Denver' }
        ];

        for (const location of locations) {
          for (const parameter of ['no2', 'hcho', 'aerosol', 'pm', 'o3']) {
            await this.fetchTempoData(parameter, location);
          }
          await this.fetchWeatherData(location);
          await this.fetchOpenAQData(location);
        }
      } catch (error) {
        console.error('❌ Scheduled data collection error:', error.message);
      }
    });

    console.log('✅ Data collection scheduled successfully');
  }

  /**
   * Stop automated data collection
   */
  stopDataCollection() {
    this.isCollecting = false;
    console.log('⏹️ Data collection stopped');
  }
}

module.exports = DataCollectorService;
