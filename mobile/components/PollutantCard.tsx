
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';

interface PollutantCardProps {
  name: string;
  value: number;
  unit: string;
  level: 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  description: string;
}

export default function PollutantCard({ name, value, unit, level, description }: PollutantCardProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'good':
        return colors.good;
      case 'moderate':
        return colors.moderate;
      case 'unhealthy':
        return colors.unhealthySensitive;
      case 'very_unhealthy':
        return colors.veryUnhealthy;
      case 'hazardous':
        return colors.hazardous;
      default:
        return colors.textSecondary;
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'good':
        return 'Good';
      case 'moderate':
        return 'Moderate';
      case 'unhealthy':
        return 'Unhealthy';
      case 'very_unhealthy':
        return 'Very Unhealthy';
      case 'hazardous':
        return 'Hazardous';
      default:
        return 'Unknown';
    }
  };

  const levelColor = getLevelColor(level);
  const levelLabel = getLevelLabel(level);

  return (
    <View style={[commonStyles.card, styles.container]}>
      <View style={styles.header}>
        <Text style={styles.pollutantName}>{name}</Text>
        <View style={[styles.levelIndicator, { backgroundColor: levelColor }]} />
      </View>
      
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{typeof value === 'number' ? value.toFixed(1) : value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      
      <Text style={[styles.levelLabel, { color: levelColor }]}>
        {levelLabel}
      </Text>
      
      <Text style={[commonStyles.textSecondary, styles.description]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 12,
    minWidth: '45%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pollutantName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  levelIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  unit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
});
