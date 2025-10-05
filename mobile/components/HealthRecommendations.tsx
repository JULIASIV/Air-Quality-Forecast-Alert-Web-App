
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface Recommendation {
  icon: string;
  text: string;
  category: 'general' | 'sensitive' | 'outdoor';
}

interface HealthRecommendationsProps {
  aqi: number;
}

export default function HealthRecommendations({ aqi }: HealthRecommendationsProps) {
  const getRecommendations = (aqi: number): Recommendation[] => {
    if (aqi <= 50) {
      return [
        { icon: 'figure.walk', text: 'Great day for outdoor activities', category: 'outdoor' },
        { icon: 'lungs.fill', text: 'Air quality is satisfactory', category: 'general' },
        { icon: 'heart.fill', text: 'No health concerns for anyone', category: 'sensitive' },
      ];
    } else if (aqi <= 100) {
      return [
        { icon: 'figure.walk', text: 'Outdoor activities are acceptable', category: 'outdoor' },
        { icon: 'exclamationmark.triangle', text: 'Sensitive individuals should limit prolonged outdoor exertion', category: 'sensitive' },
        { icon: 'lungs', text: 'Generally acceptable air quality', category: 'general' },
      ];
    } else if (aqi <= 150) {
      return [
        { icon: 'exclamationmark.triangle.fill', text: 'Sensitive groups should avoid outdoor activities', category: 'sensitive' },
        { icon: 'figure.walk', text: 'Reduce prolonged outdoor exertion', category: 'outdoor' },
        { icon: 'house.fill', text: 'Consider staying indoors if sensitive', category: 'general' },
      ];
    } else {
      return [
        { icon: 'xmark.octagon.fill', text: 'Avoid all outdoor activities', category: 'outdoor' },
        { icon: 'house.fill', text: 'Stay indoors and keep windows closed', category: 'general' },
        { icon: 'cross.fill', text: 'Seek medical attention if experiencing symptoms', category: 'sensitive' },
      ];
    }
  };

  const recommendations = getRecommendations(aqi);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general':
        return colors.primary;
      case 'sensitive':
        return colors.secondary;
      case 'outdoor':
        return colors.highlight;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={[commonStyles.card, styles.container]}>
      <Text style={[commonStyles.subtitle, styles.title]}>Health Recommendations</Text>
      
      {recommendations.map((rec, index) => (
        <View key={index} style={styles.recommendationItem}>
          <View style={[styles.iconContainer, { backgroundColor: getCategoryColor(rec.category) }]}>
            <IconSymbol name={rec.icon} size={16} color={colors.card} />
          </View>
          <Text style={[commonStyles.text, styles.recommendationText]}>{rec.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 0,
  },
});
