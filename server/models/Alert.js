const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    index: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  severity: {
    type: String,
    required: true,
    enum: ['moderate', 'high', 'critical'],
    index: true
  },
  aqi: {
    type: Number,
    required: true,
    min: 0,
    max: 500
  },
  dominant_pollutant: {
    type: String,
    enum: ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co', 'hcho', 'aerosol', 'unknown'],
    default: 'unknown'
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  health_impact: {
    type: String,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
    index: true
  },
  
  // Data sources that triggered the alert
  data_sources: [{
    type: {
      type: String,
      enum: ['tempo', 'ground_station', 'forecast', 'user_report']
    },
    source_id: String,
    value: Number,
    unit: String,
    confidence: Number
  }],
  
  // Notification tracking
  notifications_sent: {
    total_users: {
      type: Number,
      default: 0
    },
    email_sent: {
      type: Number,
      default: 0
    },
    push_sent: {
      type: Number,
      default: 0
    },
    sms_sent: {
      type: Number,
      default: 0
    },
    failed_notifications: {
      type: Number,
      default: 0
    }
  },
  
  // Weather conditions at the time of alert
  weather_context: {
    temperature: Number,
    humidity: Number,
    wind_speed: Number,
    wind_direction: Number,
    pressure: Number,
    weather_condition: String
  },
  
  // Forecast information
  forecast_data: {
    predicted_duration: Number, // hours
    peak_aqi_expected: Number,
    conditions_improving: Boolean,
    next_update: Date
  },
  
  // Administrative fields
  created_by: {
    type: String,
    default: 'system'
  },
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewed_by: String,
  review_notes: String,
  
  // Expiration and cleanup
  expires_at: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  collection: 'alerts'
});

// Compound indexes for efficient queries
alertSchema.index({ location: 1, severity: 1, timestamp: -1 });
alertSchema.index({ coordinates: '2dsphere' });
alertSchema.index({ timestamp: -1, status: 1 });
alertSchema.index({ status: 1, expires_at: 1 });

// Instance methods
alertSchema.methods.isActive = function() {
  return this.status === 'active' && new Date() < this.expires_at;
};

alertSchema.methods.getSeverityLevel = function() {
  const levels = {
    'moderate': 1,
    'high': 2,
    'critical': 3
  };
  return levels[this.severity] || 0;
};

alertSchema.methods.getHealthRecommendations = function() {
  const recommendations = {
    moderate: [
      "Sensitive groups should limit outdoor activities",
      "Consider postponing strenuous exercise outdoors",
      "Keep windows closed during peak pollution hours"
    ],
    high: [
      "Limit outdoor activities for everyone",
      "Avoid strenuous exercise outdoors",
      "Keep windows and doors closed",
      "Consider using air purifiers indoors",
      "Wear N95 masks when going outside"
    ],
    critical: [
      "Avoid all outdoor activities",
      "Stay indoors with windows and doors closed",
      "Use air purifiers if available",
      "Avoid cooking or activities that create additional indoor pollution",
      "Seek immediate medical attention if experiencing respiratory symptoms"
    ]
  };
  
  return recommendations[this.severity] || recommendations.moderate;
};

alertSchema.methods.getAffectedGroups = function() {
  switch (this.severity) {
    case 'moderate':
      return ['children', 'elderly', 'people_with_respiratory_conditions', 'people_with_heart_disease'];
    case 'high':
      return ['everyone', 'especially_sensitive_groups'];
    case 'critical':
      return ['everyone'];
    default:
      return ['sensitive_groups'];
  }
};

alertSchema.methods.estimateAffectedPopulation = function(populationDensity = 1000) {
  // Rough estimation based on alert radius (assuming 50km radius for major alerts)
  const radiusKm = 50;
  const areaKm2 = Math.PI * radiusKm * radiusKm;
  return Math.round(areaKm2 * populationDensity);
};

// Static methods
alertSchema.statics.getActiveAlertsForLocation = function(coordinates, radiusKm = 50) {
  return this.find({
    status: 'active',
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: radiusKm * 1000 // Convert to meters
      }
    }
  }).sort({ severity: -1, timestamp: -1 });
};

alertSchema.statics.getAlertStatistics = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          severity: '$severity',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          }
        },
        count: { $sum: 1 },
        avgAQI: { $avg: '$aqi' },
        maxAQI: { $max: '$aqi' },
        locations: { $addToSet: '$location' },
        pollutants: { $addToSet: '$dominant_pollutant' }
      }
    },
    {
      $group: {
        _id: '$_id.severity',
        totalAlerts: { $sum: '$count' },
        avgDailyAlerts: { $avg: '$count' },
        avgAQI: { $avg: '$avgAQI' },
        maxAQI: { $max: '$maxAQI' },
        uniqueLocations: { $addToSet: '$locations' },
        commonPollutants: { $addToSet: '$pollutants' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  return stats;
};

alertSchema.statics.findNearbyAlerts = function(lat, lon, radiusKm = 100, hoursBack = 24) {
  const timeThreshold = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  
  return this.find({
    timestamp: { $gte: timeThreshold },
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        $maxDistance: radiusKm * 1000
      }
    }
  }).sort({ timestamp: -1 });
};

alertSchema.statics.createAlert = async function(alertData) {
  // Set expiration date (24 hours from creation)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  const alert = new this({
    ...alertData,
    expires_at: expiresAt
  });
  
  await alert.save();
  return alert;
};

alertSchema.statics.expireOldAlerts = async function() {
  const result = await this.updateMany(
    {
      status: 'active',
      expires_at: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  
  return result.modifiedCount;
};

// Pre-save middleware
alertSchema.pre('save', function(next) {
  // Set expires_at if not provided
  if (!this.expires_at) {
    this.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  
  // Validate AQI ranges
  if (this.severity === 'moderate' && this.aqi > 150) {
    this.severity = 'high';
  } else if (this.severity === 'high' && this.aqi > 200) {
    this.severity = 'critical';
  }
  
  next();
});

// Post-save middleware for notifications
alertSchema.post('save', async function(doc) {
  console.log(`Alert saved: ${doc.location} - ${doc.severity} (AQI: ${doc.aqi})`);
});

module.exports = mongoose.model('Alert', alertSchema);
