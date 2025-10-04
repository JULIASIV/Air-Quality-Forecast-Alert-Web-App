
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface MapPlaceholderProps {
  title?: string;
  message?: string;
}

export default function MapPlaceholder({ 
  title = "Interactive Maps", 
  message = "Maps are not supported in Natively web environment. This feature would show an interactive air quality map with real-time data visualization." 
}: MapPlaceholderProps) {
  return (
    <View style={[commonStyles.card, styles.container]}>
      <View style={styles.iconContainer}>
        <IconSymbol name="map" size={48} color={colors.textSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <IconSymbol name="location" size={16} color={colors.primary} />
          <Text style={styles.featureText}>Real-time air quality overlay</Text>
        </View>
        <View style={styles.featureItem}>
          <IconSymbol name="wind" size={16} color={colors.primary} />
          <Text style={styles.featureText}>Wind patterns and direction</Text>
        </View>
        <View style={styles.featureItem}>
          <IconSymbol name="eye" size={16} color={colors.primary} />
          <Text style={styles.featureText}>Satellite imagery integration</Text>
        </View>
        <View style={styles.featureItem}>
          <IconSymbol name="chart.line.uptrend.xyaxis" size={16} color={colors.primary} />
          <Text style={styles.featureText}>Historical data visualization</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  featureList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
});
