import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Platform, Alert, Linking } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker, Callout } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/context/ThemeContext';
import * as Location from 'expo-location';

const INITIAL_REGION = {
  latitude: 46.2530, // Szeged coordinates
  longitude: 20.1484,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// Marker types
interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'parking' | 'repair';
  title: string;
  description: string;
  available: boolean;
}

// Generate static markers for Szeged
const generateMarkers = (): MapMarker[] => {
  const markers: MapMarker[] = [];

  // Static parking spots in Szeged
  const parkingSpots: MapMarker[] = [
    {
      id: 'parking-1',
      coordinate: { latitude: 46.2530, longitude: 20.1484 }, // Szeged center
      type: 'parking',
      title: 'Szeged Központi Parkoló',
      description: '12 szabad hely',
      available: true,
    },
    {
      id: 'parking-2',
      coordinate: { latitude: 46.2490, longitude: 20.1520 }, // Dugonics tér area
      type: 'parking',
      title: 'Dugonics tér Parkoló',
      description: '8 szabad hely',
      available: true,
    },
    {
      id: 'parking-3',
      coordinate: { latitude: 46.2570, longitude: 20.1440 }, // Széchenyi tér area
      type: 'parking',
      title: 'Széchenyi tér Parkoló',
      description: '15 szabad hely',
      available: true,
    },
    {
      id: 'parking-4',
      coordinate: { latitude: 46.2510, longitude: 20.1400 }, // Dóm tér area
      type: 'parking',
      title: 'Dóm tér Parkoló',
      description: '6 szabad hely',
      available: false,
    },
  ];

  // Static repair shops in Szeged
  const repairShops: MapMarker[] = [
    {
      id: 'repair-1',
      coordinate: { latitude: 46.2550, longitude: 20.1500 }, // Near center
      type: 'repair',
      title: 'Bike Service Szeged',
      description: 'Nyitva',
      available: true,
    },
    {
      id: 'repair-2',
      coordinate: { latitude: 46.2480, longitude: 20.1550 }, // South area
      type: 'repair',
      title: 'Bringa Szerviz Kft.',
      description: 'Nyitva',
      available: true,
    },
    {
      id: 'repair-3',
      coordinate: { latitude: 46.2600, longitude: 20.1420 }, // North area
      type: 'repair',
      title: 'Cycling Center',
      description: 'Zárva',
      available: false,
    },
    {
      id: 'repair-4',
      coordinate: { latitude: 46.2500, longitude: 20.1350 }, // West area
      type: 'repair',
      title: 'Bicikli Műhely',
      description: 'Nyitva',
      available: true,
    },
    {
      id: 'repair-5',
      coordinate: { latitude: 46.2560, longitude: 20.1580 }, // East area
      type: 'repair',
      title: 'Szeged Bike Repair',
      description: 'Nyitva',
      available: true,
    },
  ];

  return [...parkingSpots, ...repairShops];
};

// Dark mode map style for Google Maps
const DARK_MAP_STYLE: any[] = [
  {
    elementType: 'geometry',
    stylers: [
      {
        color: '#212121'
      }
    ]
  },
  {
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#212121'
      }
    ]
  },
  {
    elementType: 'labels.icon',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#757575'
      }
    ]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#212121'
      }
    ]
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [
      {
        color: '#757575'
      }
    ]
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#9e9e9e'
      }
    ]
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#bdbdbd'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#757575'
      }
    ]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [
      {
        color: '#181818'
      }
    ]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#616161'
      }
    ]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#1b1b1b'
      }
    ]
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#2c2c2c'
      }
    ]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#8a8a8a'
      }
    ]
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [
      {
        color: '#373737'
      }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [
      {
        color: '#3c3c3c'
      }
    ]
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [
      {
        color: '#4e4e4e'
      }
    ]
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#616161'
      }
    ]
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#757575'
      }
    ]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#000000'
      }
    ]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#3d3d3d'
      }
    ]
  }
];

// Light mode map style (default Google Maps style)
const LIGHT_MAP_STYLE: any[] = [];

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [zoom, setZoom] = useState(15);
  const [markers] = useState<MapMarker[]>(generateMarkers());
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // Theme context
  const { currentTheme } = useTheme();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const shadowColor = useThemeColor({ light: '#000', dark: '#000' }, 'text');

  // Determine if we're in dark mode - use theme context directly
  const isDarkMode = currentTheme === 'dark';

  // On mount, always fetch and set user's current location
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
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
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();
  }, []);

  async function recenter() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Helymeghatározás', 'A helymeghatározás nincs engedélyezve.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      console.log('Fetched location:', location.coords);
      // Add a tiny random value to latitudeDelta to force re-render
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005 ,
        longitudeDelta: 0.005 ,
      };
      //setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
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

  const handleMapReady = () => {
    console.log('Map is ready');
  };

  const handleMarkerPress = (marker: MapMarker) => {
    setSelectedMarker(marker);
    
    // Center map on the selected marker
    const newRegion = {
      latitude: marker.coordinate.latitude,
      longitude: marker.coordinate.longitude,
      latitudeDelta: 0.005, // Closer zoom
      longitudeDelta: 0.005,
    };
    
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  const closeFlyout = () => {
    setSelectedMarker(null);
  };

  const handleDirections = () => {
    if (selectedMarker) {
      const { latitude, longitude } = selectedMarker.coordinate;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      
      // Open in default browser or maps app
      Linking.openURL(url).catch(err => {
        Alert.alert('Hiba', 'Nem sikerült megnyitni a navigációt.');
      });
    }
  };

  const renderMarker = (marker: MapMarker) => {
    const isParking = marker.type === 'parking';
    const iconName = isParking ? 'bicycle' : 'build';
    const iconColor = isParking ? '#22C55E' : '#3B82F6';
    const backgroundColor = isParking ? '#DCFCE7' : '#DBEAFE';
    const isSelected = selectedMarker?.id === marker.id;

    // Set border color: always black in light theme, current logic in dark theme
    const markerBorderColor = isDarkMode ? (isSelected ? '#fff' : '#fff') : '#000';

    return (
      <Marker
        key={marker.id}
        coordinate={marker.coordinate}
        title={marker.title}
        description={marker.description}
        onPress={() => handleMarkerPress(marker)}
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
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        region={region}
        onRegionChangeComplete={setRegion}
        onMapReady={handleMapReady}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}    
        toolbarEnabled={false}
        customMapStyle={isDarkMode ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
        mapType="standard"
      >
        {markers.map(renderMarker)}
      </MapView>

      {/* Bottom Flyout */}
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
          {/* Header with stronger color and more padding */}
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

          {/* Content */}
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
            {/* Action Buttons - redesigned */}
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

      {/* Lista nézet Button (bottom center) */}
      <View style={styles.fabGroupBottomCenter}>
        <TouchableOpacity style={[styles.fabWide, { 
          backgroundColor: cardBackground, 
          shadowColor,
          borderColor: borderColor,
          borderWidth: 1
        }]}>
          <ThemedText style={[styles.fabWideText, { color: textColor }]}>Lista nézet</ThemedText>
        </TouchableOpacity>
      </View>
      {/* Recenter Button (bottom right) */}
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
});
