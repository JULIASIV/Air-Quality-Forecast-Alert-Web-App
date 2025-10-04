
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface AlertCardProps {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  onDismiss?: () => void;
}

export default function AlertCard({ title, message, severity, onDismiss }: AlertCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return colors.secondary;
      case 'medium':
        return colors.unhealthySensitive;
      case 'high':
        return colors.accent;
      default:
        return colors.textSecondary;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'info.circle.fill';
      case 'medium':
        return 'exclamationmark.triangle.fill';
      case 'high':
        return 'exclamationmark.octagon.fill';
      default:
        return 'info.circle';
    }
  };

  const severityColor = getSeverityColor(severity);
  const severityIcon = getSeverityIcon(severity);

  return (
    <View style={[commonStyles.card, styles.container, { borderLeftColor: severityColor }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <IconSymbol name={severityIcon} size={20} color={severityColor} />
          <Text style={[styles.title, { color: severityColor }]}>{title}</Text>
        </View>
        {onDismiss && (
          <Pressable onPress={onDismiss} style={styles.dismissButton}>
            <IconSymbol name="xmark" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
      
      <Text style={[commonStyles.text, styles.message]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dismissButton: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 0,
  },
});
