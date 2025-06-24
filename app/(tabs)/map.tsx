import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as Location from 'expo-location';

const INITIAL_REGION = {
  latitude: 47.497912,
  longitude: 19.040235,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(15);

  // On mount, always fetch and set user's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(userRegion);
    })();
  }, []);

  async function recenter() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Helymeghatározás', 'A helymeghatározás nincs engedélyezve.');
      return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({});
      console.log('Fetched location:', location.coords);
      // Add a tiny random value to latitudeDelta to force re-render
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01 + Math.random() * 0.00001,
        longitudeDelta: 0.01 + Math.random() * 0.00001,
      };
      setRegion(newRegion);
    } catch (e) {
      Alert.alert('Helymeghatározás', 'Nem sikerült lekérni a helyzetet.');
    }
  }

  function handleZoom(delta: number) {
    const newZoom = Math.max(1, Math.min(20, zoom + delta));
    setZoom(newZoom);
    const newDelta = 0.04 / Math.pow(2, newZoom - 15);
    setRegion(r => ({ ...r, latitudeDelta: newDelta, longitudeDelta: newDelta }));
    mapRef.current?.animateToRegion({ ...region, latitudeDelta: newDelta, longitudeDelta: newDelta }, 300);
  }

  return (
    <ThemedView style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        loadingEnabled
        customMapStyle={[]}
      />
      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2563eb" />
          <ThemedText style={styles.loadingText}>Térkép betöltése...</ThemedText>
        </View>
      )}
      {/* Lista nézet Button (bottom center) */}
      <View style={styles.fabGroupBottomCenter}>
        <TouchableOpacity style={styles.fabWide}>
          <ThemedText style={styles.fabWideText}>Lista nézet</ThemedText>
        </TouchableOpacity>
      </View>
      {/* Recenter Button (bottom right) */}
      <View style={styles.fabGroupBottomRight}>
        <TouchableOpacity style={styles.fab} onPress={recenter}>
          <Ionicons name="locate" size={22} color="#222" />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5FC',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
  },
  fabGroupBottomCenter: {
    position: 'absolute',
    bottom: 38,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  fabGroupBottomRight: {
    position: 'absolute',
    bottom: 38,
    right: 18,
    zIndex: 20,
  },
  fab: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  fabWide: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 120,
    maxWidth: 180,
  },
  fabWideText: {
    fontWeight: '500',
    fontSize: 16,
    color: '#222',
  },
});
