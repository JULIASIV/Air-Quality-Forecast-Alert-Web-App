const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Import models
const TempoData = require('../models/TempoData');
const GroundStationData = require('../models/GroundStationData');
const User = require('../models/User');
const Alert = require('../models/Alert');

class AlertService {
  constructor() {
    this.isMonitoring = false;
    this.emailTransporter = null;
    this.initializeEmailTransporter();
  }

  /**
   * Initialize email transporter for notifications
   */
  initializeEmailTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      console.log('✅ Email transporter initialized');
    } else {
      console.log('⚠️ Email configuration missing, email notifications disabled');
    }
  }

  /**
   * Start alert monitoring system
   */
  startAlertMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ Alert monitoring already running');
      return;
    }

    console.log('🚨 Starting air quality alert monitoring...');
    this.isMonitoring = true;

    // Check for alerts every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log('🔍 Checking for air quality alerts...');
      try {
        await this.checkForAlerts();
      } catch (error) {
        console.error('❌ Error checking for alerts:', error.message);
      }
    });

    console.log('✅ Alert monitoring scheduled successfully');
  }

  /**
   * Stop alert monitoring
   */
  stopAlertMonitoring() {
    this.isMonitoring = false;
    console.log('⏹️ Alert monitoring stopped');
  }

  /**
   * Check for air quality alerts across all monitored locations
   */
  async checkForAlerts() {
    try {
      const locations = [
        { lat: 40.7128, lon: -74.0060, name: 'New York, NY' },
        { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, CA' },
        { lat: 41.8781, lon: -87.6298, name: 'Chicago, IL' },
        { lat: 39.7392, lon: -104.9903, name: 'Denver, CO' },
        { lat: 38.9072, lon: -77.0369, name: 'Washington, DC' },
        { lat: 29.7604, lon: -95.3698, name: 'Houston, TX' }
      ];

      for (const location of locations) {
        await this.checkLocationAlerts(location);
      }

    } catch (error) {
      console.error('Error in alert checking process:', error);
    }
  }

  /**
   * Check alerts for a specific location
   */
  async checkLocationAlerts(location) {
    try {
      const { lat, lon, name } = location;
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get latest air quality data
      const latestTempo = await TempoData.findOne({
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
        timestamp: { $gte: oneHourAgo }
      }).sort({ timestamp: -1 });

      const latestGround = await GroundStationData.findOne({
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
        timestamp: { $gte: oneHourAgo },
        data_quality: { $in: ['valid', 'questionable'] }
      }).sort({ timestamp: -1 });

      // Calculate current AQI
      const currentAQI = await this.calculateLocationAQI(lat, lon);
      
      // Check for alert conditions
      const alertConditions = this.checkAlertConditions(currentAQI, latestTempo, latestGround);

      if (alertConditions.shouldAlert) {
        await this.createAndSendAlert({
          location: name,
          coordinates: { lat, lon },
          severity: alertConditions.severity,
          aqi: currentAQI,
          pollutant: alertConditions.dominantPollutant,
          message: alertConditions.message,
          health_impact: alertConditions.healthImpact,
          timestamp: now
        });
      }

    } catch (error) {
      console.error(`Error checking alerts for ${location.name}:`, error);
    }
  }

  /**
   * Calculate AQI for a location based on available data
   */
  async calculateLocationAQI(lat, lon) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Get recent ground station data (preferred for AQI calculation)
      const groundData = await GroundStationData.find({
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
        timestamp: { $gte: oneHourAgo },
        data_quality: { $in: ['valid', 'questionable'] }
      }).sort({ timestamp: -1 }).limit(10);

      if (groundData.length > 0) {
        // Use ground station data to calculate AQI
        let maxAQI = 0;
        let dominantPollutant = 'unknown';

        for (const data of groundData) {
          const aqi = data.calculateAQI();
          if (aqi > maxAQI) {
            maxAQI = aqi;
            dominantPollutant = data.parameter;
          }
        }

        return { aqi: maxAQI, dominant_pollutant: dominantPollutant, source: 'ground' };
      }

      // Fallback to TEMPO data if no ground data available
      const tempoData = await TempoData.find({
        latitude: { $gte: lat - 0.1, $lte: lat + 0.1 },
        longitude: { $gte: lon - 0.1, $lte: lon + 0.1 },
        timestamp: { $gte: oneHourAgo },
        quality_flag: { $in: ['good', 'uncertain'] }
      }).sort({ timestamp: -1 }).limit(5);

      if (tempoData.length > 0) {
        // Simplified AQI estimation from TEMPO data
        let maxAQI = 0;
        let dominantPollutant = 'unknown';

        for (const data of tempoData) {
          const estimatedAQI = this.estimateAQIFromTempo(data);
          if (estimatedAQI > maxAQI) {
            maxAQI = estimatedAQI;
            dominantPollutant = data.parameter;
          }
        }

        return { aqi: maxAQI, dominant_pollutant: dominantPollutant, source: 'tempo' };
      }

      return { aqi: 0, dominant_pollutant: 'unknown', source: 'none' };

    } catch (error) {
      console.error('Error calculating location AQI:', error);
      return { aqi: 0, dominant_pollutant: 'unknown', source: 'error' };
    }
  }

  /**
   * Estimate AQI from TEMPO satellite data
   */
  estimateAQIFromTempo(tempoData) {
    // Simplified conversion from concentration to AQI
    const { parameter, value } = tempoData;

    switch (parameter) {
      case 'no2':
        if (value <= 53) return (value / 53) * 50;
        if (value <= 100) return 50 + ((value - 53) / 47) * 50;
        if (value <= 360) return 100 + ((value - 100) / 260) * 50;
        return Math.min(200, 150 + ((value - 360) / 289) * 50);

      case 'pm':
        if (value <= 12) return (value / 12) * 50;
        if (value <= 35.4) return 50 + ((value - 12) / 23.4) * 50;
        if (value <= 55.4) return 100 + ((value - 35.4) / 20) * 50;
        return Math.min(200, 150 + ((value - 55.4) / 95) * 50);

      case 'o3':
        if (value <= 54) return (value / 54) * 50;
        if (value <= 70) return 50 + ((value - 54) / 16) * 50;
        if (value <= 85) return 100 + ((value - 70) / 15) * 50;
        return Math.min(200, 150 + ((value - 85) / 20) * 50);

      default:
        return 50; // Default moderate if unknown
    }
  }

  /**
   * Check if alert conditions are met
   */
  checkAlertConditions(aqiData, tempoData, groundData) {
    const { aqi, dominant_pollutant } = aqiData;
    const thresholds = {
      moderate: parseInt(process.env.AQI_MODERATE_THRESHOLD) || 51,
      unhealthy_sensitive: parseInt(process.env.AQI_UNHEALTHY_SENSITIVE_THRESHOLD) || 101,
      unhealthy: parseInt(process.env.AQI_UNHEALTHY_THRESHOLD) || 151,
      very_unhealthy: parseInt(process.env.AQI_VERY_UNHEALTHY_THRESHOLD) || 201
    };

    let shouldAlert = false;
    let severity = 'info';
    let message = '';
    let healthImpact = '';

    if (aqi >= thresholds.very_unhealthy) {
      shouldAlert = true;
      severity = 'critical';
      message = `Very unhealthy air quality detected due to elevated ${dominant_pollutant}. AQI: ${aqi}`;
      healthImpact = 'Everyone should avoid all outdoor activities. Emergency conditions.';
    } else if (aqi >= thresholds.unhealthy) {
      shouldAlert = true;
      severity = 'high';
      message = `Unhealthy air quality detected due to elevated ${dominant_pollutant}. AQI: ${aqi}`;
      healthImpact = 'Everyone may experience health effects. Limit outdoor activities.';
    } else if (aqi >= thresholds.unhealthy_sensitive) {
      shouldAlert = true;
      severity = 'moderate';
      message = `Air quality is unhealthy for sensitive groups due to elevated ${dominant_pollutant}. AQI: ${aqi}`;
      healthImpact = 'Sensitive groups should limit outdoor activities.';
    }

    return {
      shouldAlert,
      severity,
      message,
      healthImpact,
      dominantPollutant: dominant_pollutant
    };
  }

  /**
   * Create and send alert
   */
  async createAndSendAlert(alertData) {
    try {
      // Check if similar alert was sent recently (prevent spam)
      const recentAlert = await Alert.findOne({
        location: alertData.location,
        severity: alertData.severity,
        timestamp: {
          $gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      });

      if (recentAlert) {
        console.log(`⚠️ Similar alert already sent for ${alertData.location} in the last hour`);
        return;
      }

      // Save alert to database
      const alert = new Alert({
        location: alertData.location,
        coordinates: alertData.coordinates,
        severity: alertData.severity,
        aqi: alertData.aqi,
        dominant_pollutant: alertData.pollutant,
        message: alertData.message,
        health_impact: alertData.health_impact,
        timestamp: alertData.timestamp,
        status: 'active'
      });

      await alert.save();

      console.log(`🚨 Alert created for ${alertData.location}: ${alertData.severity.toUpperCase()}`);

      // Send notifications to subscribed users
      await this.notifyUsers(alert);

      // Log alert for monitoring
      await this.logAlert(alert);

    } catch (error) {
      console.error('Error creating/sending alert:', error);
    }
  }

  /**
   * Notify users about the alert
   */
  async notifyUsers(alert) {
    try {
      // Find users subscribed to this location
      const users = await User.find({
        'alert_preferences.enabled': true,
        'alert_preferences.locations': {
          $elemMatch: {
            $or: [
              { name: alert.location },
              {
                $and: [
                  { 
                    coordinates: {
                      $near: {
                        $geometry: {
                          type: 'Point',
                          coordinates: [alert.coordinates.lon, alert.coordinates.lat]
                        },
                        $maxDistance: 50000 // 50km radius
                      }
                    }
                  }
                ]
              }
            ]
          }
        }
      });

      console.log(`📧 Sending notifications to ${users.length} users for ${alert.location}`);

      for (const user of users) {
        await this.sendUserNotification(user, alert);
      }

    } catch (error) {
      console.error('Error notifying users:', error);
    }
  }

  /**
   * Send notification to individual user
   */
  async sendUserNotification(user, alert) {
    try {
      const { alert_preferences } = user;

      // Send email notification
      if (alert_preferences.email && this.emailTransporter) {
        await this.sendEmailNotification(user, alert);
      }

      // Send push notification (Web Push API implementation would go here)
      if (alert_preferences.push) {
        await this.sendPushNotification(user, alert);
      }

      // Send SMS (Twilio integration would go here)
      if (alert_preferences.sms && user.phone_number) {
        await this.sendSMSNotification(user, alert);
      }

    } catch (error) {
      console.error(`Error sending notification to user ${user.email}:`, error);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(user, alert) {
    try {
      const emailHtml = this.generateAlertEmailHTML(user, alert);
      
      const mailOptions = {
        from: `"Air Quality Alerts" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `🚨 Air Quality Alert: ${alert.severity.toUpperCase()} - ${alert.location}`,
        html: emailHtml
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${user.email} for ${alert.location} alert`);

    } catch (error) {
      console.error(`❌ Failed to send email to ${user.email}:`, error);
    }
  }

  /**
   * Generate HTML email template for alerts
   */
  generateAlertEmailHTML(user, alert) {
    const severityColors = {
      moderate: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };

    const color = severityColors[alert.severity] || '#6b7280';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Air Quality Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid ${color}; }
          .alert-level { background: ${color}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; text-transform: uppercase; }
          .content { padding: 20px 0; }
          .aqi-display { font-size: 3em; font-weight: bold; color: ${color}; text-align: center; margin: 20px 0; }
          .health-advice { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .footer { font-size: 12px; color: #666; text-align: center; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Air Quality Alert</h1>
            <div class="alert-level">${alert.severity} Alert</div>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name || 'User'},</h2>
            
            <p><strong>Location:</strong> ${alert.location}</p>
            <p><strong>Alert Level:</strong> ${alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}</p>
            
            <div class="aqi-display">
              AQI ${alert.aqi}
            </div>
            
            <p><strong>Primary Pollutant:</strong> ${alert.dominant_pollutant?.toUpperCase() || 'Multiple'}</p>
            <p><strong>Message:</strong> ${alert.message}</p>
            
            <div class="health-advice">
              <h3>🏥 Health Recommendations</h3>
              <p>${alert.health_impact}</p>
            </div>
            
            <h3>💡 What You Can Do</h3>
            <ul>
              <li>Limit outdoor activities, especially strenuous exercise</li>
              <li>Keep windows and doors closed</li>
              <li>Use air purifiers if available</li>
              <li>Wear N95 masks when going outside</li>
              <li>Check on vulnerable family members and friends</li>
            </ul>
            
            <p><em>This alert was generated at ${alert.timestamp.toLocaleString()} based on real-time data from NASA TEMPO satellite and ground monitoring stations.</em></p>
          </div>
          
          <div class="footer">
            <p>NASA Space Apps Challenge 2025 - Air Quality Forecasting System</p>
            <p>Data sources: NASA TEMPO, OpenAQ, WHO Air Pollution Database</p>
            <p>To unsubscribe from these alerts, please update your preferences in the app.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send push notification (placeholder - implement with service like Firebase)
   */
  async sendPushNotification(user, alert) {
    // Placeholder for push notification implementation
    console.log(`📱 Push notification would be sent to ${user.email} for ${alert.location}`);
  }

  /**
   * Send SMS notification (placeholder - implement with Twilio)
   */
  async sendSMSNotification(user, alert) {
    // Placeholder for SMS implementation
    console.log(`📱 SMS would be sent to ${user.phone_number} for ${alert.location}`);
  }

  /**
   * Log alert for monitoring and analytics
   */
  async logAlert(alert) {
    console.log(`📊 Alert logged: ${alert.location} - ${alert.severity} - AQI ${alert.aqi}`);
  }

  /**
   * Get active alerts for a location
   */
  async getActiveAlerts(location, radius = 50) {
    try {
      const alerts = await Alert.find({
        status: 'active',
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        $or: [
          { location: location },
          {
            coordinates: {
              $near: {
                $geometry: { type: 'Point', coordinates: location.coordinates },
                $maxDistance: radius * 1000 // Convert km to meters
              }
            }
          }
        ]
      }).sort({ timestamp: -1 });

      return alerts;
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Clear expired alerts
   */
  async clearExpiredAlerts() {
    try {
      const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      const result = await Alert.updateMany(
        { 
          status: 'active',
          timestamp: { $lt: expiredTime }
        },
        { 
          $set: { status: 'expired' }
        }
      );

      console.log(`🧹 Cleared ${result.modifiedCount} expired alerts`);
    } catch (error) {
      console.error('Error clearing expired alerts:', error);
    }
  }
}

module.exports = AlertService;
