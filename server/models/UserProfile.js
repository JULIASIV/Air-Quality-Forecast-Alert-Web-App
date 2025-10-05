const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  age: {
    type: Number,
    min: 1,
    max: 120
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
    address: String
  },
  healthConditions: {
    asthma: { type: Boolean, default: false },
    copd: { type: Boolean, default: false },
    heartDisease: { type: Boolean, default: false },
    diabetes: { type: Boolean, default: false },
    allergies: { type: Boolean, default: false },
    pregnancy: { type: Boolean, default: false },
    other: [String]
  },
  sensitivityLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'very_high'],
    default: 'moderate'
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: 'moderate'
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    thresholds: {
      aqi: { type: Number, default: 100 },
      pm25: { type: Number, default: 35 },
      pm10: { type: Number, default: 55 },
      no2: { type: Number, default: 40 },
      o3: { type: Number, default: 70 }
    }
  },
  preferences: {
    units: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    },
    language: {
      type: String,
      default: 'en'
    },
    displayDensity: {
      type: String,
      enum: ['compact', 'comfortable', 'spacious'],
      default: 'comfortable'
    }
  }
}, {
  timestamps: true
});

// Create indexes for better performance
UserProfileSchema.index({ userId: 1 });
UserProfileSchema.index({ email: 1 });
UserProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('UserProfile', UserProfileSchema);
