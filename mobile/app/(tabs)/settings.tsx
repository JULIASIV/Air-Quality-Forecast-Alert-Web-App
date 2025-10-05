
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { notificationService, NotificationSettings } from '@/services/notificationService';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load current settings
    setSettings(notificationService.getSettings());
  }, []);

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      notificationService.updateSettings(updatedSettings);
      console.log('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = (enabled: boolean) => {
    updateSettings({ enabled });
  };

  const toggleThreshold = (thresholdKey: keyof NotificationSettings['thresholds'], enabled: boolean) => {
    updateSettings({
      thresholds: {
        ...settings.thresholds,
        [thresholdKey]: {
          ...settings.thresholds[thresholdKey],
          enabled,
        },
      },
    });
  };

  const toggleQuietHours = (enabled: boolean) => {
    updateSettings({
      quietHours: {
        ...settings.quietHours,
        enabled,
      },
    });
  };

  const showPermissionInfo = () => {
    Alert.alert(
      'Notification Permissions',
      'To receive air quality alerts, please ensure notifications are enabled for this app in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => console.log('Open device settings') },
      ]
    );
  };

  const renderHeaderRight = () => (
    <IconSymbol 
      name="info.circle" 
      color={colors.text} 
      size={20}
      style={{ padding: 8 }}
      onPress={showPermissionInfo}
    />
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Notification Settings",
            headerRight: renderHeaderRight,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }}
        />
      )}
      <SafeAreaView style={[commonStyles.container, styles.container]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Toggle */}
          <View style={[commonStyles.card, styles.section]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Enable Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive alerts when air quality changes in your area
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.textSecondary, true: colors.primary }}
                thumbColor={settings.enabled ? colors.card : colors.textSecondary}
                disabled={loading}
              />
            </View>
          </View>

          {/* Alert Thresholds */}
          <View style={[commonStyles.card, styles.section]}>
            <Text style={[commonStyles.subtitle, styles.sectionTitle]}>Alert Thresholds</Text>
            <Text style={[commonStyles.textSecondary, styles.sectionDescription]}>
              Choose which air quality levels trigger notifications
            </Text>

            <View style={styles.thresholdItem}>
              <View style={styles.thresholdInfo}>
                <View style={styles.thresholdHeader}>
                  <View style={[styles.colorIndicator, { backgroundColor: colors.moderate }]} />
                  <Text style={styles.thresholdTitle}>Moderate (AQI 100+)</Text>
                </View>
                <Text style={styles.thresholdDescription}>
                  Sensitive individuals may experience minor symptoms
                </Text>
              </View>
              <Switch
                value={settings.thresholds.moderate.enabled}
                onValueChange={(enabled) => toggleThreshold('moderate', enabled)}
                trackColor={{ false: colors.textSecondary, true: colors.moderate }}
                thumbColor={settings.thresholds.moderate.enabled ? colors.card : colors.textSecondary}
                disabled={loading || !settings.enabled}
              />
            </View>

            <View style={styles.thresholdItem}>
              <View style={styles.thresholdInfo}>
                <View style={styles.thresholdHeader}>
                  <View style={[styles.colorIndicator, { backgroundColor: colors.unhealthySensitive }]} />
                  <Text style={styles.thresholdTitle}>Unhealthy (AQI 150+)</Text>
                </View>
                <Text style={styles.thresholdDescription}>
                  Everyone may experience health effects
                </Text>
              </View>
              <Switch
                value={settings.thresholds.unhealthy.enabled}
                onValueChange={(enabled) => toggleThreshold('unhealthy', enabled)}
                trackColor={{ false: colors.textSecondary, true: colors.unhealthySensitive }}
                thumbColor={settings.thresholds.unhealthy.enabled ? colors.card : colors.textSecondary}
                disabled={loading || !settings.enabled}
              />
            </View>

            <View style={styles.thresholdItem}>
              <View style={styles.thresholdInfo}>
                <View style={styles.thresholdHeader}>
                  <View style={[styles.colorIndicator, { backgroundColor: colors.veryUnhealthy }]} />
                  <Text style={styles.thresholdTitle}>Very Unhealthy (AQI 200+)</Text>
                </View>
                <Text style={styles.thresholdDescription}>
                  Health warnings of emergency conditions
                </Text>
              </View>
              <Switch
                value={settings.thresholds.veryUnhealthy.enabled}
                onValueChange={(enabled) => toggleThreshold('veryUnhealthy', enabled)}
                trackColor={{ false: colors.textSecondary, true: colors.veryUnhealthy }}
                thumbColor={settings.thresholds.veryUnhealthy.enabled ? colors.card : colors.textSecondary}
                disabled={loading || !settings.enabled}
              />
            </View>

            <View style={styles.thresholdItem}>
              <View style={styles.thresholdInfo}>
                <View style={styles.thresholdHeader}>
                  <View style={[styles.colorIndicator, { backgroundColor: colors.hazardous }]} />
                  <Text style={styles.thresholdTitle}>Hazardous (AQI 300+)</Text>
                </View>
                <Text style={styles.thresholdDescription}>
                  Emergency conditions - everyone affected
                </Text>
              </View>
              <Switch
                value={settings.thresholds.hazardous.enabled}
                onValueChange={(enabled) => toggleThreshold('hazardous', enabled)}
                trackColor={{ false: colors.textSecondary, true: colors.hazardous }}
                thumbColor={settings.thresholds.hazardous.enabled ? colors.card : colors.textSecondary}
                disabled={loading || !settings.enabled}
              />
            </View>
          </View>

          {/* Quiet Hours */}
          <View style={[commonStyles.card, styles.section]}>
            <Text style={[commonStyles.subtitle, styles.sectionTitle]}>Quiet Hours</Text>
            <Text style={[commonStyles.textSecondary, styles.sectionDescription]}>
              Disable notifications during specified hours (10 PM - 7 AM)
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Enable Quiet Hours</Text>
                <Text style={styles.settingDescription}>
                  No notifications between 10:00 PM and 7:00 AM
                </Text>
              </View>
              <Switch
                value={settings.quietHours.enabled}
                onValueChange={toggleQuietHours}
                trackColor={{ false: colors.textSecondary, true: colors.primary }}
                thumbColor={settings.quietHours.enabled ? colors.card : colors.textSecondary}
                disabled={loading || !settings.enabled}
              />
            </View>
          </View>

          {/* Information */}
          <View style={[commonStyles.card, styles.section]}>
            <Text style={[commonStyles.subtitle, styles.sectionTitle]}>About Notifications</Text>
            <View style={styles.infoItem}>
              <IconSymbol name="bell" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                Notifications are sent when air quality changes significantly in your area
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="location" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                Location services must be enabled to receive location-based alerts
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="clock" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                Air quality data is checked every 15 minutes for significant changes
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    color: colors.text,
  },
  sectionDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  thresholdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  thresholdInfo: {
    flex: 1,
    marginRight: 16,
  },
  thresholdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  thresholdTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  thresholdDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});
