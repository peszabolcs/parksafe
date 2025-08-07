import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, Modal, FlatList, Pressable, Animated, Dimensions, ActivityIndicator, Linking } from 'react-native';
import * as Location from 'expo-location';
import Mapbox, { MapView, Camera, ShapeSource, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemeStore } from '@/stores/themeStore';
import { useLocationStore } from '@/stores/locationStore';
import { useFavouritesStore } from '@/stores/favouritesStore';
import { MapMarker, getDistance } from '@/lib/markers';
import { MapMarker as MapMarkerType } from '@/lib/markers';
import { MAP_CONFIG } from '@/lib/mapbox';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_KEY;
if (MAPBOX_ACCESS_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
}

export const MapboxMap: React.FC = () => {
  // Override console.error to filter out ViewTagResolver errors
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorString = args.join(' ');
      if (errorString.includes('ViewTagResolver') || errorString.includes('view: null found with tag')) {
        return; // Suppress this specific error
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  const { currentTheme } = useThemeStore();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const shadowColor = useThemeColor({ light: '#000', dark: '#000' }, 'text');
  
  const isDarkMode = currentTheme === 'dark';
  
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isRecenterLoading, setIsRecenterLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerType | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [listFilter, setListFilter] = useState<'all' | 'parking' | 'repairStation' | 'bicycleService'>('all');
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [currentMapCenter, setCurrentMapCenter] = useState<{latitude: number, longitude: number} | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'hybrid'>('standard');
  const [markerFilters, setMarkerFilters] = useState({
    parking: true,
    repairStation: true,
    bicycleService: true,
  });
  
  const modalAnim = useRef(new Animated.Value(screenDimensions.height)).current;
  
  const { markers, loading, error, searchAtLocation, clearSearchResults } = useLocationStore();
  const { addFavourite, removeFavourite, isFavourite, loadFavourites } = useFavouritesStore();

  // Handle screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
      modalAnim.setValue(window.height);
    });
    
    return () => subscription?.remove();
  }, [modalAnim]);

  // Load favourites on mount
  useEffect(() => {
    loadFavourites();
  }, [loadFavourites]);

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

    // Clear search results when returning to user location
    const { searchMarkers } = useLocationStore.getState();
    if (searchMarkers && searchMarkers.length > 0) {
      clearSearchResults();
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

  const handleSearchAtCurrentLocation = async () => {
    if (!currentMapCenter) return;
    
    try {
      await searchAtLocation(currentMapCenter.latitude, currentMapCenter.longitude);
    } catch (error) {
      Alert.alert('Error', 'Failed to load places in this area.');
    }
  };

  // Check if user has moved map significantly from their location
  const showSearchButton = useMemo(() => {
    if (!userLocation || !currentMapCenter) return false;
    
    const distance = getDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      currentMapCenter.latitude,
      currentMapCenter.longitude
    );
    
    return distance > 2000; // Show search button if moved more than 2km
  }, [userLocation, currentMapCenter]);

  // Automatically clear search results when user returns to their location
  useEffect(() => {
    if (!userLocation || !currentMapCenter) return;
    
    const distance = getDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      currentMapCenter.latitude,
      currentMapCenter.longitude
    );
    
    if (distance <= 2000) {
      const { searchMarkers } = useLocationStore.getState();
      if (searchMarkers && searchMarkers.length > 0) {
        clearSearchResults();
      }
    }
  }, [userLocation, currentMapCenter, clearSearchResults]);

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
    // Filter out ViewTagResolver errors which are harmless
    const errorString = typeof error === 'string' ? error : JSON.stringify(error);
    if (errorString.includes('ViewTagResolver') || errorString.includes('view: null found with tag')) {
      return; // Ignore this specific error
    }
    console.error('Mapbox map error:', error);
  };

  const getCameraCenter = () => {
    if (userLocation) {
      return [userLocation.coords.longitude, userLocation.coords.latitude];
    }
    return [20.1484, 46.253];
  };

  // Animation functions for modal
  const openModal = useCallback(() => {
    setShowListModal(true);
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [modalAnim]);

  const closeModal = useCallback(() => {
    Animated.timing(modalAnim, {
      toValue: screenDimensions.height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowListModal(false);
      modalAnim.setValue(screenDimensions.height);
    });
  }, [modalAnim, screenDimensions.height]);

  const backgroundOpacity = modalAnim.interpolate({
    inputRange: [0, screenDimensions.height],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleMarkerPress = useCallback((marker: MapMarkerType) => {
    setSelectedMarker(marker);
    
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [marker.coordinate.longitude, marker.coordinate.latitude],
        zoomLevel: 16,
        animationMode: 'flyTo',
        animationDuration: 1000,
      });
    }
  }, []);

  const closeFlyout = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const handleFavouriteToggle = useCallback(async (marker: MapMarkerType) => {
    try {
      if (isFavourite(marker.id)) {
        await removeFavourite(marker.id);
      } else {
        await addFavourite(marker);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favourites.');
    }
  }, [isFavourite, addFavourite, removeFavourite]);

  const handleDirections = useCallback(() => {
    if (selectedMarker) {
      const { latitude, longitude } = selectedMarker.coordinate;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open navigation app.');
      });
    }
  }, [selectedMarker]);

  const handleListItemPress = useCallback((marker: MapMarkerType) => {
    setSelectedMarker(marker);
    closeModal();
    
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [marker.coordinate.longitude, marker.coordinate.latitude],
        zoomLevel: 16,
        animationMode: 'flyTo',
        animationDuration: 1000,
      });
    }
  }, [closeModal]);

  const listFilteredMarkers = useMemo(() => {
    if (listFilter === 'all') return markers;
    return markers.filter(m => m.type === listFilter);
  }, [markers, listFilter]);

  // Filter markers based on user selection
  const filteredMarkers = useMemo(() => {
    return markers.filter(marker => {
      return markerFilters[marker.type];
    });
  }, [markers, markerFilters]);

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
        onMapIdle={(event) => {
          if (event.properties && event.properties.center) {
            const center = event.properties.center;
            setCurrentMapCenter({
              latitude: center[1],
              longitude: center[0],
            });
          }
        }}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        styleURL={
          mapType === 'hybrid' 
            ? MAP_CONFIG.styles.satellite 
            : isDarkMode 
              ? MAP_CONFIG.styles.dark 
              : MAP_CONFIG.styles.light
        }
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={getCameraCenter()}
          zoomLevel={userLocation ? 15 : 12}
          animationMode="flyTo"
          animationDuration={2000}
        />

                {/* Parking Markers */}
                {filteredMarkers.filter(m => m.type === 'parking').length > 0 && (
                  <ShapeSource
                    id="parking-markers"
                    shape={convertMarkersToGeoJSON(filteredMarkers.filter(m => m.type === 'parking'))}
                    cluster={true}
                    clusterRadius={50}
                    clusterMaxZoom={14}
                    onPress={(feature) => {
                      if (feature.features && feature.features.length > 0) {
                        const markerData = feature.features[0];
                        const marker = markers.find(m => m.id === markerData.properties?.id);
                        if (marker) {
                          handleMarkerPress(marker);
                        }
                      }
                    }}
                  >
                    <CircleLayer
                      id="parking-clusters"
                      filter={['has', 'point_count']}
                      style={{
                        circleRadius: 12,
                        circleColor: [
                          'step',
                          ['get', 'point_count'],
                          '#059669', 10,
                          '#059669', 50,
                          '#059669', 100,
                          '#059669'
                        ],
                        circleStrokeColor: '#FFFFFF',
                        circleStrokeWidth: 2,
                      }}
                    />

                    <SymbolLayer
                      id="parking-cluster-count"
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
                      id="parking-unclustered"
                      filter={['!', ['has', 'point_count']]}
                      style={{
                        circleRadius: 12,
                        circleColor: '#059669',
                        circleStrokeColor: '#FFFFFF',
                        circleStrokeWidth: 2,
                      }}
                    />
                    
                    <SymbolLayer
                      id="parking-marker-text"
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

                {/* Repair Station Markers */}
                {filteredMarkers.filter(m => m.type === 'repairStation').length > 0 && (
                  <ShapeSource
                    id="repair-markers"
                    shape={convertMarkersToGeoJSON(filteredMarkers.filter(m => m.type === 'repairStation'))}
                    cluster={true}
                    clusterRadius={50}
                    clusterMaxZoom={14}
                    onPress={(feature) => {
                      if (feature.features && feature.features.length > 0) {
                        const markerData = feature.features[0];
                        const marker = markers.find(m => m.id === markerData.properties?.id);
                        if (marker) {
                          handleMarkerPress(marker);
                        }
                      }
                    }}
                  >
                    <CircleLayer
                      id="repair-clusters"
                      filter={['has', 'point_count']}
                      style={{
                        circleRadius: 12,
                        circleColor: [
                          'step',
                          ['get', 'point_count'],
                          '#1D4ED8', 10,
                          '#1D4ED8', 50,
                          '#1D4ED8', 100,
                          '#1D4ED8'
                        ],
                        circleStrokeColor: '#FFFFFF',
                        circleStrokeWidth: 2,
                      }}
                    />

                    <SymbolLayer
                      id="repair-cluster-count"
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
                      id="repair-unclustered"
                      filter={['!', ['has', 'point_count']]}
                      style={{
                        circleRadius: 12,
                        circleColor: '#1D4ED8',
                        circleStrokeColor: '#FFFFFF',
                        circleStrokeWidth: 2,
                      }}
                    />
                    
                    <SymbolLayer
                      id="repair-marker-text"
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

                {/* Bicycle Service Markers */}
                {filteredMarkers.filter(m => m.type === 'bicycleService').length > 0 && (
                  <ShapeSource
                    id="bicycle-service-markers"
                    shape={convertMarkersToGeoJSON(filteredMarkers.filter(m => m.type === 'bicycleService'))}
                    cluster={true}
                    clusterRadius={50}
                    clusterMaxZoom={14}
                    onPress={(feature) => {
                      if (feature.features && feature.features.length > 0) {
                        const markerData = feature.features[0];
                        const marker = markers.find(m => m.id === markerData.properties?.id);
                        if (marker) {
                          handleMarkerPress(marker);
                        }
                      }
                    }}
                  >
                    <CircleLayer
                      id="bicycle-service-clusters"
                      filter={['has', 'point_count']}
                      style={{
                        circleRadius: 12,
                        circleColor: [
                          'step',
                          ['get', 'point_count'],
                          '#F97316', 10,
                          '#F97316', 50,
                          '#F97316', 100,
                          '#F97316'
                        ],
                        circleStrokeColor: '#FFFFFF',
                        circleStrokeWidth: 2,
                      }}
                    />

                    <SymbolLayer
                      id="bicycle-service-cluster-count"
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
                      id="bicycle-service-unclustered"
                      filter={['!', ['has', 'point_count']]}
                      style={{
                        circleRadius: 12,
                        circleColor: '#F97316',
                        circleStrokeColor: '#FFFFFF',
                        circleStrokeWidth: 2,
                      }}
                    />
                    
                    <SymbolLayer
                      id="bicycle-service-marker-text"
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
        </ShapeSource>
        )}
      </MapView>

      {/* Settings Button - top right */}
      <View style={styles.fabGroupTopRight}>
        <TouchableOpacity
          style={[styles.fab, {
            backgroundColor: cardBackground,
            shadowColor,
            borderColor: borderColor,
            borderWidth: 1
          }]}
          onPress={() => setShowSettingsModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="options" size={22} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Recenter button */}
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

      {/* Search Button - appears when user moves map away from their location */}
      {showSearchButton && (
        <View style={styles.fabGroupTopCenter}>
          <TouchableOpacity
            style={[styles.searchButton, {
              backgroundColor: '#3B82F6',
              shadowColor,
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }]}
            onPress={handleSearchAtCurrentLocation}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
            )}
            <ThemedText style={[styles.searchButtonText, { color: '#fff' }]}>
              {loading ? 'Searching...' : 'Search'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* List View Button */}
      <View style={styles.fabGroupBottomCenter}>
        <TouchableOpacity
          style={[styles.fabWide, {
            backgroundColor: cardBackground,
            shadowColor,
            borderColor: borderColor,
            borderWidth: 1
          }]}
          onPress={() => {
            setListFilter('all');
            openModal();
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="list" size={18} color={textColor} style={{ marginRight: 8 }} />
          <ThemedText style={[styles.fabWideText, { color: textColor }]}>Lista nézet</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Selected Marker Flyout */}
      {selectedMarker && (
        <View style={[styles.flyoutContainer, { 
          backgroundColor: cardBackground,
          borderColor: borderColor,
          shadowColor,
          padding: 0,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 16,
          bottom: 120,
        }]}>
          <View style={[styles.flyoutHeader, { 
            backgroundColor: selectedMarker.type === 'parking' ? 'rgba(5, 150, 105, 0.15)' : 
                           selectedMarker.type === 'bicycleService' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(29, 78, 216, 0.15)',
            borderBottomColor: selectedMarker.type === 'parking' ? 'rgba(5, 150, 105, 0.2)' : 
                              selectedMarker.type === 'bicycleService' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(29, 78, 216, 0.2)',
            paddingBottom: 12,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }]}>
            <View style={styles.flyoutTitleRow}>
              <View style={[styles.flyoutIcon, { 
                backgroundColor: selectedMarker.type === 'parking' ? '#059669' : 
                               selectedMarker.type === 'bicycleService' ? '#F97316' : '#1D4ED8',
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }]}>
                <Ionicons 
                  name={selectedMarker.type === 'parking' ? 'bicycle' : 
                        selectedMarker.type === 'bicycleService' ? 'storefront' : 'build'} 
                  size={20} 
                  color="#fff" 
                />
              </View>
              <View style={styles.flyoutTitleContainer}>
                <ThemedText style={[styles.flyoutTitle, { color: textColor }]}>
                  {selectedMarker.title}
                </ThemedText>
                <View style={styles.flyoutSubtitleRow}>
                  <View style={[styles.statusDot, { 
                    backgroundColor: selectedMarker.available ? '#22C55E' : '#EF4444' 
                  }]} />
                  <ThemedText style={[styles.flyoutSubtitle, { color: textColor }]}>
                    {selectedMarker.description}
                  </ThemedText>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={closeFlyout} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={[styles.flyoutContent, { paddingBottom: 20 }]}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  {
                    backgroundColor: isFavourite(selectedMarker.id)
                      ? "#FFD700"
                      : "#fff",
                    borderWidth: 2,
                    borderColor: "#FFD700",
                    width: 54,
                    height: 44,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    margin: 0,
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  },
                ]}] 
                activeOpacity={0.85}
                onPress={() => handleFavouriteToggle(selectedMarker)}
              >
                <Ionicons 
                  name={isFavourite(selectedMarker.id) ? "star" : "star-outline"} 
                  size={20} 
                  color={isFavourite(selectedMarker.id) ? "#fff" : "#FFD700"} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButtonModern, {
                  backgroundColor: '#fff',
                  borderWidth: 2,
                  borderColor: '#3B82F6',
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }]} 
                activeOpacity={0.85}
                onPress={handleDirections}
              >
                <Ionicons name="navigate" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
                <ThemedText style={[styles.actionButtonModernText, { color: '#3B82F6' }]}>Navigáció</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* List Modal */}
      <Modal
        visible={showListModal}
        animationType="none"
        transparent
        onRequestClose={closeModal}
      >
        <Animated.View
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.25)', 
            justifyContent: 'flex-end',
            opacity: backgroundOpacity
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={closeModal}
          />
          <Animated.View
            style={{ 
              backgroundColor: cardBackground, 
              borderTopLeftRadius: 18, 
              borderTopRightRadius: 18, 
              padding: 20, 
              height: '65%',
              minHeight: 400,
              transform: [{ translateY: modalAnim }]
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={(e) => e.stopPropagation()}
            >
            <View style={{ marginBottom: 16 }}>
              <FlatList
                data={[
                  { key: 'all', label: 'All' },
                  { key: 'parking', label: 'Parking' },
                  { key: 'repairStation', label: 'Repair' },
                  { key: 'bicycleService', label: 'Shops' },
                ]}
                keyExtractor={(item) => item.key}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ 
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexGrow: 1,
                }}
                renderItem={({ item: f }) => (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => {
                      setListFilter(f.key as 'all' | 'parking' | 'repairStation' | 'bicycleService');
                    }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 20,
                      borderRadius: 22,
                      marginHorizontal: 6,
                      backgroundColor: listFilter === f.key ? '#3B82F6' : '#E5E7EB',
                      minWidth: 80,
                      alignItems: 'center',
                    }}
                    activeOpacity={0.85}
                  >
                    <ThemedText style={{ 
                      color: listFilter === f.key ? '#fff' : '#222', 
                      fontWeight: '600', 
                      fontSize: 14,
                      textAlign: 'center',
                    }}>
                      {f.label}
         </ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
            <ThemedText style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, textAlign: 'center', color: textColor }}>Nearby Places</ThemedText>
            <FlatList
              data={listFilteredMarkers}
              keyExtractor={item => item.id}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleListItemPress(item)}
                  style={({ pressed }) => [{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: borderColor,
                    backgroundColor: pressed ? '#e5e7eb55' : 'transparent',
                    borderRadius: 8,
                  }]}
                >
                  <View style={{
                    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    backgroundColor: item.type === 'parking' ? '#D1FAE5' : item.type === 'bicycleService' ? '#FED7AA' : '#DBEAFE',
                  }}>
                    <Ionicons name={item.type === 'parking' ? 'bicycle' : item.type === 'bicycleService' ? 'storefront' : 'build'} size={18} color={item.type === 'parking' ? '#059669' : item.type === 'bicycleService' ? '#F97316' : '#1D4ED8'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: '600', fontSize: 15, color: textColor }}>{item.title}</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: '#666' }}>
                      {item.type === 'parking' ? 'Parking' : item.type === 'bicycleService' ? 'Bike Shop' : 'Repair'} • {item.available ? 'Open' : 'Closed'}
         </ThemedText>
       </View>
                  {userLocation && item.distance !== undefined && (
                    <ThemedText style={{ fontSize: 13, color: '#3B82F6', fontWeight: '500', marginLeft: 8 }}>{(item.distance / 1000).toFixed(2)} km</ThemedText>
                  )}
                </Pressable>
              )}
              ListEmptyComponent={<ThemedText style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>No places available.</ThemedText>}
            />
            <TouchableOpacity onPress={closeModal} style={{ marginTop: 18, alignSelf: 'center', padding: 10 }}>
              <ThemedText style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 16 }}>Close</ThemedText>
            </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <Pressable
            style={styles.filterModalOverlayPress}
            onPress={() => setShowSettingsModal(false)}
          />
          <View style={[styles.filterModalContent, { backgroundColor: cardBackground }]}>
            <View style={styles.filterModalHeader}>
              <ThemedText style={[styles.filterModalTitle, { color: textColor }]}>
                Map Settings
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowSettingsModal(false)}
                style={styles.filterModalClose}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <ThemedText style={[styles.filterSectionTitle, { color: textColor }]}>
                Displayed Places
              </ThemedText>
              
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setMarkerFilters(prev => ({ ...prev, parking: !prev.parking }))}
              >
                <View style={[styles.filterOptionIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="bicycle" size={20} color="#059669" />
                </View>
                <ThemedText style={[styles.filterOptionText, { color: textColor }]}>
                  Bicycle Parking
                </ThemedText>
                <View style={[styles.checkbox, markerFilters.parking && styles.checkboxChecked]}>
                  {markerFilters.parking && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setMarkerFilters(prev => ({ ...prev, repairStation: !prev.repairStation }))}
              >
                <View style={[styles.filterOptionIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="build" size={20} color="#1D4ED8" />
                </View>
                <ThemedText style={[styles.filterOptionText, { color: textColor }]}>
                  Repair Stations
                </ThemedText>
                <View style={[styles.checkbox, markerFilters.repairStation && styles.checkboxChecked]}>
                  {markerFilters.repairStation && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setMarkerFilters(prev => ({ ...prev, bicycleService: !prev.bicycleService }))}
              >
                <View style={[styles.filterOptionIcon, { backgroundColor: '#FED7AA' }]}>
                  <Ionicons name="storefront" size={20} color="#F97316" />
                </View>
                <ThemedText style={[styles.filterOptionText, { color: textColor }]}>
                  Bicycle Shops
                </ThemedText>
                <View style={[styles.checkbox, markerFilters.bicycleService && styles.checkboxChecked]}>
                  {markerFilters.bicycleService && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <ThemedText style={[styles.filterSectionTitle, { color: textColor }]}>
                Map View
              </ThemedText>
              
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setMapType('standard')}
              >
                <View style={[styles.filterOptionIcon, { backgroundColor: '#E5E7EB' }]}>
                  <Ionicons name="map" size={20} color="#6B7280" />
                </View>
                <ThemedText style={[styles.filterOptionText, { color: textColor }]}>
                  Street Map
                </ThemedText>
                <View style={[styles.checkbox, mapType === 'standard' && styles.checkboxChecked]}>
                  {mapType === 'standard' && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setMapType('hybrid')}
              >
                <View style={[styles.filterOptionIcon, { backgroundColor: '#E5E7EB' }]}>
                  <Ionicons name="globe" size={20} color="#6B7280" />
                </View>
                <ThemedText style={[styles.filterOptionText, { color: textColor }]}>
                  Satellite View
                </ThemedText>
                <View style={[styles.checkbox, mapType === 'hybrid' && styles.checkboxChecked]}>
                  {mapType === 'hybrid' && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.filterApplyButton, { backgroundColor: '#3B82F6' }]}
              onPress={() => setShowSettingsModal(false)}
            >
              <ThemedText style={styles.filterApplyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  fabGroupTopRight: {
    position: 'absolute',
    top: 60,
    right: 18,
    zIndex: 20,
  },
  fabGroupTopCenter: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  fabGroupBottomCenter: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  fabGroupBottomRight: {
    position: 'absolute',
    bottom: 100,
    right: 18,
    zIndex: 20,
  },
  fabWide: {
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 120,
    maxWidth: 180,
  },
  fabWideText: {
    fontWeight: '500',
    fontSize: 16,
  },
  searchButton: {
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 120,
  },
  searchButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  flyoutContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: 280,
    overflow: 'hidden',
  },
  flyoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  flyoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  flyoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flyoutTitleContainer: {
    flex: 1,
  },
  flyoutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  flyoutSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flyoutSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  flyoutContent: {
    padding: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -25,
  },
  actionButtonModern: {
    paddingVertical: 2,
    paddingHorizontal: 0,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 44,
    minWidth: 0,
    marginTop: 8,
  },
  actionButtonModernText: {
    fontWeight: '700',
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.1,
  },
  fab: {
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  filterModalOverlayPress: {
    flex: 1,
  },
  filterModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterModalClose: {
    padding: 4,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  filterOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  filterOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterApplyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  filterApplyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 