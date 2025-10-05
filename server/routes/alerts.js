const express = require('express');
const router = express.Router();

// Get active alerts for location
router.get('/:location', async (req, res) => {
  try {
    const { location } = req.params;
    
    // Mock alerts data
    const alerts = [
      {
        id: '1',
        type: 'air_quality',
        severity: 'moderate',
        title: 'Moderate Air Quality Alert',
        message: 'Air quality is moderate. Consider reducing outdoor activities for sensitive individuals.',
        location: location,
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours from now
      }
    ];

    // Randomly add more alerts
    if (Math.random() > 0.5) {
      alerts.push({
        id: '2',
        type: 'weather',
        severity: 'low',
        title: 'High UV Index Warning',
        message: 'UV index is high today. Wear sunscreen and protective clothing.',
        location: location,
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
      });
    }

    res.json({
      location,
      alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Create new alert subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { location, email, alertTypes } = req.body;
    
    // Mock subscription response
    const subscription = {
      id: Date.now().toString(),
      location,
      email,
      alertTypes: alertTypes || ['air_quality', 'weather'],
      created: new Date().toISOString(),
      active: true
    };

    res.json({
      message: 'Alert subscription created successfully',
      subscription
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

module.exports = router;
