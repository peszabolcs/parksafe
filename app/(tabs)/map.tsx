import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Platform, Alert, Linking, Modal, FlatList, Text, Pressable } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker, Callout } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemeStore } from '@/stores/themeStore';
import { useLocationStore } from '@/stores/locationStore';
import { MapMarker, getDistance } from '@/lib/markers';
import { useLocalSearchParams } from 'expo-router';

const INITIAL_REGION = {
  latitude: 46.2530,
  longitude: 20.1484,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];

const LIGHT_MAP_STYLE: any[] = [];

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [listFilter, setListFilter] = useState<'all' | 'parking' | 'repair'>('all');

  const { userLocation, markers, loading } = useLocationStore();
  const { currentTheme } = useThemeStore();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const shadowColor = useThemeColor({ light: '#000', dark: '#000' }, 'text');

  const isDarkMode = currentTheme === 'dark';
  const params = useLocalSearchParams();

  const filteredMarkers = useMemo(() => {
    if (listFilter === 'all') return markers;
    if (listFilter === 'repair') return markers.filter(m => m.type === 'repairStation');
    return markers.filter(m => m.type === listFilter);
  }, [markers, listFilter]);

  useEffect(() => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [userLocation]);

  useEffect(() => {
    if (params.selectedMarkerId && markers.length > 0) {
      const selectedMarker = markers.find(m => m.id === params.selectedMarkerId);
      if (selectedMarker) {
        setSelectedMarker(selectedMarker);
        
        const newRegion = {
          latitude: selectedMarker.coordinate.latitude,
          longitude: selectedMarker.coordinate.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
      }
    }
  }, [params.selectedMarkerId, markers]);

  useEffect(() => {
    if (params.openList) {
      setShowListModal(true);
      setTimeout(() => {
        setListFilter('all');
      }, 100);
    }
  }, [params.openList]);

  const recenter = useCallback(async () => {
    if (!userLocation) {
      Alert.alert('Helymeghatározás', 'A helymeghatározás nincs elérhető.');
      return;
    }
    
    const newRegion = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    mapRef.current?.animateToRegion(newRegion, 500);
  }, [userLocation]);

  const handleMarkerPress = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
    
    const newRegion = {
      latitude: marker.coordinate.latitude,
      longitude: marker.coordinate.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    
    mapRef.current?.animateToRegion(newRegion, 500);
  }, []);

  const closeFlyout = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const handleDirections = useCallback(() => {
    if (selectedMarker) {
      const { latitude, longitude } = selectedMarker.coordinate;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      
      Linking.openURL(url).catch(() => {
        Alert.alert('Hiba', 'Nem sikerült megnyitni a navigációt.');
      });
    }
  }, [selectedMarker]);

  const handleListItemPress = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
    setShowListModal(false);
    
    const newRegion = {
      latitude: marker.coordinate.latitude,
      longitude: marker.coordinate.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    mapRef.current?.animateToRegion(newRegion, 500);
  }, []);

  const renderMarker = useCallback((marker: MapMarker) => {
    const isParking = marker.type === 'parking';
    const iconName = isParking ? 'bicycle' : 'build';
    const iconColor = isParking ? '#22C55E' : '#3B82F6';
    const backgroundColor = isParking ? '#DCFCE7' : '#DBEAFE';
    const isSelected = selectedMarker?.id === marker.id;
    const markerBorderColor = isDarkMode ? '#fff' : '#000';

    return (
      <Marker
        key={marker.id}
        coordinate={marker.coordinate}
        title={marker.title}
        description={marker.description}
        onPress={() => handleMarkerPress(marker)}
        tracksViewChanges={true}
      >
        <View style={[
          styles.markerContainer, 
          { 
            backgroundColor,
            borderColor: markerBorderColor,
            borderWidth: isSelected ? 3 : 2,
            transform: [{ scale: isSelected ? 1.2 : 1 }]
          }
        ]}>
          <Ionicons name={iconName as any} size={16} color={iconColor} />
        </View>
      </Marker>
    );
  }, [selectedMarker, isDarkMode, handleMarkerPress]);

  // Memoize markers to reduce re-renders
  const renderedMarkers = useMemo(() => {
    return markers.map(renderMarker);
  }, [markers, renderMarker]);

  if (loading && markers.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}    
          toolbarEnabled={false}
          customMapStyle={isDarkMode ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
          mapType="standard"
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
        />
        
        <View style={[styles.loadingOverlay, { backgroundColor: backgroundColor + '90' }]}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>
            Helyek betöltése...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}    
        toolbarEnabled={false}
        customMapStyle={isDarkMode ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
        mapType="standard"
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
      >
        {renderedMarkers}
      </MapView>

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
        }]}>
          <View style={[styles.flyoutHeader, { 
            backgroundColor: selectedMarker.type === 'parking' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            borderBottomColor: selectedMarker.type === 'parking' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            paddingBottom: 12,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }]}>
            <View style={styles.flyoutTitleRow}>
              <View style={[styles.flyoutIcon, { 
                backgroundColor: selectedMarker.type === 'parking' ? '#22C55E' : '#3B82F6',
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }]}>
                <Ionicons 
                  name={selectedMarker.type === 'parking' ? 'bicycle' : 'build'} 
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
            {selectedMarker.type === 'parking' ? (
              <View style={styles.parkingDetails}>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                    <Ionicons name="bicycle" size={14} color="#22C55E" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>Biciklitároló</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                    <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>Biztonságos tárolás</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                    <Ionicons name="time" size={14} color="#22C55E" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>24/7 nyitva</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                    <Ionicons name="card" size={14} color="#22C55E" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>Ingyenes</ThemedText>
                </View>
              </View>
            ) : (
              <View style={styles.repairDetails}>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <Ionicons name="construct" size={14} color="#3B82F6" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>Teljes szerviz</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <Ionicons name="time" size={14} color="#3B82F6" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>H-P: 8:00-18:00</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <Ionicons name="call" size={14} color="#3B82F6" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>+36 62 123 4567</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <Ionicons name="star" size={14} color="#3B82F6" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>4.8/5 értékelés</ThemedText>
                </View>
              </View>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButtonModern, {
                  backgroundColor: selectedMarker.available ? '#22C55E' : '#EF4444',
                  flex: 1,
                  marginRight: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: selectedMarker.available ? 1 : 0.7,
                }]}
                activeOpacity={0.85}
              >
                <Ionicons name="eye" size={16} color="#fff" style={{ marginRight: 6 }} />
                <ThemedText style={styles.actionButtonModernText}>
                  {selectedMarker.available ? 'Megtekintés' : 'Nem elérhető'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButtonModern, {
                  backgroundColor: '#fff',
                  borderWidth: 2,
                  borderColor: '#3B82F6',
                  flex: 1,
                  marginLeft: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }]} 
                activeOpacity={0.85}
                onPress={handleDirections}
              >
                <Ionicons name="navigate" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
                <ThemedText style={[styles.actionButtonModernText, { color: '#3B82F6' }]}>Útvonal</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Modal
        visible={showListModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowListModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' }}
          onPress={() => setShowListModal(false)}
        >
          <Pressable
            style={{ backgroundColor: cardBackground, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, maxHeight: '60%' }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
              {[
                { key: 'all', label: 'Összes' },
                { key: 'parking', label: 'Parkolók' },
                { key: 'repair', label: 'Szervizek' },
              ].map(f => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => {
                    setListFilter('none' as any);
                    setTimeout(() => {
                      setListFilter(f.key as 'all' | 'parking' | 'repair');
                    }, 10);
                  }}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 18,
                    borderRadius: 20,
                    marginHorizontal: 6,
                    backgroundColor: listFilter === f.key ? '#3B82F6' : '#E5E7EB',
                  }}
                  activeOpacity={0.85}
                >
                  <ThemedText style={{ color: listFilter === f.key ? '#fff' : '#222', fontWeight: '600', fontSize: 14 }}>{f.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            <ThemedText style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, textAlign: 'center' }}>Közeli helyek</ThemedText>
            <FlatList
              data={filteredMarkers}
              keyExtractor={item => item.id}
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
                    backgroundColor: item.type === 'parking' ? '#DCFCE7' : '#DBEAFE',
                  }}>
                    <Ionicons name={item.type === 'parking' ? 'bicycle' : 'build'} size={18} color={item.type === 'parking' ? '#22C55E' : '#3B82F6'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: '600', fontSize: 15 }}>{item.title}</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: '#666' }}>{item.type === 'parking' ? 'Parkoló' : 'Szerviz'} • {item.available ? 'Nyitva' : 'Zárva'}</ThemedText>
                  </View>
                  {userLocation && item.distance !== undefined && (
                    <ThemedText style={{ fontSize: 13, color: '#3B82F6', fontWeight: '500', marginLeft: 8 }}>{(item.distance / 1000).toFixed(2)} km</ThemedText>
                  )}
                </Pressable>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>Nincs elérhető hely.</Text>}
            />
            <TouchableOpacity onPress={() => setShowListModal(false)} style={{ marginTop: 18, alignSelf: 'center', padding: 10 }}>
              <ThemedText style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 16 }}>Bezárás</ThemedText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.fabGroupBottomCenter}>
        <TouchableOpacity
          style={[styles.fabWide, {
            backgroundColor: cardBackground,
            shadowColor,
            borderColor: borderColor,
            borderWidth: 1
          }]}
          onPress={() => {
            setShowListModal(true);
            setTimeout(() => {
              setListFilter('all');
            }, 100);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="list" size={18} color={textColor} style={{ marginRight: 8 }} />
          <ThemedText style={[styles.fabWideText, { color: textColor }]}>Lista nézet</ThemedText>
        </TouchableOpacity>
      </View>
      
      <View style={styles.fabGroupBottomRight}>
        <TouchableOpacity 
          style={[styles.fab, { 
            backgroundColor: cardBackground, 
            shadowColor,
            borderColor: borderColor,
            borderWidth: 1
          }]} 
          onPress={recenter}
        >
          <Ionicons name="locate" size={22} color={textColor} />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  calloutContainer: {
    padding: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    marginBottom: 6,
    color: '#666',
  },
  statusIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 9,
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
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  flyoutContainer: {
    position: 'absolute',
    bottom: 100,
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
  parkingDetails: {
    marginBottom: 16,
  },
  repairDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
});

