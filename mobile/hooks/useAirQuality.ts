
import { useState, useEffect, useCallback } from 'react';
import { apiService, AirQualityData } from '@/services/apiService';
import { notificationService } from '@/services/notificationService';

export interface UseAirQualityReturn {
  data: AirQualityData | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useAirQuality(): UseAirQualityReturn {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAirQualityData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      console.log('Fetching air quality data...');

      // Try to get current location
      const location = await apiService.getCurrentLocation();
      let airQualityData: AirQualityData | null = null;

      if (location) {
        console.log('Using current location:', location.coords);
        airQualityData = await apiService.fetchAirQualityData(
          location.coords.latitude,
          location.coords.longitude
        );
      }

      // Fallback to major cities if location fails or no data
      if (!airQualityData) {
        console.log('Falling back to major city data...');
        airQualityData = await apiService.getFallbackCityData();
      }

      if (airQualityData) {
        setData(airQualityData);
        setLastUpdated(new Date());
        
        // Check if we should send an alert
        if (data && airQualityData.aqi > data.aqi + 25) {
          await notificationService.sendAirQualityAlert(
            airQualityData.aqi,
            airQualityData.location,
            airQualityData.pollutants.map(p => p.name)
          );
        }
        
        console.log('Air quality data updated:', airQualityData);
      } else {
        throw new Error('Unable to fetch air quality data from any source');
      }
    } catch (err) {
      console.error('Error fetching air quality data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch air quality data');
      
      // If this is the first load and we have no data, provide fallback
      if (!data) {
        setData({
          aqi: 50,
          location: 'Location unavailable',
          lastUpdated: 'Unable to update',
          coordinates: { latitude: 0, longitude: 0 },
          pollutants: [
            { name: 'PM2.5', value: 12, unit: 'μg/m³', level: 'good', description: 'Fine particulate matter' },
            { name: 'PM10', value: 25, unit: 'μg/m³', level: 'good', description: 'Coarse particulate matter' },
            { name: 'O₃', value: 80, unit: 'μg/m³', level: 'good', description: 'Ground-level ozone' },
            { name: 'NO₂', value: 40, unit: 'μg/m³', level: 'good', description: 'Nitrogen dioxide' },
          ],
          forecast: [
            { time: 'Now', aqi: 50, condition: 'Good' },
            { time: '6 AM', aqi: 45, condition: 'Good' },
            { time: '12 PM', aqi: 55, condition: 'Moderate' },
            { time: '6 PM', aqi: 48, condition: 'Good' },
            { time: 'Tomorrow', aqi: 42, condition: 'Good' },
            { time: '+24h', aqi: 38, condition: 'Good' },
            { time: '+36h', aqi: 35, condition: 'Good' },
            { time: '+48h', aqi: 40, condition: 'Good' },
          ],
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  const refresh = useCallback(async () => {
    await fetchAirQualityData(true);
  }, [fetchAirQualityData]);

  useEffect(() => {
    // Initialize notifications
    notificationService.initialize();
    
    // Initial data fetch
    fetchAirQualityData();

    // Set up periodic updates every 15 minutes
    const interval = setInterval(() => {
      console.log('Periodic air quality update...');
      fetchAirQualityData();
    }, 15 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchAirQualityData]);

  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
    lastUpdated,
  };
}
