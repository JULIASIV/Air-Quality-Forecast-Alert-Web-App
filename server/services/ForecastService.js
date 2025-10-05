const PolynomialRegression = require('ml-regression-polynomial');
const { evaluate } = require('mathjs');
const moment = require('moment');

// Import data models
const TempoData = require('../models/TempoData');
const WeatherData = require('../models/WeatherData');
const GroundStationData = require('../models/GroundStationData');

class ForecastService {
  constructor() {
    this.models = {};
    this.modelMetrics = {};
  }

  /**
   * Generate air quality forecast for a location
   * @param {string} location - Location string (lat,lon or city name)
   * @param {number} hours - Number of hours to forecast (default: 24)
   */
  async generateForecast(location, hours = 24) {
    try {
      console.log(`🔮 Generating ${hours}-hour air quality forecast for ${location}...`);
      
      const coordinates = await this.parseLocation(location);
      if (!coordinates) {
        throw new Error(`Could not parse location: ${location}`);
      }

      const { lat, lon } = coordinates;

      // Gather historical data for training
      const historicalData = await this.gatherHistoricalData(lat, lon);
      
      // Train/update ML models
      await this.trainModels(historicalData);

      // Generate weather-based forecasts
      const weatherForecast = await this.getWeatherForecast(lat, lon, hours);
      
      // Generate predictions for each pollutant
      const forecasts = {};
      const parameters = ['no2', 'pm', 'o3', 'hcho'];

      for (const parameter of parameters) {
        forecasts[parameter] = await this.forecastParameter(
          parameter, 
          lat, 
          lon, 
          weatherForecast, 
          hours,
          historicalData
        );
      }

      // Calculate overall AQI forecast
      const aqiForecast = this.calculateAQIForecast(forecasts, hours);

      // Generate health recommendations
      const healthRecommendations = this.generateHealthRecommendations(aqiForecast);

      return {
        location: { latitude: lat, longitude: lon },
        forecast_hours: hours,
        generated_at: new Date().toISOString(),
        parameters: forecasts,
        aqi: aqiForecast,
        health: healthRecommendations,
        confidence: this.calculateConfidence(forecasts),
        data_sources: ['NASA TEMPO', 'OpenAQ', 'Weather Data'],
        methodology: 'Polynomial regression with weather correlation',
        next_update: moment().add(1, 'hour').toISOString()
      };

    } catch (error) {
      console.error('❌ Forecast generation error:', error.message);
      throw error;
    }
  }

  /**
   * Parse location string to coordinates
   */
  async parseLocation(location) {
    // If location is already coordinates
    if (location.includes(',')) {
      const [lat, lon] = location.split(',').map(parseFloat);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }

    // For city names, use a simple mapping (in production, use geocoding API)
    const cityCoordinates = {
      'new york': { lat: 40.7128, lon: -74.0060 },
      'los angeles': { lat: 34.0522, lon: -118.2437 },
      'chicago': { lat: 41.8781, lon: -87.6298 },
      'denver': { lat: 39.7392, lon: -104.9903 },
      'washington': { lat: 38.9072, lon: -77.0369 },
      'houston': { lat: 29.7604, lon: -95.3698 },
      'phoenix': { lat: 33.4484, lon: -112.0740 },
      'philadelphia': { lat: 39.9526, lon: -75.1652 }
    };

    return cityCoordinates[location.toLowerCase()] || null;
  }

  /**
   * Gather historical data for model training
   */
  async gatherHistoricalData(lat, lon) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    try {
      // Get TEMPO data
      const tempoData = await TempoData.find({
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
        timestamp: { $gte: thirtyDaysAgo },
        quality_flag: { $in: ['good', 'uncertain'] }
      }).sort({ timestamp: 1 });

      // Get ground station data
      const groundData = await GroundStationData.find({
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
        timestamp: { $gte: thirtyDaysAgo },
        data_quality: { $in: ['valid', 'questionable'] }
      }).sort({ timestamp: 1 });

      // Get weather data
      const weatherData = await WeatherData.find({
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
        timestamp: { $gte: thirtyDaysAgo }
      }).sort({ timestamp: 1 });

      return { tempoData, groundData, weatherData };

    } catch (error) {
      console.error('Error gathering historical data:', error);
      return { tempoData: [], groundData: [], weatherData: [] };
    }
  }

  /**
   * Train ML models for each parameter
   */
  async trainModels(historicalData) {
    const { tempoData, groundData, weatherData } = historicalData;

    // Prepare training data combining satellite and ground measurements
    const trainingData = this.prepareTrainingData(tempoData, groundData, weatherData);

    const parameters = ['no2', 'pm', 'o3', 'hcho'];

    for (const parameter of parameters) {
      const parameterData = trainingData.filter(d => d.parameter === parameter);
      
      if (parameterData.length < 10) {
        console.log(`⚠️ Insufficient data for ${parameter} model (${parameterData.length} points)`);
        continue;
      }

      try {
        // Features: hour_of_day, day_of_week, temperature, humidity, wind_speed, pressure
        const X = parameterData.map(d => [
          moment(d.timestamp).hour(),
          moment(d.timestamp).day(),
          d.temperature || 20,
          d.humidity || 50,
          d.wind_speed || 5,
          d.pressure || 1013,
          d.cloud_cover || 50
        ]);

        const Y = parameterData.map(d => d.value);

        // Train polynomial regression model (degree 2)
        const model = new PolynomialRegression(X, Y, 2);
        this.models[parameter] = model;

        // Calculate model performance metrics
        const predictions = X.map(x => model.predict(x));
        const mse = this.calculateMSE(Y, predictions);
        const r2 = this.calculateR2(Y, predictions);

        this.modelMetrics[parameter] = { mse, r2, dataPoints: parameterData.length };
        
        console.log(`✅ Trained ${parameter} model: R² = ${r2.toFixed(3)}, MSE = ${mse.toFixed(2)}, N = ${parameterData.length}`);

      } catch (error) {
        console.error(`❌ Error training ${parameter} model:`, error.message);
      }
    }
  }

  /**
   * Prepare training data by combining satellite, ground, and weather data
   */
  prepareTrainingData(tempoData, groundData, weatherData) {
    const combinedData = [];

    // Process TEMPO data
    tempoData.forEach(tempo => {
      const nearestWeather = this.findNearestWeather(tempo.timestamp, weatherData);
      if (nearestWeather) {
        combinedData.push({
          parameter: tempo.parameter,
          value: tempo.value,
          timestamp: tempo.timestamp,
          source: 'satellite',
          temperature: nearestWeather.temperature,
          humidity: nearestWeather.humidity,
          wind_speed: nearestWeather.wind_speed,
          pressure: nearestWeather.pressure,
          cloud_cover: nearestWeather.cloud_cover || 50
        });
      }
    });

    // Process ground station data
    groundData.forEach(ground => {
      const nearestWeather = this.findNearestWeather(ground.timestamp, weatherData);
      if (nearestWeather && ['no2', 'pm25', 'o3'].includes(ground.parameter)) {
        combinedData.push({
          parameter: ground.parameter === 'pm25' ? 'pm' : ground.parameter,
          value: ground.value,
          timestamp: ground.timestamp,
          source: 'ground',
          temperature: nearestWeather.temperature,
          humidity: nearestWeather.humidity,
          wind_speed: nearestWeather.wind_speed,
          pressure: nearestWeather.pressure,
          cloud_cover: nearestWeather.cloud_cover || 50
        });
      }
    });

    return combinedData;
  }

  /**
   * Find nearest weather data point to a given timestamp
   */
  findNearestWeather(timestamp, weatherData) {
    if (!weatherData.length) return null;

    let nearest = weatherData[0];
    let minDiff = Math.abs(timestamp - weatherData[0].timestamp);

    for (const weather of weatherData) {
      const diff = Math.abs(timestamp - weather.timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = weather;
      }
    }

    // Only return if within 6 hours
    return minDiff <= 6 * 60 * 60 * 1000 ? nearest : null;
  }

  /**
   * Get weather forecast (simplified - in production use weather API)
   */
  async getWeatherForecast(lat, lon, hours) {
    const forecast = [];
    const current = await WeatherData.getLatestByLocation(lat, lon);
    
    if (!current) {
      // Generate synthetic weather data if no current data available
      const baseTemp = 20 + Math.sin(moment().hour() * Math.PI / 12) * 10;
      
      for (let h = 0; h < hours; h++) {
        forecast.push({
          timestamp: moment().add(h, 'hours').toDate(),
          temperature: baseTemp + Math.sin(h * Math.PI / 12) * 5 + Math.random() * 4 - 2,
          humidity: 50 + Math.random() * 30,
          wind_speed: 3 + Math.random() * 8,
          pressure: 1013 + Math.random() * 20 - 10,
          cloud_cover: Math.random() * 100
        });
      }
    } else {
      // Use current weather as base and add variations
      for (let h = 0; h < hours; h++) {
        forecast.push({
          timestamp: moment().add(h, 'hours').toDate(),
          temperature: current.temperature + Math.sin(h * Math.PI / 12) * 3 + Math.random() * 2 - 1,
          humidity: Math.max(20, Math.min(90, current.humidity + Math.random() * 20 - 10)),
          wind_speed: Math.max(0, current.wind_speed + Math.random() * 4 - 2),
          pressure: current.pressure + Math.random() * 10 - 5,
          cloud_cover: Math.max(0, Math.min(100, (current.cloud_cover || 50) + Math.random() * 40 - 20))
        });
      }
    }

    return forecast;
  }

  /**
   * Forecast a specific parameter
   */
  async forecastParameter(parameter, lat, lon, weatherForecast, hours, historicalData) {
    const model = this.models[parameter];
    const forecast = [];

    if (!model) {
      console.log(`⚠️ No model available for ${parameter}, using simple trend`);
      return this.generateSimpleForecast(parameter, lat, lon, hours, historicalData);
    }

    for (let h = 0; h < hours; h++) {
      const weather = weatherForecast[h];
      const timestamp = moment().add(h, 'hours');
      
      const features = [
        timestamp.hour(),
        timestamp.day(),
        weather.temperature,
        weather.humidity,
        weather.wind_speed,
        weather.pressure,
        weather.cloud_cover
      ];

      try {
        let prediction = model.predict(features);
        
        // Apply weather-based adjustments
        prediction = this.applyWeatherAdjustments(prediction, parameter, weather);
        
        // Ensure non-negative values
        prediction = Math.max(0, prediction);
        
        forecast.push({
          timestamp: timestamp.toDate(),
          value: Math.round(prediction * 100) / 100,
          confidence: this.calculatePredictionConfidence(parameter, h),
          weather_influence: this.getWeatherInfluence(parameter, weather)
        });

      } catch (error) {
        console.error(`Error predicting ${parameter} at hour ${h}:`, error);
        forecast.push({
          timestamp: timestamp.toDate(),
          value: 0,
          confidence: 0,
          error: true
        });
      }
    }

    return forecast;
  }

  /**
   * Generate simple trend-based forecast when ML model is unavailable
   */
  async generateSimpleForecast(parameter, lat, lon, hours, historicalData) {
    const recentData = [...historicalData.tempoData, ...historicalData.groundData]
      .filter(d => d.parameter === parameter || (d.parameter === 'pm25' && parameter === 'pm'))
      .slice(-24); // Last 24 data points

    if (recentData.length === 0) {
      // Generate synthetic baseline values
      const baselines = { no2: 25, pm: 15, o3: 60, hcho: 8 };
      const baseValue = baselines[parameter] || 20;
      
      return Array.from({ length: hours }, (_, h) => ({
        timestamp: moment().add(h, 'hours').toDate(),
        value: baseValue + Math.sin(h * Math.PI / 12) * 5 + Math.random() * 4 - 2,
        confidence: 0.3,
        method: 'synthetic'
      }));
    }

    const avgValue = recentData.reduce((sum, d) => sum + d.value, 0) / recentData.length;
    const trend = recentData.length > 1 
      ? (recentData[recentData.length - 1].value - recentData[0].value) / recentData.length
      : 0;

    return Array.from({ length: hours }, (_, h) => ({
      timestamp: moment().add(h, 'hours').toDate(),
      value: Math.max(0, avgValue + trend * h + Math.sin(h * Math.PI / 12) * avgValue * 0.2),
      confidence: 0.5,
      method: 'trend'
    }));
  }

  /**
   * Apply weather-based adjustments to predictions
   */
  applyWeatherAdjustments(prediction, parameter, weather) {
    let adjustment = 1.0;

    switch (parameter) {
      case 'no2':
        // Higher pressure and lower wind increase NO2
        adjustment *= (weather.pressure / 1013) * 0.2 + 0.8;
        adjustment *= Math.max(0.5, (10 - weather.wind_speed) / 10);
        break;
        
      case 'pm':
        // Low wind and high humidity increase PM
        adjustment *= Math.max(0.6, (8 - weather.wind_speed) / 8);
        adjustment *= (weather.humidity / 100) * 0.3 + 0.7;
        break;
        
      case 'o3':
        // High temperature and low humidity increase ozone
        adjustment *= Math.max(0.7, (weather.temperature - 10) / 30);
        adjustment *= Math.max(0.8, (100 - weather.humidity) / 100);
        break;
        
      case 'hcho':
        // Temperature dependent
        adjustment *= Math.max(0.8, (weather.temperature - 5) / 25);
        break;
    }

    return prediction * Math.max(0.3, Math.min(2.0, adjustment));
  }

  /**
   * Calculate overall AQI forecast
   */
  calculateAQIForecast(forecasts, hours) {
    const aqiForecast = [];

    for (let h = 0; h < hours; h++) {
      const hourlyAQI = {};
      let maxAQI = 0;
      let dominantPollutant = 'unknown';

      // Calculate AQI for each parameter
      Object.entries(forecasts).forEach(([param, forecast]) => {
        if (forecast[h] && !forecast[h].error) {
          const aqi = this.calculateAQIFromConcentration(param, forecast[h].value);
          hourlyAQI[param] = aqi;
          
          if (aqi > maxAQI) {
            maxAQI = aqi;
            dominantPollutant = param;
          }
        }
      });

      aqiForecast.push({
        timestamp: moment().add(h, 'hours').toDate(),
        aqi: Math.round(maxAQI),
        category: this.getAQICategory(maxAQI),
        dominant_pollutant: dominantPollutant,
        individual_aqi: hourlyAQI
      });
    }

    return aqiForecast;
  }

  /**
   * Calculate AQI from pollutant concentration
   */
  calculateAQIFromConcentration(parameter, concentration) {
    const aqiBreakpoints = {
      pm: [
        { cLow: 0, cHigh: 12.0, aqiLow: 0, aqiHigh: 50 },
        { cLow: 12.1, cHigh: 35.4, aqiLow: 51, aqiHigh: 100 },
        { cLow: 35.5, cHigh: 55.4, aqiLow: 101, aqiHigh: 150 },
        { cLow: 55.5, cHigh: 150.4, aqiLow: 151, aqiHigh: 200 },
        { cLow: 150.5, cHigh: 250.4, aqiLow: 201, aqiHigh: 300 },
        { cLow: 250.5, cHigh: 500.4, aqiLow: 301, aqiHigh: 500 }
      ],
      o3: [
        { cLow: 0, cHigh: 54, aqiLow: 0, aqiHigh: 50 },
        { cLow: 55, cHigh: 70, aqiLow: 51, aqiHigh: 100 },
        { cLow: 71, cHigh: 85, aqiLow: 101, aqiHigh: 150 },
        { cLow: 86, cHigh: 105, aqiLow: 151, aqiHigh: 200 },
        { cLow: 106, cHigh: 200, aqiLow: 201, aqiHigh: 300 }
      ],
      no2: [
        { cLow: 0, cHigh: 53, aqiLow: 0, aqiHigh: 50 },
        { cLow: 54, cHigh: 100, aqiLow: 51, aqiHigh: 100 },
        { cLow: 101, cHigh: 360, aqiLow: 101, aqiHigh: 150 },
        { cLow: 361, cHigh: 649, aqiLow: 151, aqiHigh: 200 },
        { cLow: 650, cHigh: 1249, aqiLow: 201, aqiHigh: 300 }
      ]
    };

    const breakpoints = aqiBreakpoints[parameter];
    if (!breakpoints) return 50; // Default moderate if unknown

    for (const bp of breakpoints) {
      if (concentration >= bp.cLow && concentration <= bp.cHigh) {
        const aqi = ((bp.aqiHigh - bp.aqiLow) / (bp.cHigh - bp.cLow)) * 
                    (concentration - bp.cLow) + bp.aqiLow;
        return aqi;
      }
    }

    return 500; // Hazardous if above all breakpoints
  }

  /**
   * Get AQI category from numeric value
   */
  getAQICategory(aqi) {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy_sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very_unhealthy';
    return 'hazardous';
  }

  /**
   * Generate health recommendations based on forecast
   */
  generateHealthRecommendations(aqiForecast) {
    const recommendations = [];
    const alerts = [];

    aqiForecast.forEach((forecast, index) => {
      const category = forecast.category;
      const hour = moment().add(index, 'hours');

      if (['unhealthy', 'very_unhealthy', 'hazardous'].includes(category)) {
        alerts.push({
          timestamp: forecast.timestamp,
          severity: category,
          message: this.getAlertMessage(category, forecast.dominant_pollutant),
          affected_groups: this.getAffectedGroups(category)
        });
      }

      if (index < 6) { // Next 6 hours recommendations
        recommendations.push({
          time_period: hour.format('HH:mm'),
          category: category,
          advice: this.getHealthAdvice(category),
          outdoor_activities: this.getOutdoorActivitiesAdvice(category)
        });
      }
    });

    return { recommendations, alerts };
  }

  /**
   * Get alert message for health category
   */
  getAlertMessage(category, pollutant) {
    const messages = {
      unhealthy: `Air quality is unhealthy due to elevated ${pollutant}. Limit outdoor activities.`,
      very_unhealthy: `Air quality alert! Everyone may experience health effects from ${pollutant}.`,
      hazardous: `Health emergency! Air quality is hazardous due to ${pollutant}. Stay indoors.`
    };
    return messages[category] || 'Monitor air quality conditions.';
  }

  /**
   * Get affected groups for health category
   */
  getAffectedGroups(category) {
    const groups = {
      unhealthy_sensitive: ['children', 'elderly', 'respiratory_conditions', 'heart_conditions'],
      unhealthy: ['everyone', 'especially_sensitive_groups'],
      very_unhealthy: ['everyone'],
      hazardous: ['everyone']
    };
    return groups[category] || ['sensitive_groups'];
  }

  /**
   * Get health advice for category
   */
  getHealthAdvice(category) {
    const advice = {
      good: 'Great day for outdoor activities!',
      moderate: 'Sensitive individuals should limit prolonged outdoor exertion.',
      unhealthy_sensitive: 'Reduce time outdoors, especially if you\'re sensitive to air pollution.',
      unhealthy: 'Limit outdoor activities. Everyone may experience health effects.',
      very_unhealthy: 'Avoid outdoor activities. Serious health effects possible.',
      hazardous: 'Emergency conditions! Stay indoors with windows closed.'
    };
    return advice[category] || 'Monitor air quality conditions.';
  }

  /**
   * Get outdoor activities advice
   */
  getOutdoorActivitiesAdvice(category) {
    const advice = {
      good: 'All outdoor activities recommended',
      moderate: 'Most activities OK, sensitive groups be cautious',
      unhealthy_sensitive: 'Light activities only for sensitive groups',
      unhealthy: 'Limit all outdoor activities',
      very_unhealthy: 'Avoid all outdoor activities',
      hazardous: 'Stay indoors completely'
    };
    return advice[category] || 'Use caution outdoors';
  }

  /**
   * Calculate prediction confidence
   */
  calculatePredictionConfidence(parameter, hourOffset) {
    const baseConfidence = this.modelMetrics[parameter]?.r2 || 0.5;
    const timeDecay = Math.exp(-hourOffset / 12); // Confidence decreases with time
    return Math.min(0.95, baseConfidence * timeDecay);
  }

  /**
   * Get weather influence on pollutant
   */
  getWeatherInfluence(parameter, weather) {
    const influences = [];
    
    if (weather.wind_speed < 3) influences.push('low_wind_dispersion');
    if (weather.humidity > 70) influences.push('high_humidity');
    if (weather.temperature > 25 && parameter === 'o3') influences.push('heat_ozone_formation');
    if (weather.pressure > 1020) influences.push('high_pressure_stagnation');
    
    return influences;
  }

  /**
   * Calculate overall forecast confidence
   */
  calculateConfidence(forecasts) {
    const confidences = [];
    
    Object.values(forecasts).forEach(forecast => {
      forecast.slice(0, 6).forEach(f => { // First 6 hours
        if (f.confidence !== undefined) confidences.push(f.confidence);
      });
    });

    return confidences.length > 0 
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0.5;
  }

  /**
   * Calculate Mean Squared Error
   */
  calculateMSE(actual, predicted) {
    const n = actual.length;
    const mse = actual.reduce((sum, act, i) => {
      const diff = act - predicted[i];
      return sum + (diff * diff);
    }, 0) / n;
    return mse;
  }

  /**
   * Calculate R-squared (coefficient of determination)
   */
  calculateR2(actual, predicted) {
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = actual.reduce((sum, act, i) => {
      return sum + Math.pow(act - predicted[i], 2);
    }, 0);
    
    return 1 - (residualSumSquares / totalSumSquares);
  }
}

module.exports = ForecastService;
