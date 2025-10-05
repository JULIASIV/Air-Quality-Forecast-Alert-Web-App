
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface AirQualityCardProps {
  aqi: number;
  location: string;
  lastUpdated: string;
}

export default function AirQualityCard({ aqi, location, lastUpdated }: AirQualityCardProps) {
  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return colors.good;
    if (aqi <= 100) return colors.moderate;
    if (aqi <= 150) return colors.unhealthySensitive;
    if (aqi <= 200) return colors.unhealthy;
    if (aqi <= 300) return colors.veryUnhealthy;
    return colors.hazardous;
  };

  const getAQILabel = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getAQIIcon = (aqi: number) => {
    if (aqi <= 50) return 'checkmark.circle.fill';
    if (aqi <= 100) return 'exclamationmark.triangle.fill';
    if (aqi <= 150) return 'exclamationmark.triangle.fill';
    return 'xmark.circle.fill';
  };

  const aqiColor = getAQIColor(aqi);
  const aqiLabel = getAQILabel(aqi);
  const aqiIcon = getAQIIcon(aqi);

  return (
    <View style={[commonStyles.card, styles.container]}>
      <View style={styles.header}>
        <View>
          <Text style={[commonStyles.subtitle, styles.location]}>{location}</Text>
          <Text style={[commonStyles.textSecondary, styles.lastUpdated]}>
            Last updated: {lastUpdated}
          </Text>
        </View>
        <IconSymbol name={aqiIcon} size={24} color={aqiColor} />
      </View>
      
      <View style={styles.aqiContainer}>
        <View style={[styles.aqiCircle, { backgroundColor: aqiColor }]}>
          <Text style={styles.aqiNumber}>{aqi}</Text>
        </View>
        <View style={styles.aqiInfo}>
          <Text style={[styles.aqiLabel, { color: aqiColor }]}>{aqiLabel}</Text>
          <Text style={commonStyles.textSecondary}>Air Quality Index</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  location: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  lastUpdated: {
    fontSize: 12,
    marginTop: 4,
  },
  aqiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aqiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aqiNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.card,
  },
  aqiInfo: {
    flex: 1,
  },
  aqiLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
});
