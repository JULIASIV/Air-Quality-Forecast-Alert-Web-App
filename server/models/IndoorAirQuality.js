const mongoose = require('mongoose');

const IndoorAirQualitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    address: String,
    room: String, // bedroom, living room, kitchen, etc.
    floor: Number
  },
  measurements: {
    aqi: {
      type: Number,
      required: true,
      min: 0,
      max: 500
    },
    pm25: {
      value: Number,
      unit: { type: String, default: 'µg/m³' }
    },
    pm10: {
      value: Number,
      unit: { type: String, default: 'µg/m³' }
    },
    no2: {
      value: Number,
      unit: { type: String, default: 'µg/m³' }
    },
    o3: {
      value: Number,
      unit: { type: String, default: 'µg/m³' }
    },
    co: {
      value: Number,
      unit: { type: String, default: 'ppm' }
    },
    co2: {
      value: Number,
      unit: { type: String, default: 'ppm' }
    },
    voc: {
      value: Number,
      unit: { type: String, default: 'ppb' }
    },
    humidity: {
      value: Number,
      unit: { type: String, default: '%' }
    },
    temperature: {
      value: Number,
      unit: { type: String, default: '°C' }
    }
  },
  outdoorReference: {
    aqi: Number,
    pm25: Number,
    pm10: Number,
    source: String, // 'nasa_tempo', 'ground_station', 'api'
    distance: Number // distance to nearest outdoor measurement in meters
  },
  deviceInfo: {
    manufacturer: String,
    model: String,
    firmware: String,
    calibrationDate: Date,
    accuracy: {
      pm25: Number,
      pm10: Number,
      co2: Number
    }
  },
  conditions: {
    ventilationStatus: {
      type: String,
      enum: ['closed', 'natural', 'mechanical', 'mixed']
    },
    cookingActivity: Boolean,
    cleaningActivity: Boolean,
    occupancyCount: Number,
    petsPresent: Boolean,
    smokingActivity: Boolean
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
IndoorAirQualitySchema.index({ userId: 1, timestamp: -1 });
IndoorAirQualitySchema.index({ location: '2dsphere', timestamp: -1 });
IndoorAirQualitySchema.index({ deviceId: 1, timestamp: -1 });

// TTL index to automatically remove old data after 2 years
IndoorAirQualitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('IndoorAirQuality', IndoorAirQualitySchema);
