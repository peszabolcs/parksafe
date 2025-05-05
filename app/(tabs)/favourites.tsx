import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText'; // Optional: Use themed text if preferred
import { ThemedView } from '@/components/ThemedView'; 
export default function FavouritesScreen() {
  return (
    // Use ThemedView for automatic light/dark mode background or standard View
    <ThemedView style={styles.container}>
      {/* Use ThemedText for themed text styling or standard Text */}
      <ThemedText type="title">Kedvencek</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});