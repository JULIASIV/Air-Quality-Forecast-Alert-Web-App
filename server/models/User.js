const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
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
  radius: {
    type: Number,
    default: 50 // km
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  phone_number: {
    type: String,
    validate: {
      validator: function(phone) {
        return !phone || /^\+?[\d\s\-\(\)]+$/.test(phone);
      },
      message: 'Please provide a valid phone number'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  verification_token: String,
  password_reset_token: String,
  password_reset_expires: Date,
  
  // Location and alert preferences
  alert_preferences: {
    enabled: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    severity_threshold: {
      type: String,
      enum: ['moderate', 'unhealthy_sensitive', 'unhealthy', 'very_unhealthy'],
      default: 'unhealthy_sensitive'
    },
    locations: [locationSchema],
    quiet_hours: {
      enabled: {
        type: Boolean,
        default: false
      },
      start: {
        type: String, // Format: "22:00"
        default: "22:00"
      },
      end: {
        type: String, // Format: "08:00"
        default: "08:00"
      }
    }
  },
  
  // Health profile for personalized recommendations
  health_profile: {
    sensitive_group: {
      type: Boolean,
      default: false
    },
    conditions: [{
      type: String,
      enum: ['asthma', 'copd', 'heart_disease', 'diabetes', 'pregnancy', 'elderly', 'child']
    }],
    outdoor_activities: [{
      type: String,
      enum: ['running', 'cycling', 'walking', 'sports', 'gardening', 'none']
    }]
  },
  
  // Usage statistics
  last_login: Date,
  login_count: {
    type: Number,
    default: 0
  },
  api_requests_count: {
    type: Number,
    default: 0
  },
  
  // Device tokens for push notifications
  device_tokens: [{
    token: String,
    platform: {
      type: String,
      enum: ['web', 'ios', 'android']
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'alert_preferences.locations.coordinates': '2dsphere' });
userSchema.index({ verification_token: 1 });
userSchema.index({ password_reset_token: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.isInQuietHours = function() {
  if (!this.alert_preferences.quiet_hours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                     now.getMinutes().toString().padStart(2, '0');
  
  const start = this.alert_preferences.quiet_hours.start;
  const end = this.alert_preferences.quiet_hours.end;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }
  
  return currentTime >= start && currentTime <= end;
};

userSchema.methods.shouldReceiveAlert = function(alertSeverity) {
  if (!this.alert_preferences.enabled) return false;
  if (this.isInQuietHours() && alertSeverity !== 'critical') return false;
  
  const severityLevels = {
    'moderate': 1,
    'unhealthy_sensitive': 2,
    'unhealthy': 3,
    'very_unhealthy': 4,
    'critical': 5
  };
  
  const userThreshold = severityLevels[this.alert_preferences.severity_threshold];
  const alertLevel = severityLevels[alertSeverity];
  
  return alertLevel >= userThreshold;
};

userSchema.methods.getPersonalizedHealthAdvice = function(aqi, dominantPollutant) {
  const { sensitive_group, conditions, outdoor_activities } = this.health_profile;
  let advice = [];
  
  // Base advice based on AQI
  if (aqi <= 50) {
    advice.push("Air quality is good for outdoor activities.");
  } else if (aqi <= 100) {
    advice.push("Air quality is moderate. Most people can enjoy outdoor activities.");
  } else if (aqi <= 150) {
    advice.push("Air quality is unhealthy for sensitive groups.");
  } else if (aqi <= 200) {
    advice.push("Air quality is unhealthy. Everyone should limit outdoor activities.");
  } else {
    advice.push("Air quality is very unhealthy. Avoid outdoor activities.");
  }
  
  // Personalized advice based on health conditions
  if (sensitive_group || conditions.length > 0) {
    if (aqi > 100) {
      advice.push("Given your health conditions, consider staying indoors.");
    }
    
    if (conditions.includes('asthma') || conditions.includes('copd')) {
      advice.push("Keep rescue inhalers nearby and consider using a mask outdoors.");
    }
    
    if (conditions.includes('heart_disease')) {
      advice.push("Avoid strenuous activities and monitor symptoms closely.");
    }
    
    if (conditions.includes('pregnancy') || conditions.includes('child')) {
      advice.push("Take extra precautions to limit exposure to air pollution.");
    }
  }
  
  // Activity-specific advice
  if (outdoor_activities.includes('running') || outdoor_activities.includes('cycling')) {
    if (aqi > 100) {
      advice.push("Consider indoor alternatives for high-intensity exercise.");
    }
  }
  
  return advice;
};

userSchema.methods.toPublicJSON = function() {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.verification_token;
  delete userObj.password_reset_token;
  delete userObj.password_reset_expires;
  return userObj;
};

// Static methods
userSchema.statics.findByLocation = function(coordinates, radius = 50) {
  return this.find({
    'alert_preferences.enabled': true,
    'alert_preferences.locations.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates // [longitude, latitude]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    }
  });
};

userSchema.statics.getActiveUsersStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        verifiedUsers: {
          $sum: { $cond: [{ $eq: ["$is_verified", true] }, 1, 0] }
        },
        activeAlertsUsers: {
          $sum: { $cond: [{ $eq: ["$alert_preferences.enabled", true] }, 1, 0] }
        },
        avgLocationsPerUser: { 
          $avg: { $size: "$alert_preferences.locations" } 
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalUsers: 0,
    verifiedUsers: 0,
    activeAlertsUsers: 0,
    avgLocationsPerUser: 0
  };
};

// Pre-remove middleware to cleanup related data
userSchema.pre('remove', async function(next) {
  // Remove user's alerts, preferences, etc.
  // This would be implemented based on your cleanup requirements
  next();
});

module.exports = mongoose.model('User', userSchema);
