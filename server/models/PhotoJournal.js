const mongoose = require('mongoose');

const PhotoJournalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  photo: {
    filename: {
      type: String,
      required: true
    },
    originalName: String,
    mimeType: String,
    size: Number, // bytes
    url: String,
    thumbnailUrl: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    },
    address: String,
    accuracy: Number // GPS accuracy in meters
  },
  airQualityData: {
    outdoor: {
      aqi: Number,
      pm25: Number,
      pm10: Number,
      no2: Number,
      o3: Number,
      co: Number,
      source: String,
      timestamp: Date
    },
    indoor: {
      aqi: Number,
      pm25: Number,
      pm10: Number,
      co2: Number,
      voc: Number,
      humidity: Number,
      temperature: Number,
      source: String,
      timestamp: Date
    }
  },
  weatherData: {
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    windDirection: Number,
    pressure: Number,
    visibility: Number,
    conditions: String, // sunny, cloudy, rainy, etc.
    timestamp: Date
  },
  observations: {
    visibility: {
      type: String,
      enum: ['excellent', 'good', 'moderate', 'poor', 'very_poor']
    },
    smokePlume: Boolean,
    dustVisible: Boolean,
    haze: Boolean,
    smogVisible: Boolean,
    cloudCover: {
      type: String,
      enum: ['clear', 'partly_cloudy', 'mostly_cloudy', 'overcast']
    },
    precipitationPresent: Boolean
  },
  symptoms: {
    experienced: Boolean,
    types: [{
      type: String,
      enum: ['cough', 'eye_irritation', 'throat_irritation', 'headache', 'shortness_of_breath', 'fatigue', 'nausea', 'other']
    }],
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    notes: String
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  likes: [{
    userId: String,
    timestamp: { type: Date, default: Date.now }
  }],
  comments: [{
    userId: String,
    username: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  metadata: {
    deviceInfo: {
      make: String,
      model: String,
      os: String
    },
    exifData: {
      captureTime: Date,
      iso: Number,
      fNumber: Number,
      exposureTime: String,
      focalLength: Number
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
PhotoJournalSchema.index({ userId: 1, createdAt: -1 });
PhotoJournalSchema.index({ location: '2dsphere' });
PhotoJournalSchema.index({ tags: 1 });
PhotoJournalSchema.index({ isPublic: 1, createdAt: -1 });
PhotoJournalSchema.index({ 'airQualityData.outdoor.aqi': 1 });

// Text index for searching descriptions and tags
PhotoJournalSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// TTL index to automatically remove old entries after 5 years (optional)
// PhotoJournalSchema.index({ createdAt: 1 }, { expireAfterSeconds: 157680000 });

module.exports = mongoose.model('PhotoJournal', PhotoJournalSchema);
