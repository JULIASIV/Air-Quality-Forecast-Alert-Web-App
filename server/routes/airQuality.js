const express = require('express');
const router = express.Router();

// Get current air quality data
router.get('/current/:location', async (req, res) => {
  try {
    const { location } = req.params;
    // Mock data for now
    const airQualityData = {
      location: location,
      aqi: Math.floor(Math.random() * 300) + 1,
      pollutants: {
        pm25: Math.floor(Math.random() * 50) + 5,
        pm10: Math.floor(Math.random() * 100) + 10,
        no2: Math.floor(Math.random() * 80) + 10,
        o3: Math.floor(Math.random() * 120) + 20,
        co: Math.floor(Math.random() * 10) + 1
      },
      timestamp: new Date().toISOString(),
      source: 'NASA TEMPO + Ground Stations'
    };

    res.json(airQualityData);
  } catch (error) {
    console.error('Air quality fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch air quality data' });
  }
});

// Get historical air quality data
router.get('/historical/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { days = 7 } = req.query;
    
    // Mock historical data
    const historicalData = [];
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      historicalData.push({
        date: date.toISOString().split('T')[0],
        aqi: Math.floor(Math.random() * 300) + 1,
        pm25: Math.floor(Math.random() * 50) + 5,
        pm10: Math.floor(Math.random() * 100) + 10
      });
    }

    res.json({
      location,
      data: historicalData.reverse(),
      period: `${days} days`
    });
  } catch (error) {
    console.error('Historical data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

module.exports = router;
