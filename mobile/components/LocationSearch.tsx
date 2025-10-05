
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import * as Location from 'expo-location';

interface LocationResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  region?: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: LocationResult) => void;
  onClose: () => void;
}

export default function LocationSearch({ onLocationSelect, onClose }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);

  const majorCities: LocationResult[] = [
    { id: '1', name: 'New York', latitude: 40.7128, longitude: -74.0060, country: 'United States', region: 'NY' },
    { id: '2', name: 'Los Angeles', latitude: 34.0522, longitude: -118.2437, country: 'United States', region: 'CA' },
    { id: '3', name: 'Chicago', latitude: 41.8781, longitude: -87.6298, country: 'United States', region: 'IL' },
    { id: '4', name: 'San Francisco', latitude: 37.7749, longitude: -122.4194, country: 'United States', region: 'CA' },
    { id: '5', name: 'London', latitude: 51.5074, longitude: -0.1278, country: 'United Kingdom', region: 'England' },
    { id: '6', name: 'Paris', latitude: 48.8566, longitude: 2.3522, country: 'France', region: 'Île-de-France' },
    { id: '7', name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, country: 'Japan', region: 'Tokyo' },
    { id: '8', name: 'Sydney', latitude: -33.8688, longitude: 151.2093, country: 'Australia', region: 'NSW' },
    { id: '9', name: 'Toronto', latitude: 43.6532, longitude: -79.3832, country: 'Canada', region: 'ON' },
    { id: '10', name: 'Berlin', latitude: 52.5200, longitude: 13.4050, country: 'Germany', region: 'Berlin' },
  ];

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSearchResults(majorCities);
      return;
    }

    setLoading(true);
    try {
      console.log('Searching for locations:', query);
      
      // Use Expo Location geocoding
      const results = await Location.geocodeAsync(query);
      console.log('Geocoding results:', results);

      if (results.length > 0) {
        const locationResults: LocationResult[] = await Promise.all(
          results.slice(0, 10).map(async (result, index) => {
            try {
              // Reverse geocode to get readable name
              const reverseResults = await Location.reverseGeocodeAsync({
                latitude: result.latitude,
                longitude: result.longitude,
              });

              const address = reverseResults[0];
              const name = address?.city || address?.subregion || address?.region || `Location ${index + 1}`;
              const country = address?.country || '';
              const region = address?.region || address?.subregion || '';

              return {
                id: `search_${index}`,
                name,
                latitude: result.latitude,
                longitude: result.longitude,
                country,
                region,
              };
            } catch (error) {
              console.error('Error reverse geocoding:', error);
              return {
                id: `search_${index}`,
                name: `${result.latitude.toFixed(2)}, ${result.longitude.toFixed(2)}`,
                latitude: result.latitude,
                longitude: result.longitude,
              };
            }
          })
        );

        setSearchResults(locationResults);
      } else {
        // Filter major cities if no geocoding results
        const filtered = majorCities.filter(city =>
          city.name.toLowerCase().includes(query.toLowerCase()) ||
          city.country?.toLowerCase().includes(query.toLowerCase()) ||
          city.region?.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      Alert.alert('Search Error', 'Unable to search for locations. Please try again.');
      
      // Fallback to filtering major cities
      const filtered = majorCities.filter(city =>
        city.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchLocations(text);
  };

  const handleLocationPress = (location: LocationResult) => {
    console.log('Location selected:', location);
    onLocationSelect(location);
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      console.log('Getting current location...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to get your current location.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const reverseResults = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = reverseResults[0];
      const name = address?.city || address?.subregion || 'Current Location';
      const country = address?.country || '';
      const region = address?.region || '';

      const currentLocation: LocationResult = {
        id: 'current',
        name,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        country,
        region,
      };

      handleLocationPress(currentLocation);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderLocationItem = ({ item }: { item: LocationResult }) => (
    <Pressable
      style={styles.locationItem}
      onPress={() => handleLocationPress(item)}
    >
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        {(item.region || item.country) && (
          <Text style={styles.locationDetails}>
            {[item.region, item.country].filter(Boolean).join(', ')}
          </Text>
        )}
        <Text style={styles.locationCoords}>
          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
    </Pressable>
  );

  React.useEffect(() => {
    // Initialize with major cities
    setSearchResults(majorCities);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[commonStyles.subtitle, styles.title]}>Select Location</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <IconSymbol name="xmark" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={16} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a city or location..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => handleSearchChange('')} style={styles.clearButton}>
            <IconSymbol name="xmark.circle.fill" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <Pressable
        style={styles.currentLocationButton}
        onPress={getCurrentLocation}
        disabled={loading}
      >
        <IconSymbol 
          name={loading ? "arrow.clockwise" : "location"} 
          size={16} 
          color={colors.primary} 
        />
        <Text style={styles.currentLocationText}>
          {loading ? 'Getting location...' : 'Use Current Location'}
        </Text>
      </Pressable>

      <FlatList
        data={searchResults}
        renderItem={renderLocationItem}
        keyExtractor={(item) => item.id}
        style={styles.resultsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="location.slash" size={32} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No locations found</Text>
            <Text style={styles.emptySubtext}>Try searching for a different city or location</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  resultsList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  locationDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
