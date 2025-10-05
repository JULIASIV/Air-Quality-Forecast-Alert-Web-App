
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  background: '#F5F5F5',        // Light gray for a clean look
  text: '#212121',              // Dark gray for readability
  textSecondary: '#757575',     // Medium gray for less important text
  primary: '#4CAF50',           // Green for good air quality indicators
  secondary: '#FFC107',         // Amber for moderate air quality
  accent: '#F44336',            // Red for poor air quality alerts
  card: '#FFFFFF',              // White for content containers
  highlight: '#BBDEFB',         // Light blue for interactive elements
  
  // Air quality specific colors
  good: '#4CAF50',              // Green for good air quality
  moderate: '#FFC107',          // Amber for moderate air quality
  unhealthySensitive: '#FF9800', // Orange for unhealthy for sensitive groups
  unhealthy: '#F44336',         // Red for unhealthy air quality
  veryUnhealthy: '#9C27B0',     // Purple for very unhealthy
  hazardous: '#8D1E27',         // Dark red for hazardous
};

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  secondary: {
    backgroundColor: colors.secondary,
    alignSelf: 'center',
    width: '100%',
  },
  accent: {
    backgroundColor: colors.accent,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  textSecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
