
import React, { useState } from "react";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet, View, Text, Platform, RefreshControl, Alert } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import AirQualityCard from "@/components/AirQualityCard";
import PollutantCard from "@/components/PollutantCard";
import ForecastCard from "@/components/ForecastCard";
import AlertCard from "@/components/AlertCard";
import HealthRecommendations from "@/components/HealthRecommendations";
import MapPlaceholder from "@/components/MapPlaceholder";
import { useAirQuality } from "@/hooks/useAirQuality";

export default function HomeScreen() {
  const theme = useTheme();
  const { data, loading, error, refreshing, refresh } = useAirQuality();
  const [alerts, setAlerts] = useState([
    {
      id: '1',
      title: 'Welcome to Air Quality Monitor',
      message: 'Get real-time air quality data and health recommendations for your location.',
      severity: 'low' as const,
    }
  ]);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleLocationPress = () => {
    Alert.alert(
      'Location Services',
      'This app uses your location to provide accurate air quality data. You can change location permissions in your device settings.',
      [{ text: 'OK' }]
    );
  };

  const renderHeaderRight = () => (
    <IconSymbol 
      name="arrow.clockwise" 
      color={colors.text} 
      size={20}
      style={{ padding: 8 }}
    />
  );

  const renderHeaderLeft = () => (
    <IconSymbol
      name="location"
      color={colors.text}
      size={20}
      style={{ padding: 8 }}
      onPress={handleLocationPress}
    />
  );

  // Show loading state
  if (loading && !data) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: "Air Quality Monitor",
              headerRight: renderHeaderRight,
              headerLeft: renderHeaderLeft,
              headerStyle: {
                backgroundColor: colors.background,
              },
              headerTintColor: colors.text,
            }}
          />
        )}
        <View style={[commonStyles.container, commonStyles.center]}>
          <IconSymbol name="arrow.clockwise" size={32} color={colors.primary} />
          <Text style={[commonStyles.text, { marginTop: 16 }]}>
            Loading air quality data...
          </Text>
          {error && (
            <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
              {error}
            </Text>
          )}
        </View>
      </>
    );
  }

  // Add error alert if there's an error
  const allAlerts = error ? [
    {
      id: 'error',
      title: 'Data Update Error',
      message: error,
      severity: 'medium' as const,
    },
    ...alerts
  ] : alerts;

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Air Quality Monitor",
            headerRight: renderHeaderRight,
            headerLeft: renderHeaderLeft,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }}
        />
      )}
      <View style={[commonStyles.container, styles.container]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Alerts Section */}
          {allAlerts.length > 0 && (
            <View style={styles.section}>
              {allAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  title={alert.title}
                  message={alert.message}
                  severity={alert.severity}
                  onDismiss={() => dismissAlert(alert.id)}
                />
              ))}
            </View>
          )}

          {/* Main Air Quality Card */}
          {data && (
            <AirQualityCard
              aqi={data.aqi}
              location={data.location}
              lastUpdated={data.lastUpdated}
            />
          )}

          {/* Interactive Map Placeholder */}
          <MapPlaceholder />

          {/* Weather Info */}
          {data?.weather && (
            <View style={[commonStyles.card, styles.weatherCard]}>
              <Text style={[commonStyles.subtitle, styles.sectionTitle]}>Weather Conditions</Text>
              <View style={styles.weatherGrid}>
                <View style={styles.weatherItem}>
                  <IconSymbol name="thermometer" size={16} color={colors.primary} />
                  <Text style={styles.weatherLabel}>Temperature</Text>
                  <Text style={styles.weatherValue}>{Math.round(data.weather.temperature)}°C</Text>
                </View>
                <View style={styles.weatherItem}>
                  <IconSymbol name="humidity" size={16} color={colors.primary} />
                  <Text style={styles.weatherLabel}>Humidity</Text>
                  <Text style={styles.weatherValue}>{Math.round(data.weather.humidity)}%</Text>
                </View>
                <View style={styles.weatherItem}>
                  <IconSymbol name="wind" size={16} color={colors.primary} />
                  <Text style={styles.weatherLabel}>Wind Speed</Text>
                  <Text style={styles.weatherValue}>{Math.round(data.weather.windSpeed)} km/h</Text>
                </View>
                <View style={styles.weatherItem}>
                  <IconSymbol name="barometer" size={16} color={colors.primary} />
                  <Text style={styles.weatherLabel}>Pressure</Text>
                  <Text style={styles.weatherValue}>{Math.round(data.weather.pressure)} hPa</Text>
                </View>
              </View>
            </View>
          )}

          {/* Pollutants Grid */}
          {data && (
            <View style={styles.section}>
              <Text style={[commonStyles.subtitle, styles.sectionTitle]}>Pollutant Levels</Text>
              <View style={styles.pollutantsGrid}>
                {data.pollutants.map((pollutant, index) => (
                  <PollutantCard
                    key={index}
                    name={pollutant.name}
                    value={pollutant.value}
                    unit={pollutant.unit}
                    level={pollutant.level}
                    description={pollutant.description}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Forecast */}
          {data && <ForecastCard forecast={data.forecast} />}

          {/* Health Recommendations */}
          {data && <HealthRecommendations aqi={data.aqi} />}

          {/* Data Sources Info */}
          <View style={[commonStyles.card, styles.dataSourcesCard]}>
            <Text style={[commonStyles.subtitle, styles.sectionTitle]}>Data Sources & Features</Text>
            <View style={styles.dataSourceItem}>
              <IconSymbol name="globe" size={16} color={colors.primary} />
              <Text style={styles.dataSourceText}>OpenAQ - Ground Sensor Network</Text>
            </View>
            <View style={styles.dataSourceItem}>
              <IconSymbol name="cloud" size={16} color={colors.primary} />
              <Text style={styles.dataSourceText}>Open-Meteo - Weather Data</Text>
            </View>
            <View style={styles.dataSourceItem}>
              <IconSymbol name="location" size={16} color={colors.primary} />
              <Text style={styles.dataSourceText}>GPS Location Services</Text>
            </View>
            <View style={styles.dataSourceItem}>
              <IconSymbol name="bell" size={16} color={colors.primary} />
              <Text style={styles.dataSourceText}>Smart Air Quality Alerts</Text>
            </View>
            <View style={styles.dataSourceItem}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={16} color={colors.primary} />
              <Text style={styles.dataSourceText}>48-Hour Forecasting</Text>
            </View>
            <Text style={[commonStyles.textSecondary, styles.disclaimer]}>
              Data is updated every 15 minutes. Forecasts are generated using machine learning models combining satellite and ground sensor data. Pull down to refresh manually.
            </Text>
          </View>
        </ScrollView>
      </View>
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
  },
  scrollContentWithTabBar: {
    paddingBottom: 100, // Extra padding for floating tab bar
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: colors.text,
  },
  pollutantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  weatherCard: {
    marginBottom: 16,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  weatherLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  dataSourcesCard: {
    marginBottom: 32,
  },
  dataSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataSourceText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    marginTop: 12,
    lineHeight: 16,
  },
});
