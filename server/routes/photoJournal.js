const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();
const PhotoJournal = require('../models/PhotoJournal');
const DataCollectorService = require('../services/DataCollectorService');
const axios = require('axios');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

async function ensureDirectories() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(thumbnailsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

ensureDirectories();

// Create new photo journal entry
router.post('/entry', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Photo file is required' });
    }

    const {
      userId,
      title,
      description,
      latitude,
      longitude,
      observations,
      symptoms,
      tags,
      isPublic
    } = req.body;

    if (!userId || !title || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}_${Math.random().toString(36).substring(2, 15)}.jpg`;
    const thumbnailFilename = `thumb_${filename}`;
    
    const filePath = path.join(uploadsDir, filename);
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
    
    // Process and save main image
    await sharp(req.file.buffer)
      .jpeg({ quality: 85 })
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .toFile(filePath);
    
    // Create thumbnail
    await sharp(req.file.buffer)
      .jpeg({ quality: 70 })
      .resize(400, 400, { fit: 'cover' })
      .toFile(thumbnailPath);

    // Get current air quality and weather data
    const dataCollector = new DataCollectorService();
    const [outdoorAirQuality, weatherData] = await Promise.all([
      dataCollector.getLatestData(`${latitude},${longitude}`),
      getWeatherData(latitude, longitude)
    ]);

    // Parse form data
    const parsedObservations = observations ? JSON.parse(observations) : {};
    const parsedSymptoms = symptoms ? JSON.parse(symptoms) : {};
    const parsedTags = tags ? JSON.parse(tags) : [];

    // Create photo journal entry
    const photoJournal = new PhotoJournal({
      userId,
      title,
      description,
      photo: {
        filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${filename}`,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`
      },
      location: {
        type: 'Point',
        coordinates,
        accuracy: req.body.accuracy ? parseFloat(req.body.accuracy) : null
      },
      airQualityData: {
        outdoor: {
          aqi: outdoorAirQuality?.aqi,
          pm25: outdoorAirQuality?.pollutants?.pm25,
          pm10: outdoorAirQuality?.pollutants?.pm10,
          no2: outdoorAirQuality?.pollutants?.no2,
          o3: outdoorAirQuality?.pollutants?.o3,
          co: outdoorAirQuality?.pollutants?.co,
          source: outdoorAirQuality?.source || 'api',
          timestamp: new Date()
        }
      },
      weatherData: {
        ...weatherData,
        timestamp: new Date()
      },
      observations: parsedObservations,
      symptoms: parsedSymptoms,
      tags: parsedTags,
      isPublic: isPublic === 'true'
    });

    await photoJournal.save();

    res.status(201).json({
      message: 'Photo journal entry created successfully',
      entry: photoJournal
    });

  } catch (error) {
    console.error('Photo journal creation error:', error);
    res.status(500).json({ error: 'Failed to create photo journal entry' });
  }
});

// Get user's photo journal entries
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, tags, startDate, endDate } = req.query;

    const query = { userId };
    
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [entries, totalCount] = await Promise.all([
      PhotoJournal.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PhotoJournal.countDocuments(query)
    ]);

    res.json({
      entries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalEntries: totalCount,
        hasNextPage: skip + entries.length < totalCount,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Photo journal fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch photo journal entries' });
  }
});

// Get public photo journal entries (community feed)
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20, tags, location, radius = 10000 } = req.query;

    const query = { isPublic: true };
    
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    
    // Location-based filtering
    if (location) {
      const [lat, lon] = location.split(',').map(parseFloat);
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lon, lat] },
          $maxDistance: parseInt(radius)
        }
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const entries = await PhotoJournal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-userId') // Don't expose user IDs in public feed
      .lean();

    res.json({
      entries,
      pagination: {
        currentPage: parseInt(page),
        hasMore: entries.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Public feed fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch public entries' });
  }
});

// Get specific photo journal entry
router.get('/entry/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    const entry = await PhotoJournal.findById(entryId);

    if (!entry) {
      return res.status(404).json({ error: 'Photo journal entry not found' });
    }

    res.json(entry);

  } catch (error) {
    console.error('Entry fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

// Update photo journal entry
router.put('/entry/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    const { userId, title, description, observations, symptoms, tags, isPublic } = req.body;

    const entry = await PhotoJournal.findById(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Verify ownership
    if (entry.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this entry' });
    }

    // Update fields
    if (title) entry.title = title;
    if (description !== undefined) entry.description = description;
    if (observations) entry.observations = JSON.parse(observations);
    if (symptoms) entry.symptoms = JSON.parse(symptoms);
    if (tags) entry.tags = JSON.parse(tags);
    if (isPublic !== undefined) entry.isPublic = isPublic === 'true';

    await entry.save();

    res.json({
      message: 'Entry updated successfully',
      entry
    });

  } catch (error) {
    console.error('Entry update error:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// Delete photo journal entry
router.delete('/entry/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    const { userId } = req.body;

    const entry = await PhotoJournal.findById(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Verify ownership
    if (entry.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this entry' });
    }

    // Delete associated files
    try {
      await fs.unlink(path.join(uploadsDir, entry.photo.filename));
      await fs.unlink(path.join(thumbnailsDir, `thumb_${entry.photo.filename}`));
    } catch (fileError) {
      console.warn('Could not delete image files:', fileError);
    }

    await PhotoJournal.findByIdAndDelete(entryId);

    res.json({ message: 'Entry deleted successfully' });

  } catch (error) {
    console.error('Entry deletion error:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// Like/unlike photo journal entry
router.post('/entry/:entryId/like', async (req, res) => {
  try {
    const { entryId } = req.params;
    const { userId } = req.body;

    const entry = await PhotoJournal.findById(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const existingLike = entry.likes.find(like => like.userId === userId);
    
    if (existingLike) {
      // Unlike
      entry.likes = entry.likes.filter(like => like.userId !== userId);
    } else {
      // Like
      entry.likes.push({ userId, timestamp: new Date() });
    }

    await entry.save();

    res.json({
      message: existingLike ? 'Entry unliked' : 'Entry liked',
      likesCount: entry.likes.length,
      isLiked: !existingLike
    });

  } catch (error) {
    console.error('Like/unlike error:', error);
    res.status(500).json({ error: 'Failed to like/unlike entry' });
  }
});

// Add comment to photo journal entry
router.post('/entry/:entryId/comment', async (req, res) => {
  try {
    const { entryId } = req.params;
    const { userId, username, text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const entry = await PhotoJournal.findById(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    entry.comments.push({
      userId,
      username: username || 'Anonymous',
      text: text.trim(),
      timestamp: new Date()
    });

    await entry.save();

    res.json({
      message: 'Comment added successfully',
      comment: entry.comments[entry.comments.length - 1]
    });

  } catch (error) {
    console.error('Comment addition error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get analytics for user's photo journal
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const pipeline = [
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          averageAQI: { $avg: '$airQualityData.outdoor.aqi' },
          symptomEntries: {
            $sum: { $cond: [{ $eq: ['$symptoms.experienced', true] }, 1, 0] }
          },
          locations: { $addToSet: '$location.coordinates' },
          mostUsedTags: { $push: '$tags' }
        }
      }
    ];

    const [analytics] = await PhotoJournal.aggregate(pipeline);
    
    if (!analytics) {
      return res.json({
        totalEntries: 0,
        averageAQI: null,
        symptomEntries: 0,
        uniqueLocations: 0,
        mostUsedTags: []
      });
    }

    // Process most used tags
    const tagCounts = {};
    analytics.mostUsedTags.flat().forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    const sortedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      totalEntries: analytics.totalEntries,
      averageAQI: Math.round(analytics.averageAQI || 0),
      symptomEntries: analytics.symptomEntries,
      uniqueLocations: analytics.locations.length,
      mostUsedTags: sortedTags,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Helper function to get weather data
async function getWeatherData(lat, lon) {
  try {
    // In production, use a real weather API like OpenWeatherMap
    // For now, return mock data
    return {
      temperature: Math.round(Math.random() * 30 + 5), // 5-35°C
      humidity: Math.round(Math.random() * 50 + 30), // 30-80%
      windSpeed: Math.round(Math.random() * 20 + 1), // 1-20 m/s
      windDirection: Math.round(Math.random() * 360),
      pressure: Math.round(Math.random() * 100 + 1000), // 1000-1100 hPa
      visibility: Math.round(Math.random() * 10 + 1), // 1-10 km
      conditions: ['sunny', 'cloudy', 'partly_cloudy', 'rainy', 'foggy'][
        Math.floor(Math.random() * 5)
      ]
    };
  } catch (error) {
    console.error('Weather data fetch error:', error);
    return null;
  }
}

// Serve uploaded images
router.get('/image/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);
  res.sendFile(filePath);
});

// Serve thumbnail images
router.get('/thumbnail/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(thumbnailsDir, filename);
  res.sendFile(filePath);
});

module.exports = router;
