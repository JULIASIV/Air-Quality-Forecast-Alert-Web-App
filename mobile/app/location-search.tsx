
import React from 'react';
import { Modal } from 'react-native';
import { Stack } from 'expo-router';
import LocationSearch from '@/components/LocationSearch';

export default function LocationSearchModal() {
  return (
    <>
      <Stack.Screen options={{ presentation: 'modal', headerShown: false }} />
      <LocationSearch
        onLocationSelect={(location) => {
          console.log('Location selected in modal:', location);
          // Handle location selection
        }}
        onClose={() => {
          console.log('Closing location search modal');
          // Handle modal close
        }}
      />
    </>
  );
}
