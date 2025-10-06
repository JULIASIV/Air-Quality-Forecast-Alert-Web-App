const express = require('express');
const router = express.Router();
const IndoorAirQuality = require('../models/IndoorAirQuality');
const DataCollectorService = require('../services/DataCollectorService');

// Get indoor vs outdoor comparison for a specific location
router.get('/indoor-outdoor/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { lat, lon, hours = 24 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const coordinates = [parseFloat(lon), parseFloat(lat)];
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get recent indoor measurements
    const indoorData = await IndoorAirQuality.find({
      userId: userId,
      'location.coordinates': {
        $near: {
          $geometry: { type: 'Point', coordinates },
          $maxDistance: 1000 // within 1km
        }
      },
      timestamp: { $gte: hoursAgo }
    }).sort({ timestamp: -1 }).limit(100);

    // Get outdoor data from NASA TEMPO and ground stations
    const dataCollector = new DataCollectorService();
    const outdoorData = await dataCollector.getLatestData(`${lat},${lon}`);

    // Generate comparison metrics
    const comparison = generateComparison(indoorData, outdoorData);

    res.json({
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      timeRange: `${hours} hours`,
      indoor: {
        data: indoorData,
        averages: calculateAverages(indoorData),
        trends: calculateTrends(indoorData)
      },
      outdoor: {
        data: outdoorData,
        source: 'NASA TEMPO + Ground Stations'
      },
      comparison,
      recommendations: generateRecommendations(comparison),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Comparison API Error:', error);
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

// Submit indoor air quality measurement
router.post('/indoor-measurement', async (req, res) => {
  try {
    const {
      userId,
      deviceId,
      location,
      measurements,
      conditions
    } = req.body;

    // Get corresponding outdoor data
    const dataCollector = new DataCollectorService();
    const outdoorRef = await dataCollector.getLatestData(
      `${location.coordinates[1]},${location.coordinates[0]}`
    );

    const indoorMeasurement = new IndoorAirQuality({
      userId,
      deviceId,
      location,
      measurements,
      conditions,
      outdoorReference: {
        aqi: outdoorRef?.aqi,
        pm25: outdoorRef?.pollutants?.pm25,
        pm10: outdoorRef?.pollutants?.pm10,
        source: outdoorRef?.source || 'api',
        distance: 0
      }
    });

    await indoorMeasurement.save();

    res.status(201).json({
      message: 'Indoor measurement recorded successfully',
      data: indoorMeasurement,
      outdoorReference: outdoorRef
    });
  } catch (error) {
    console.error('Indoor measurement error:', error);
    res.status(500).json({ error: 'Failed to record indoor measurement' });
  }
});

// Get historical indoor measurements for a user
router.get('/indoor-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7, deviceId, room } = req.query;

    const query = { userId };
    if (deviceId) query.deviceId = deviceId;
    if (room) query['location.room'] = room;

    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    query.timestamp = { $gte: daysAgo };

    const measurements = await IndoorAirQuality.find(query)
      .sort({ timestamp: -1 })
      .limit(1000);

    const aggregatedData = aggregateByTimeInterval(measurements, 'hour');

    res.json({
      userId,
      period: `${days} days`,
      totalMeasurements: measurements.length,
      data: measurements,
      aggregated: aggregatedData,
      devices: [...new Set(measurements.map(m => m.deviceId))],
      rooms: [...new Set(measurements.map(m => m.location.room).filter(Boolean))]
    });
  } catch (error) {
    console.error('Indoor history error:', error);
    res.status(500).json({ error: 'Failed to fetch indoor history' });
  }
});

// Helper functions
function generateComparison(indoorData, outdoorData) {
  if (!indoorData.length || !outdoorData) {
    return { status: 'insufficient_data' };
  }

  const latestIndoor = indoorData[0];
  const indoorAQI = latestIndoor.measurements.aqi;
  const outdoorAQI = outdoorData.aqi;

  return {
    aqiDifference: indoorAQI - outdoorAQI,
    indoorBetter: indoorAQI < outdoorAQI,
    ratio: indoorAQI / outdoorAQI,
    category: getComparisonCategory(indoorAQI, outdoorAQI),
    pollutantComparison: {
      pm25: {
        indoor: latestIndoor.measurements.pm25?.value,
        outdoor: outdoorData.pollutants?.pm25,
        difference: latestIndoor.measurements.pm25?.value - outdoorData.pollutants?.pm25
      },
      pm10: {
        indoor: latestIndoor.measurements.pm10?.value,
        outdoor: outdoorData.pollutants?.pm10,
        difference: latestIndoor.measurements.pm10?.value - outdoorData.pollutants?.pm10
      }
    }
  };
}

function calculateAverages(data) {
  if (!data.length) return {};
  
  const sum = data.reduce((acc, item) => {
    acc.aqi += item.measurements.aqi || 0;
    acc.pm25 += item.measurements.pm25?.value || 0;
    acc.pm10 += item.measurements.pm10?.value || 0;
    acc.co2 += item.measurements.co2?.value || 0;
    return acc;
  }, { aqi: 0, pm25: 0, pm10: 0, co2: 0 });

  return {
    aqi: Math.round(sum.aqi / data.length),
    pm25: Math.round(sum.pm25 / data.length),
    pm10: Math.round(sum.pm10 / data.length),
    co2: Math.round(sum.co2 / data.length)
  };
}

function calculateTrends(data) {
  if (data.length < 2) return { status: 'insufficient_data' };
  
  const recent = data.slice(0, Math.floor(data.length / 2));
  const older = data.slice(Math.floor(data.length / 2));
  
  const recentAvg = calculateAverages(recent);
  const olderAvg = calculateAverages(older);
  
  return {
    aqi: recentAvg.aqi > olderAvg.aqi ? 'increasing' : 'decreasing',
    pm25: recentAvg.pm25 > olderAvg.pm25 ? 'increasing' : 'decreasing'
  };
}

function getComparisonCategory(indoorAQI, outdoorAQI) {
  const difference = Math.abs(indoorAQI - outdoorAQI);
  if (difference < 10) return 'similar';
  if (indoorAQI > outdoorAQI + 20) return 'indoor_much_worse';
  if (indoorAQI > outdoorAQI) return 'indoor_worse';
  if (outdoorAQI > indoorAQI + 20) return 'outdoor_much_worse';
  return 'outdoor_worse';
}

function generateRecommendations(comparison) {
  const recommendations = [];
  
  if (comparison.status === 'insufficient_data') {
    return ['Install indoor air quality monitors for better insights'];
  }
  
  if (comparison.indoorBetter) {
    recommendations.push('Indoor air quality is better - consider keeping windows closed');
    recommendations.push('Use air purifiers to maintain good indoor quality');
  } else {
    recommendations.push('Outdoor air is cleaner - consider ventilation');
    recommendations.push('Open windows during low outdoor pollution periods');
  }
  
  if (comparison.ratio > 1.5) {
    recommendations.push('Indoor pollution is significantly higher - check sources');
    recommendations.push('Consider professional indoor air quality assessment');
  }
  
  return recommendations;
}

function aggregateByTimeInterval(data, interval) {
  // Implementation for aggregating data by time intervals
  return data.reduce((acc, item) => {
    const timeKey = new Date(item.timestamp).toISOString().slice(0, interval === 'hour' ? 13 : 10);
    if (!acc[timeKey]) {
      acc[timeKey] = [];
    }
    acc[timeKey].push(item);
    return acc;
  }, {});
}

module.exports = router;
