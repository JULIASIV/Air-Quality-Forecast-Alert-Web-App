const mongoose = require('mongoose');

const groundStationDataSchema = new mongoose.Schema({
  station_id: {
    type: String,
    required: true,
    index: true
  },
  station_name: {
    type: String,
    required: true
  },
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
  parameter: {
    type: String,
    required: true,
    enum: ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co', 'nh3', 'bc'],
    index: true
  },
  value: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Air quality value must be non-negative'
    }
  },
  unit: {
    type: String,
    required: true,
    enum: ['µg/m³', 'mg/m³', 'ppb', 'ppm']
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  source: {
    type: String,
    required: true,
    enum: ['OpenAQ', 'EPA', 'Pandora', 'TOLNet', 'PurpleAir', 'AirNow', 'Simulated'],
    index: true
  },
  data_quality: {
    type: String,
    enum: ['valid', 'questionable', 'invalid', 'calibrating'],
    default: 'valid'
  },
  metadata: {
    country: String,
    state: String,
    city: String,
    source_name: String,
    instrument_type: String,
    measurement_method: String,
    averaging_period: String,
    detection_limit: Number,
    uncertainty: Number,
    calibration_date: Date
  }
}, {
  timestamps: true,
  collection: 'ground_station_data'
});

// Compound indexes
groundStationDataSchema.index({ latitude: 1, longitude: 1, timestamp: -1 });
groundStationDataSchema.index({ parameter: 1, timestamp: -1 });
groundStationDataSchema.index({ station_id: 1, parameter: 1, timestamp: -1 });

// Static methods
groundStationDataSchema.statics.findByLocation = function(lat, lon, radius = 0.1) {
  return this.find({
    latitude: { $gte: lat - radius, $lte: lat + radius },
    longitude: { $gte: lon - radius, $lte: lon + radius }
  }).sort({ timestamp: -1 });
};

groundStationDataSchema.statics.findNearbyStations = function(lat, lon, radius = 50) {
  // Find stations within radius (km)
  const radiusInDegrees = radius / 111; // Rough conversion
  
  return this.aggregate([
    {
      $match: {
        latitude: { $gte: lat - radiusInDegrees, $lte: lat + radiusInDegrees },
        longitude: { $gte: lon - radiusInDegrees, $lte: lon + radiusInDegrees }
      }
    },
    {
      $group: {
        _id: {
          station_id: '$station_id',
          station_name: '$station_name',
          latitude: '$latitude',
          longitude: '$longitude'
        },
        latest_timestamp: { $max: '$timestamp' },
        parameter_count: { $sum: 1 },
        parameters: { $addToSet: '$parameter' }
      }
    },
    {
      $sort: { latest_timestamp: -1 }
    }
  ]);
};

groundStationDataSchema.statics.getLatestByParameter = function(parameter, limit = 100) {
  return this.find({ 
    parameter,
    data_quality: { $in: ['valid', 'questionable'] },
    timestamp: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } // Last 6 hours
  })
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Instance methods
groundStationDataSchema.methods.calculateAQI = function() {
  // Simplified AQI calculation based on US EPA standards
  const aqiBreakpoints = {
    pm25: [
      { low: 0, high: 12.0, aqiLow: 0, aqiHigh: 50 },
      { low: 12.1, high: 35.4, aqiLow: 51, aqiHigh: 100 },
      { low: 35.5, high: 55.4, aqiLow: 101, aqiHigh: 150 },
      { low: 55.5, high: 150.4, aqiLow: 151, aqiHigh: 200 },
      { low: 150.5, high: 250.4, aqiLow: 201, aqiHigh: 300 },
      { low: 250.5, high: 500.4, aqiLow: 301, aqiHigh: 500 }
    ],
    pm10: [
      { low: 0, high: 54, aqiLow: 0, aqiHigh: 50 },
      { low: 55, high: 154, aqiLow: 51, aqiHigh: 100 },
      { low: 155, high: 254, aqiLow: 101, aqiHigh: 150 },
      { low: 255, high: 354, aqiLow: 151, aqiHigh: 200 },
      { low: 355, high: 424, aqiLow: 201, aqiHigh: 300 },
      { low: 425, high: 604, aqiLow: 301, aqiHigh: 500 }
    ],
    o3: [
      { low: 0, high: 54, aqiLow: 0, aqiHigh: 50 },
      { low: 55, high: 70, aqiLow: 51, aqiHigh: 100 },
      { low: 71, high: 85, aqiLow: 101, aqiHigh: 150 },
      { low: 86, high: 105, aqiLow: 151, aqiHigh: 200 },
      { low: 106, high: 200, aqiLow: 201, aqiHigh: 300 }
    ],
    no2: [
      { low: 0, high: 53, aqiLow: 0, aqiHigh: 50 },
      { low: 54, high: 100, aqiLow: 51, aqiHigh: 100 },
      { low: 101, high: 360, aqiLow: 101, aqiHigh: 150 },
      { low: 361, high: 649, aqiLow: 151, aqiHigh: 200 },
      { low: 650, high: 1249, aqiLow: 201, aqiHigh: 300 },
      { low: 1250, high: 2049, aqiLow: 301, aqiHigh: 500 }
    ]
  };

  const breakpoints = aqiBreakpoints[this.parameter];
  if (!breakpoints) return null;

  const concentration = this.unit === 'ppb' && this.parameter === 'no2' 
    ? this.value * 1.88 // Convert NO2 ppb to µg/m³
    : this.value;

  for (const bp of breakpoints) {
    if (concentration >= bp.low && concentration <= bp.high) {
      const aqi = ((bp.aqiHigh - bp.aqiLow) / (bp.high - bp.low)) * (concentration - bp.low) + bp.aqiLow;
      return Math.round(aqi);
    }
  }

  return 500; // Hazardous if above all breakpoints
};

groundStationDataSchema.methods.getHealthCategory = function() {
  const aqi = this.calculateAQI();
  if (aqi === null) return 'unknown';

  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy_sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very_unhealthy';
  return 'hazardous';
};

groundStationDataSchema.methods.getHealthRecommendations = function() {
  const category = this.getHealthCategory();
  
  const recommendations = {
    good: {
      general: "Air quality is satisfactory. Enjoy outdoor activities!",
      sensitive: "No precautions needed for sensitive groups."
    },
    moderate: {
      general: "Air quality is acceptable for most people.",
      sensitive: "Unusually sensitive people should consider limiting prolonged outdoor exertion."
    },
    unhealthy_sensitive: {
      general: "Air quality is acceptable for most people.",
      sensitive: "Children, elderly, and people with respiratory or heart conditions should limit outdoor activities."
    },
    unhealthy: {
      general: "Everyone may begin to experience health effects. Limit outdoor activities.",
      sensitive: "Children, elderly, and people with health conditions should avoid outdoor activities."
    },
    very_unhealthy: {
      general: "Health alert! Everyone may experience serious health effects. Avoid outdoor activities.",
      sensitive: "Children, elderly, and people with health conditions should stay indoors."
    },
    hazardous: {
      general: "Health warning! Emergency conditions. Stay indoors with air purifiers if possible.",
      sensitive: "Everyone should avoid all outdoor activities."
    }
  };

  return recommendations[category] || recommendations.good;
};

module.exports = mongoose.model('GroundStationData', groundStationDataSchema);
