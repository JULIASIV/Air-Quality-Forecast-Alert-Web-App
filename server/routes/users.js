const express = require('express');
const router = express.Router();

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock user data
    const user = {
      id: userId,
      email: 'user@example.com',
      name: 'John Doe',
      preferences: {
        units: 'metric',
        notifications: true,
        alertThresholds: {
          aqi: 100,
          pm25: 25,
          pm10: 50
        }
      },
      locations: ['New York', 'Los Angeles'],
      created: new Date('2024-01-01').toISOString(),
      lastActive: new Date().toISOString()
    };

    res.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Update user preferences
router.put('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;
    
    // Mock update response
    const updatedPreferences = {
      userId,
      preferences,
      updated: new Date().toISOString()
    };

    res.json({
      message: 'Preferences updated successfully',
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Add location to user's watchlist
router.post('/locations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { location } = req.body;
    
    // Mock response
    res.json({
      message: 'Location added successfully',
      userId,
      location,
      added: new Date().toISOString()
    });
  } catch (error) {
    console.error('Location add error:', error);
    res.status(500).json({ error: 'Failed to add location' });
  }
});

module.exports = router;
