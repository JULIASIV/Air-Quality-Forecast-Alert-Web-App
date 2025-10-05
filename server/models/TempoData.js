const mongoose = require('mongoose');

const tempoDataSchema = new mongoose.Schema({
  parameter: {
    type: String,
    required: true,
    enum: ['no2', 'hcho', 'aerosol', 'pm', 'o3'],
    index: true
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
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  value: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return v >= 0; // Air quality values should be non-negative
      },
      message: 'Air quality value must be non-negative'
    }
  },
  unit: {
    type: String,
    required: true,
    enum: ['µg/m³', 'mg/m³', 'ppb', 'ppm', 'index']
  },
  quality_flag: {
    type: String,
    required: true,
    enum: ['good', 'uncertain', 'poor', 'invalid'],
    default: 'good'
  },
  metadata: {
    satellite: {
      type: String,
      default: 'TEMPO'
    },
    product: String,
    version: String,
    processing_level: String,
    retrieval_algorithm: String,
    cloud_fraction: Number,
    surface_reflectance: Number,
    solar_zenith_angle: Number,
    viewing_zenith_angle: Number
  },
  data_source: {
    type: String,
    default: 'NASA TEMPO',
    index: true
  }
}, {
  timestamps: true,
  collection: 'tempo_data'
});

// Compound indexes for efficient queries
tempoDataSchema.index({ latitude: 1, longitude: 1, timestamp: -1 });
tempoDataSchema.index({ parameter: 1, timestamp: -1 });
tempoDataSchema.index({ timestamp: -1, quality_flag: 1 });

// Static methods for data retrieval
tempoDataSchema.statics.findByLocation = function(lat, lon, radius = 0.1) {
  return this.find({
    latitude: { $gte: lat - radius, $lte: lat + radius },
    longitude: { $gte: lon - radius, $lte: lon + radius }
  }).sort({ timestamp: -1 });
};

tempoDataSchema.statics.findRecentByParameter = function(parameter, hours = 24) {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    parameter,
    timestamp: { $gte: cutoffDate },
    quality_flag: { $in: ['good', 'uncertain'] }
  }).sort({ timestamp: -1 });
};

tempoDataSchema.statics.getAverageByLocation = async function(lat, lon, parameter, hours = 24) {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  const result = await this.aggregate([
    {
      $match: {
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
        parameter,
        timestamp: { $gte: cutoffDate },
        quality_flag: { $in: ['good', 'uncertain'] }
      }
    },
    {
      $group: {
        _id: null,
        averageValue: { $avg: '$value' },
        count: { $sum: 1 },
        maxValue: { $max: '$value' },
        minValue: { $min: '$value' },
        latestTimestamp: { $max: '$timestamp' }
      }
    }
  ]);
  
  return result[0] || null;
};

// Instance methods
tempoDataSchema.methods.isRecentData = function(hoursThreshold = 6) {
  const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
  return this.timestamp >= cutoff;
};

tempoDataSchema.methods.getHealthImpact = function() {
  const healthThresholds = {
    no2: { good: 40, moderate: 80, unhealthy: 180, hazardous: 400 },
    pm: { good: 12, moderate: 35.5, unhealthy: 55.5, hazardous: 150 },
    o3: { good: 70, moderate: 85, unhealthy: 105, hazardous: 200 },
    hcho: { good: 10, moderate: 20, unhealthy: 50, hazardous: 100 },
    aerosol: { good: 0.5, moderate: 1.0, unhealthy: 1.5, hazardous: 2.0 }
  };

  const thresholds = healthThresholds[this.parameter];
  if (!thresholds) return 'unknown';

  if (this.value <= thresholds.good) return 'good';
  if (this.value <= thresholds.moderate) return 'moderate';
  if (this.value <= thresholds.unhealthy) return 'unhealthy';
  return 'hazardous';
};

// Pre-save middleware to validate data consistency
tempoDataSchema.pre('save', function(next) {
  // Ensure timestamp is not in the future
  if (this.timestamp > new Date()) {
    this.timestamp = new Date();
  }
  
  // Set appropriate unit based on parameter if not provided
  if (!this.unit) {
    const defaultUnits = {
      'no2': 'µg/m³',
      'hcho': 'µg/m³',
      'aerosol': 'index',
      'pm': 'µg/m³',
      'o3': 'µg/m³'
    };
    this.unit = defaultUnits[this.parameter] || 'µg/m³';
  }
  
  next();
});

module.exports = mongoose.model('TempoData', tempoDataSchema);
