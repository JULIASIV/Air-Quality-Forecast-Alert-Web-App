
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface AlertThreshold {
  aqi: number;
  enabled: boolean;
  pollutants: string[];
}

export interface NotificationSettings {
  enabled: boolean;
  thresholds: {
    moderate: AlertThreshold;
    unhealthy: AlertThreshold;
    veryUnhealthy: AlertThreshold;
    hazardous: AlertThreshold;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

class NotificationService {
  private settings: NotificationSettings = {
    enabled: true,
    thresholds: {
      moderate: { aqi: 100, enabled: false, pollutants: ['PM2.5', 'PM10'] },
      unhealthy: { aqi: 150, enabled: true, pollutants: ['PM2.5', 'PM10', 'O₃'] },
      veryUnhealthy: { aqi: 200, enabled: true, pollutants: ['PM2.5', 'PM10', 'O₃', 'NO₂'] },
      hazardous: { aqi: 300, enabled: true, pollutants: ['PM2.5', 'PM10', 'O₃', 'NO₂'] },
    },
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '07:00',
    },
  };

  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing notification service...');
      
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Create notification channels for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      console.log('Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  private async createNotificationChannels() {
    await Notifications.setNotificationChannelAsync('air-quality-alerts', {
      name: 'Air Quality Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'default',
      description: 'Notifications for air quality changes and alerts',
    });

    await Notifications.setNotificationChannelAsync('daily-updates', {
      name: 'Daily Air Quality Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#2196F3',
      sound: 'default',
      description: 'Daily air quality summaries and forecasts',
    });
  }

  async sendAirQualityAlert(aqi: number, location: string, pollutants: string[]): Promise<void> {
    if (!this.settings.enabled) {
      console.log('Notifications disabled, skipping alert');
      return;
    }

    if (this.isQuietHours()) {
      console.log('Quiet hours active, skipping alert');
      return;
    }

    const threshold = this.getThresholdForAQI(aqi);
    if (!threshold || !threshold.enabled) {
      console.log('No threshold met or threshold disabled');
      return;
    }

    try {
      const { title, body } = this.getAlertContent(aqi, location, pollutants);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'air-quality-alert',
        },
        trigger: null, // Send immediately
      });

      console.log('Air quality alert sent:', title);
    } catch (error) {
      console.error('Error sending air quality alert:', error);
    }
  }

  async sendDailyUpdate(aqi: number, location: string, forecast: string): Promise<void> {
    if (!this.settings.enabled) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Daily Air Quality Update - ${location}`,
          body: `Current AQI: ${aqi} (${this.getAQICondition(aqi)}). ${forecast}`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          categoryIdentifier: 'daily-update',
        },
        trigger: {
          hour: 8,
          minute: 0,
          repeats: true,
        },
      });

      console.log('Daily update scheduled');
    } catch (error) {
      console.error('Error scheduling daily update:', error);
    }
  }

  async scheduleBackgroundCheck(): Promise<void> {
    // Schedule background task to check air quality
    // This would typically use expo-task-manager for background execution
    console.log('Background air quality check scheduled');
  }

  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { start, end } = this.settings.quietHours;
    
    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }
    
    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= start && currentTime <= end;
  }

  private getThresholdForAQI(aqi: number): AlertThreshold | null {
    if (aqi >= this.settings.thresholds.hazardous.aqi) {
      return this.settings.thresholds.hazardous;
    }
    if (aqi >= this.settings.thresholds.veryUnhealthy.aqi) {
      return this.settings.thresholds.veryUnhealthy;
    }
    if (aqi >= this.settings.thresholds.unhealthy.aqi) {
      return this.settings.thresholds.unhealthy;
    }
    if (aqi >= this.settings.thresholds.moderate.aqi) {
      return this.settings.thresholds.moderate;
    }
    return null;
  }

  private getAlertContent(aqi: number, location: string, pollutants: string[]): { title: string; body: string } {
    const condition = this.getAQICondition(aqi);
    const mainPollutants = pollutants.slice(0, 2).join(' and ');
    
    let title = `Air Quality Alert - ${location}`;
    let body = `AQI is ${aqi} (${condition}).`;
    
    if (aqi >= 300) {
      title = `🚨 HAZARDOUS Air Quality - ${location}`;
      body = `Extremely dangerous AQI of ${aqi}. Everyone should avoid all outdoor activities. ${mainPollutants} levels are hazardous.`;
    } else if (aqi >= 200) {
      title = `⚠️ Very Unhealthy Air - ${location}`;
      body = `AQI is ${aqi}. Health warnings of emergency conditions. Everyone should avoid outdoor activities.`;
    } else if (aqi >= 150) {
      title = `⚠️ Unhealthy Air Quality - ${location}`;
      body = `AQI is ${aqi}. Everyone may experience health effects. Limit outdoor activities.`;
    } else if (aqi >= 100) {
      title = `⚠️ Moderate Air Quality - ${location}`;
      body = `AQI is ${aqi}. Sensitive individuals should consider limiting outdoor activities.`;
    }
    
    return { title, body };
  }

  private getAQICondition(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Notification settings updated:', this.settings);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  }
}

export const notificationService = new NotificationService();
