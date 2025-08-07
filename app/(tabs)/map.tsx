import React from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapboxMap } from '@/components/MapboxMap';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  
  // Calculate tab bar height for iOS absolute positioning
  const tabBarHeight = Platform.OS === 'ios' ? (insets.bottom > 0 ? 83 : 49) : 56;
  
  return (
    <View style={{ 
      flex: 1,
      paddingBottom: Platform.OS === 'ios' ? tabBarHeight : 0 // Only add padding on iOS
    }}>
      <MapboxMap />
    </View>
  );
}
