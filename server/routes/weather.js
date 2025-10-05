const express = require('express');
const router = express.Router();

// Get current weather data
router.get('/current/:location', async (req, res) => {
  try {
    const { location } = req.params;
    
    // Mock weather data
    const weatherData = {
      location: location,
      temperature: Math.floor(Math.random() * 35) + 10,
      humidity: Math.floor(Math.random() * 80) + 20,
      windSpeed: Math.floor(Math.random() * 20) + 2,
      windDirection: Math.floor(Math.random() * 360),
      pressure: Math.floor(Math.random() * 50) + 1000,
      visibility: Math.floor(Math.random() * 10) + 1,
      uvIndex: Math.floor(Math.random() * 10) + 1,
      condition: ['Clear', 'Cloudy', 'Partly Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
      timestamp: new Date().toISOString(),
      source: 'OpenWeatherMap'
    };

    res.json(weatherData);
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get weather forecast
router.get('/forecast/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { days = 5 } = req.query;
    
    // Mock forecast data
    const forecast = [];
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split('T')[0],
        maxTemp: Math.floor(Math.random() * 35) + 15,
        minTemp: Math.floor(Math.random() * 15) + 5,
        humidity: Math.floor(Math.random() * 80) + 20,
        windSpeed: Math.floor(Math.random() * 20) + 2,
        condition: ['Clear', 'Cloudy', 'Partly Cloudy', 'Rainy'][Math.floor(Math.random() * 4)]
      });
    }

    res.json({
      location,
      forecast,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Forecast fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

module.exports = router;
