const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
    index: true
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  temperature: {
    type: Number,
    required: true,
    min: -100,
    max: 60
  },
  humidity: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  pressure: {
    type: Number,
    required: true,
    min: 800,
    max: 1100
  },
  wind_speed: {
    type: Number,
    required: true,
    min: 0,
    max: 200
  },
  wind_direction: {
    type: Number,
    required: true,
    min: 0,
    max: 360
  },
  visibility: {
    type: Number,
    min: 0,
    max: 50
  },
  weather_condition: {
    type: String,
    enum: ['Clear', 'Clouds', 'Rain', 'Snow', 'Mist', 'Fog', 'Haze', 'Thunderstorm']
  },
  cloud_cover: {
    type: Number,
    min: 0,
    max: 100
  },
  uv_index: Number,
  dew_point: Number,
  source: {
    type: String,
    required: true,
    index: true
  },
  metadata: {
    city: String,
    country: String,
    region: String,
    sunrise: Date,
    sunset: Date,
    timezone: String,
    weather_description: String
  }
}, {
  timestamps: true,
  collection: 'weather_data'
});

// Indexes
weatherDataSchema.index({ latitude: 1, longitude: 1, timestamp: -1 });
weatherDataSchema.index({ timestamp: -1 });

// Static methods
weatherDataSchema.statics.findByLocation = function(lat, lon, radius = 0.1) {
  return this.find({
    latitude: { $gte: lat - radius, $lte: lat + radius },
    longitude: { $gte: lon - radius, $lte: lon + radius }
  }).sort({ timestamp: -1 });
};

weatherDataSchema.statics.getLatestByLocation = function(lat, lon) {
  return this.findOne({
    latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
    longitude: { $gte: lon - 0.1, $lte: lon + 0.1 }
  }).sort({ timestamp: -1 });
};

// Instance methods
weatherDataSchema.methods.getDispersionConditions = function() {
  // Calculate atmospheric conditions that affect pollutant dispersion
  const windCategories = {
    calm: this.wind_speed < 1,
    light: this.wind_speed < 4,
    moderate: this.wind_speed < 8,
    strong: this.wind_speed >= 8
  };
  
  const stabilityCondition = this.cloud_cover > 50 ? 'stable' : 'unstable';
  const mixingHeight = this.pressure > 1013 ? 'low' : 'high'; // Simplified
  
  return {
    wind_category: Object.keys(windCategories).find(key => windCategories[key]),
    atmospheric_stability: stabilityCondition,
    mixing_height: mixingHeight,
    dispersion_favorable: this.wind_speed > 2 && this.cloud_cover < 70
  };
};

module.exports = mongoose.model('WeatherData', weatherDataSchema);
