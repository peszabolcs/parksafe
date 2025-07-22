import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import Mapbox, { MapView, Camera, ShapeSource, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLocationStore } from '@/stores/locationStore';
import { MapMarker } from '@/lib/markers';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_KEY;
if (MAPBOX_ACCESS_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
}

export const MapboxMap: React.FC = () => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isRecenterLoading, setIsRecenterLoading] = useState(false);
  
  const { markers, loading, error } = useLocationStore();

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission Required', 'Please enable location permissions to see your position on the map.', [{ text: 'OK' }]);
        return;
      }

      setLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      setUserLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please check your GPS settings.', [{ text: 'OK' }]);
    }
  };

  const handleRecenter = async () => {
    if (!userLocation) {
      setIsRecenterLoading(true);
      await getCurrentLocation();
      setIsRecenterLoading(false);
      return;
    }

    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.coords.longitude, userLocation.coords.latitude],
        zoomLevel: 15,
        animationMode: 'flyTo',
        animationDuration: 2000,
      });
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getUserLocationMarker = () => {
    if (!userLocation) return null;
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [userLocation.coords.longitude, userLocation.coords.latitude],
        },
        properties: {
          id: 'user-location',
          name: 'Your Location',
        },
      }],
    };
  };

  const convertMarkersToGeoJSON = (markers: MapMarker[]) => {
    return {
      type: 'FeatureCollection',
      features: markers.map(marker => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [marker.coordinate.longitude, marker.coordinate.latitude],
        },
        properties: {
          id: marker.id,
          name: marker.title,
          type: marker.type,
          description: marker.description,
          available: marker.available,
          distance: marker.distance,
          cluster: true,
          cluster_id: marker.id,
        },
      })),
    };
  };

  const onMapLoaded = () => {
    setIsMapLoaded(true);
  };

  const onMapError = (error: any) => {
    console.error('Mapbox map error:', error);
  };

  const getCameraCenter = () => {
    if (userLocation) {
      return [userLocation.coords.longitude, userLocation.coords.latitude];
    }
    return [20.1484, 46.253];
  };

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.centerContainer}>
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            🗺️ Mapbox Token Required
          </ThemedText>
          <ThemedText style={[styles.errorSubtext, { color: textColor }]}>
            Create .env file with:
          </ThemedText>
          <ThemedText style={[styles.codeText, { color: '#3B82F6' }]}>
            EXPO_PUBLIC_MAPBOX_PUBLIC_KEY=pk.your_key_here
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const userLocationData = getUserLocationMarker();
  const markersGeoJSON = convertMarkersToGeoJSON(markers);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onDidFinishLoadingMap={onMapLoaded}
        onDidFailLoadingMap={onMapError}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={getCameraCenter()}
          zoomLevel={userLocation ? 15 : 12}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {markers.length > 0 && (
          <ShapeSource
            id="database-markers"
            shape={markersGeoJSON}
            cluster={true}
            clusterRadius={50}
            clusterMaxZoom={14}
            clusterProperties={{
              parking: ['+', ['case', ['==', ['get', 'type'], 'parking'], 1, 0]],
              repairStation: ['+', ['case', ['==', ['get', 'type'], 'repairStation'], 1, 0]],
              bicycleService: ['+', ['case', ['==', ['get', 'type'], 'bicycleService'], 1, 0]],
            }}
          >
            <CircleLayer
              id="clusters"
              filter={['has', 'point_count']}
              style={{
                circleRadius: 12,
                circleColor: [
                  'step',
                  ['get', 'point_count'],
                  '#51bbd6', 10,
                  '#f1f075', 50,
                  '#f28cb1', 100,
                  '#e55e5e'
                ],
                circleStrokeColor: '#FFFFFF',
                circleStrokeWidth: 2,
              }}
            />

            <SymbolLayer
              id="cluster-count"
              filter={['has', 'point_count']}
              style={{
                textField: ['get', 'point_count'],
                textFont: ['Arial Unicode MS Bold'],
                textSize: 12,
                textColor: '#FFFFFF',
                textHaloColor: '#000000',
                textHaloWidth: 1,
              }}
            />

            <CircleLayer
              id="unclustered-points"
              filter={['!', ['has', 'point_count']]}
              style={{
                circleRadius: 12,
                circleColor: [
                  'case',
                  ['==', ['get', 'type'], 'parking'], '#059669',
                  ['==', ['get', 'type'], 'repairStation'], '#1D4ED8',
                  ['==', ['get', 'type'], 'bicycleService'], '#F97316',
                  '#6B7280'
                ],
                circleStrokeColor: '#FFFFFF',
                circleStrokeWidth: 2,
              }}
            />
            
            <SymbolLayer
              id="marker-text"
              filter={['!', ['has', 'point_count']]}
              style={{
                textField: ['get', 'name'],
                textFont: ['Arial Unicode MS Regular'],
                textSize: 10,
                textColor: '#000000',
                textHaloColor: '#FFFFFF',
                textHaloWidth: 1,
                textOffset: [0, 1.2],
                textAnchor: 'top',
              }}
            />
          </ShapeSource>
        )}

        {userLocationData && (
          <ShapeSource
            id="user-location-markers"
            shape={userLocationData}
          >
            <CircleLayer
              id="user-location-pulse"
              style={{
                circleRadius: 12,
                circleColor: 'rgba(59, 130, 246, 0.3)',
                circleStrokeColor: 'rgba(59, 130, 246, 0.5)',
                circleStrokeWidth: 1,
              }}
            />
            
            <CircleLayer
              id="user-location-middle"
              style={{
                circleRadius: 8,
                circleColor: 'rgba(59, 130, 246, 0.6)',
                circleStrokeColor: '#FFFFFF',
                circleStrokeWidth: 1,
              }}
            />
            
            <CircleLayer
              id="user-location-inner"
              style={{
                circleRadius: 4,
                circleColor: '#3B82F6',
                circleStrokeColor: '#FFFFFF',
                circleStrokeWidth: 1,
              }}
            />
            
            <SymbolLayer
              id="user-location-text"
              style={{
                textField: ['get', 'name'],
                textFont: ['Arial Unicode MS Regular'],
                textSize: 12,
                textColor: '#3B82F6',
                textHaloColor: '#FFFFFF',
                textHaloWidth: 2,
                textOffset: [0, 2.5],
                textAnchor: 'top',
              }}
            />
          </ShapeSource>
        )}
      </MapView>

      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenter}
        disabled={isRecenterLoading}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isRecenterLoading ? "refresh" : "locate"}
          size={24}
          color="#FFFFFF"
          style={isRecenterLoading ? styles.rotatingIcon : undefined}
        />
      </TouchableOpacity>

      <View style={styles.infoOverlay}>
        <ThemedText style={[styles.infoText, { color: textColor }]}>
          🗺️ {userLocation ? 'Your Location Map' : 'Szeged Map'}
        </ThemedText>
        <ThemedText style={[styles.infoText, { color: textColor }]}>
          📍 {isMapLoaded ? 'Map Ready ✅' : 'Loading ⏳'}
        </ThemedText>
        <ThemedText style={[styles.subText, { color: textColor }]}>
          🔵 Blue: Your Location
          {markers.length > 0 && `\n🟢 Green: Parking (${markers.filter(m => m.type === 'parking').length})`}
          {markers.filter(m => m.type === 'repairStation').length > 0 && `\n🔵 Blue: Repair Stations (${markers.filter(m => m.type === 'repairStation').length})`}
          {markers.filter(m => m.type === 'bicycleService').length > 0 && `\n🟠 Orange: Bike Services (${markers.filter(m => m.type === 'bicycleService').length})`}
        </ThemedText>
        <ThemedText style={[styles.subText, { color: textColor }]}>
          🔵 Clusters: Zoom in to see individual markers
        </ThemedText>
        {loading && (
          <ThemedText style={[styles.subText, { color: '#3B82F6' }]}>
            🔄 Loading markers...
          </ThemedText>
        )}
        {error && (
          <ThemedText style={[styles.subText, { color: '#EF4444' }]}>
            ❌ {error}
          </ThemedText>
        )}
        {!locationPermission && (
          <ThemedText style={[styles.subText, { color: '#EF4444' }]}>
            ⚠️ Location permission needed
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    marginBottom: 5,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 5,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rotatingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  infoOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  subText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
}); 