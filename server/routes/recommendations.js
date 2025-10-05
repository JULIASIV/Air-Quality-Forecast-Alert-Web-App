const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const DataCollectorService = require('../services/DataCollectorService');

// Get personalized recommendations for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { lat, lon } = req.query;

    // Get user profile
    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get current air quality data
    const dataCollector = new DataCollectorService();
    const airQualityData = await dataCollector.getLatestData(
      lat && lon ? `${lat},${lon}` : `${userProfile.location.coordinates[1]},${userProfile.location.coordinates[0]}`
    );

    // Generate personalized recommendations
    const recommendations = generatePersonalizedRecommendations(userProfile, airQualityData);

    res.json({
      userId,
      userProfile: {
        healthConditions: userProfile.healthConditions,
        sensitivityLevel: userProfile.sensitivityLevel,
        activityLevel: userProfile.activityLevel,
        age: userProfile.age
      },
      currentAirQuality: airQualityData,
      recommendations,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations API Error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Create or update user profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    const userProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { ...profileData, userId },
      { new: true, upsert: true }
    );

    res.json({
      message: 'User profile updated successfully',
      profile: userProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userProfile = await UserProfile.findOne({ userId });

    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json(userProfile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get activity-specific recommendations
router.get('/:userId/activity/:activityType', async (req, res) => {
  try {
    const { userId, activityType } = req.params;
    const { lat, lon, duration } = req.query;

    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const dataCollector = new DataCollectorService();
    const airQualityData = await dataCollector.getLatestData(
      lat && lon ? `${lat},${lon}` : `${userProfile.location.coordinates[1]},${userProfile.location.coordinates[0]}`
    );

    const activityRecommendations = generateActivityRecommendations(
      userProfile,
      airQualityData,
      activityType,
      duration
    );

    res.json({
      userId,
      activityType,
      duration: duration || 60, // default 60 minutes
      currentAirQuality: airQualityData,
      recommendations: activityRecommendations,
      riskLevel: calculateRiskLevel(userProfile, airQualityData, activityType),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Activity recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate activity recommendations' });
  }
});

// Helper functions
function generatePersonalizedRecommendations(userProfile, airQualityData) {
  const recommendations = {
    general: [],
    health: [],
    activity: [],
    protection: [],
    urgent: []
  };

  const aqi = airQualityData?.aqi || 0;
  const pm25 = airQualityData?.pollutants?.pm25 || 0;
  const { healthConditions, sensitivityLevel, age, activityLevel } = userProfile;

  // Age-based recommendations
  if (age >= 65 || age <= 12) {
    recommendations.health.push('You are in a sensitive age group - take extra precautions');
    if (aqi > 100) {
      recommendations.urgent.push('Consider staying indoors due to unhealthy air quality');
    }
  }

  // Health condition specific recommendations
  if (healthConditions.asthma || healthConditions.copd) {
    recommendations.health.push('Keep rescue inhalers easily accessible');
    if (aqi > 75) {
      recommendations.urgent.push('Consider limiting outdoor exposure due to respiratory conditions');
    }
    if (pm25 > 35) {
      recommendations.protection.push('Use N95 or P100 masks when going outside');
    }
  }

  if (healthConditions.heartDisease) {
    recommendations.health.push('Monitor heart rate and avoid strenuous outdoor activities');
    if (aqi > 100) {
      recommendations.urgent.push('Avoid outdoor exercise - consider indoor alternatives');
    }
  }

  if (healthConditions.allergies) {
    recommendations.health.push('Check pollen forecasts in addition to air quality');
    recommendations.protection.push('Consider air purifiers indoors');
  }

  if (healthConditions.pregnancy) {
    recommendations.health.push('Pregnant individuals should be extra cautious about air quality');
    if (aqi > 85) {
      recommendations.urgent.push('Consider limiting outdoor exposure');
    }
  }

  // Sensitivity level adjustments
  const sensitivityMultiplier = {
    'low': 1.2,
    'moderate': 1.0,
    'high': 0.8,
    'very_high': 0.6
  }[sensitivityLevel];

  const adjustedThreshold = 100 * sensitivityMultiplier;

  if (aqi > adjustedThreshold) {
    recommendations.urgent.push(`Air quality exceeds your personal sensitivity threshold`);
  }

  // Activity level recommendations
  if (activityLevel === 'very_active' || activityLevel === 'active') {
    if (aqi > 50) {
      recommendations.activity.push('Consider indoor exercise alternatives');
    }
    recommendations.activity.push('Plan outdoor activities for early morning when air is typically cleaner');
  }

  // General AQI-based recommendations
  if (aqi > 150) {
    recommendations.urgent.push('Air quality is unhealthy - everyone should avoid outdoor activities');
    recommendations.protection.push('Wear masks when going outside');
  } else if (aqi > 100) {
    recommendations.general.push('Air quality is unhealthy for sensitive groups');
    recommendations.activity.push('Sensitive individuals should limit outdoor activities');
  } else if (aqi > 50) {
    recommendations.general.push('Air quality is moderate - some people may be sensitive');
  } else {
    recommendations.general.push('Air quality is good - normal outdoor activities are safe');
  }

  // Time-based recommendations
  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 10) {
    recommendations.general.push('Morning hours typically have better air quality');
  } else if (hour >= 16 && hour <= 19) {
    recommendations.general.push('Evening rush hour may worsen air quality');
  }

  return recommendations;
}

function generateActivityRecommendations(userProfile, airQualityData, activityType, duration) {
  const recommendations = [];
  const aqi = airQualityData?.aqi || 0;
  const durationMinutes = parseInt(duration) || 60;
  
  const riskLevel = calculateRiskLevel(userProfile, airQualityData, activityType);
  
  const activityConfig = {
    'outdoor_exercise': {
      baseThreshold: 75,
      highRiskThreshold: 100,
      indoorAlternative: 'gym workout or home exercise'
    },
    'walking': {
      baseThreshold: 100,
      highRiskThreshold: 125,
      indoorAlternative: 'mall walking or indoor track'
    },
    'cycling': {
      baseThreshold: 85,
      highRiskThreshold: 110,
      indoorAlternative: 'stationary bike or indoor cycling'
    },
    'jogging': {
      baseThreshold: 75,
      highRiskThreshold: 100,
      indoorAlternative: 'treadmill running'
    },
    'outdoor_work': {
      baseThreshold: 125,
      highRiskThreshold: 150,
      indoorAlternative: 'postpone non-essential outdoor work'
    }
  };

  const config = activityConfig[activityType] || activityConfig['walking'];
  
  // Adjust thresholds based on user sensitivity
  const sensitivityMultiplier = {
    'low': 1.1,
    'moderate': 1.0,
    'high': 0.9,
    'very_high': 0.8
  }[userProfile.sensitivityLevel];

  const adjustedBase = config.baseThreshold * sensitivityMultiplier;
  const adjustedHigh = config.highRiskThreshold * sensitivityMultiplier;

  if (aqi <= adjustedBase) {
    recommendations.push(`${activityType.replace('_', ' ')} is safe at current air quality levels`);
  } else if (aqi <= adjustedHigh) {
    recommendations.push(`Consider shortening ${activityType.replace('_', ' ')} duration`);
    if (durationMinutes > 60) {
      recommendations.push('Limit activity to less than 60 minutes');
    }
    recommendations.push('Take breaks in clean air environments');
  } else {
    recommendations.push(`Avoid ${activityType.replace('_', ' ')} - air quality is unhealthy`);
    recommendations.push(`Consider ${config.indoorAlternative} instead`);
  }

  // Duration-specific recommendations
  if (durationMinutes > 120 && aqi > 75) {
    recommendations.push('Long duration activities increase exposure risk');
  }

  return recommendations;
}

function calculateRiskLevel(userProfile, airQualityData, activityType) {
  const aqi = airQualityData?.aqi || 0;
  const { healthConditions, sensitivityLevel, age } = userProfile;
  
  let riskScore = 0;
  
  // Base risk from AQI
  if (aqi > 150) riskScore += 4;
  else if (aqi > 100) riskScore += 3;
  else if (aqi > 50) riskScore += 2;
  else riskScore += 1;
  
  // Health conditions
  if (healthConditions.asthma || healthConditions.copd) riskScore += 2;
  if (healthConditions.heartDisease) riskScore += 2;
  if (healthConditions.pregnancy) riskScore += 1;
  
  // Age factors
  if (age >= 65 || age <= 12) riskScore += 1;
  
  // Sensitivity level
  const sensitivityPoints = {
    'low': 0,
    'moderate': 0,
    'high': 1,
    'very_high': 2
  };
  riskScore += sensitivityPoints[sensitivityLevel] || 0;
  
  // Activity type risk
  const activityRisk = {
    'outdoor_exercise': 2,
    'jogging': 2,
    'cycling': 2,
    'walking': 1,
    'outdoor_work': 1
  };
  riskScore += activityRisk[activityType] || 1;
  
  // Convert score to risk level
  if (riskScore >= 8) return 'very_high';
  if (riskScore >= 6) return 'high';
  if (riskScore >= 4) return 'moderate';
  return 'low';
}

module.exports = router;
