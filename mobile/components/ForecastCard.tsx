
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface ForecastItem {
  time: string;
  aqi: number;
  condition: string;
}

interface ForecastCardProps {
  forecast: ForecastItem[];
}

export default function ForecastCard({ forecast }: ForecastCardProps) {
  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return colors.good;
    if (aqi <= 100) return colors.moderate;
    if (aqi <= 150) return colors.unhealthySensitive;
    if (aqi <= 200) return colors.unhealthy;
    if (aqi <= 300) return colors.veryUnhealthy;
    return colors.hazardous;
  };

  return (
    <View style={[commonStyles.card, styles.container]}>
      <View style={styles.header}>
        <Text style={commonStyles.subtitle}>48-Hour Forecast</Text>
        <IconSymbol name="clock" size={20} color={colors.textSecondary} />
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
        {forecast.map((item, index) => (
          <View key={index} style={styles.forecastItem}>
            <Text style={styles.forecastTime}>{item.time}</Text>
            <View style={[styles.aqiBadge, { backgroundColor: getAQIColor(item.aqi) }]}>
              <Text style={styles.aqiBadgeText}>{item.aqi}</Text>
            </View>
            <Text style={styles.forecastCondition}>{item.condition}</Text>
          </View>
        ))}
      </ScrollView>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  forecastScroll: {
    flexDirection: 'row',
  },
  forecastItem: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 80,
  },
  forecastTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  aqiBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  aqiBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.card,
  },
  forecastCondition: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
