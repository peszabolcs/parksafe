import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, Platform, Modal, FlatList } from 'react-native';import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

import { useFocusEffect } from '@react-navigation/native';


// Sample data for bicycle storage locations in Szeged
const bikeStorageLocations = [
  { id: '1', name: 'Szegedi Főtér Biciklitároló', coordinates: { latitude: 46.254, longitude: 20.148 }, rating: '4.5', capacity: '28/40', secured: true },
  { id: '2', name: 'Mars téri Biciklitároló', coordinates: { latitude: 46.259, longitude: 20.153 }, rating: '4.2', capacity: '12/25', secured: true },
  { id: '3', name: 'Árkád Biciklitároló', coordinates: { latitude: 46.253, longitude: 20.141 }, rating: '4.0', capacity: '8/15', secured: false },
  { id: '4', name: 'Dugonics téri Biciklitároló', coordinates: { latitude: 46.251, longitude: 20.145 }, rating: '4.3', capacity: '19/30', secured: true },
  { id: '5', name: 'Napfényfürdő Biciklitároló', coordinates: { latitude: 46.260, longitude: 20.159 }, rating: '4.7', capacity: '14/20', secured: true },
];

// Sample data for service centers in Szeged
const serviceLocations = [
  { id: '1', name: 'Szegedi Bringaszerviz', coordinates: { latitude: 46.256, longitude: 20.146 }, rating: '4.8', openNow: true },
  { id: '2', name: 'BringaDoktor Szeged', coordinates: { latitude: 46.249, longitude: 20.144 }, rating: '4.7', openNow: true },
  { id: '3', name: 'KerékSzerelde Szeged', coordinates: { latitude: 46.258, longitude: 20.138 }, rating: '4.4', openNow: false },
  { id: '4', name: 'BikeTime Szeged', coordinates: { latitude: 46.262, longitude: 20.152 }, rating: '4.6', openNow: true },
];

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const mapRef = useRef<MapView | null>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 46.2530,
    longitude: 20.1414,
    latitudeDelta: 0.02,
    longitudeDelta: 0.01,
  });
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [listViewVisible, setListViewVisible] = useState(false);
  const [listFilter, setListFilter] = useState('all');

  useFocusEffect(
      React.useCallback(() => {
        // This runs when the screen comes into focus
        if (location && mapLoaded) {
          goToMyLocation();
        }
      }, [location, mapLoaded])
  );

  useEffect(() => {
    console.log('Map component initialized');

    if (Platform.OS === 'android') {
      console.log('Running on Android platform');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Hely hozzáférés megtagadva');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        console.log('Location obtained:', location.coords.latitude, location.coords.longitude);
      } catch (error) {
        setErrorMsg('Nem sikerült lekérni a helyadatokat');
        console.error('Location error:', error);
      }
    })();
  }, []);

  const filteredLocations = () => {
    switch(selectedFilter) {
      case 'storage':
        return bikeStorageLocations;
      case 'service':
        return serviceLocations;
      default:
        return [...bikeStorageLocations, ...serviceLocations];
    }
  };

  // Handle map ready event
  const onMapReady = () => {
    setMapLoaded(true);
    goToMyLocation()
    console.log('Map is ready and loaded');
  };

  // Function to center map on user's current location
  const goToMyLocation = () => {
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  return (
      <View style={styles.container}>
        {errorMsg && (
            <ThemedView style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
            </ThemedView>
        )}

        <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={false} // Hide default button
            showsCompass={true}
            onMapReady={onMapReady}
            provider="google"
            mapType="standard"
            onRegionChangeComplete={(region) => setMapRegion(region)}
        >
          {filteredLocations().map((marker) => {
            const isBikeStorage = 'capacity' in marker;
            return (
                <Marker
                    key={`${isBikeStorage ? 'storage' : 'service'}-${marker.id}`}
                    coordinate={marker.coordinates}
                    title={marker.name}
                    description={isBikeStorage
                        ? `Kapacitás: ${marker.capacity} | Értékelés: ${marker.rating}★`
                        : `${marker.openNow ? 'Nyitva' : 'Zárva'} | Értékelés: ${marker.rating}★`}
                    pinColor={isBikeStorage ? 'green' : 'blue'}
                    onPress={() => setSelectedMarker(marker)}
                />
            );
          })}
        </MapView>

        {/* Filter buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: colorScheme === 'dark' ? 'rgba(60, 60, 60, 0.9)' : 'rgba(255, 255, 255, 0.9)' },
                selectedFilter === 'all' ? { backgroundColor: 'white' } : { opacity: 0.8 }
              ]}
              onPress={() => setSelectedFilter('all')}
          >
            <ThemedText style={[
              styles.filterText,
              selectedFilter === 'all' ? { color: 'black' } : { color: colorScheme === 'dark' ? 'white' : colors.text }
            ]}>Összes</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: colorScheme === 'dark' ? 'rgba(60, 60, 60, 0.9)' : 'rgba(255, 255, 255, 0.9)' },
                selectedFilter === 'storage' ? { backgroundColor: '#4CAF50' } : { opacity: 0.8 }
              ]}
              onPress={() => setSelectedFilter('storage')}
          >
            <Ionicons
                name="bicycle"
                size={16}
                color={selectedFilter === 'storage'
                    ? 'white'
                    : colorScheme === 'dark' ? 'white' : colors.text
                }
            />
            <ThemedText style={[
              styles.filterText,
              selectedFilter === 'storage'
                  ? { color: 'white' }
                  : { color: colorScheme === 'dark' ? 'white' : colors.text }
            ]}>Tárolók</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: colorScheme === 'dark' ? 'rgba(60, 60, 60, 0.9)' : 'rgba(255, 255, 255, 0.9)' },
                selectedFilter === 'service' ? { backgroundColor: '#2196F3' } : { opacity: 0.8 }
              ]}
              onPress={() => setSelectedFilter('service')}
          >
            <Ionicons
                name="construct"
                size={16}
                color={selectedFilter === 'service'
                    ? 'white'
                    : colorScheme === 'dark' ? 'white' : colors.text
                }
            />
            <ThemedText style={[
              styles.filterText,
              selectedFilter === 'service'
                  ? { color: 'white' }
                  : { color: colorScheme === 'dark' ? 'white' : colors.text }
            ]}>Szervizek</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Selected Location Info */}
        {selectedMarker && (
            <ThemedView style={[
              styles.selectedLocationContainer,
              { backgroundColor: colorScheme === 'dark' ? '#222' : 'white' }
            ]}>
              <View style={styles.selectedLocationHeader}>
                <ThemedText type="defaultSemiBold">{selectedMarker.name}</ThemedText>
                <TouchableOpacity onPress={() => setSelectedMarker(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.selectedLocationDetails}>
                {'capacity' in selectedMarker ? (
                    <>
                      <View style={styles.detailItem}>
                        <Ionicons name="people-outline" size={16} color={colors.text} />
                        <ThemedText style={styles.detailText}>Kapacitás: {selectedMarker.capacity}</ThemedText>
                      </View>
                      {selectedMarker.secured && (
                          <View style={styles.detailItem}>
                            <Ionicons name="shield-checkmark-outline" size={16} color="#4CAF50" />
                            <ThemedText style={styles.detailText}>Védett tárolóhely</ThemedText>
                          </View>
                      )}
                    </>
                ) : (
                    <>
                      <View style={styles.detailItem}>
                        <Ionicons
                            name="time-outline"
                            size={16}
                            color={selectedMarker.openNow ? "#4CAF50" : "#F44336"}
                        />
                        <ThemedText style={[
                          styles.detailText,
                          { color: selectedMarker.openNow ? "#4CAF50" : "#F44336" }
                        ]}>
                          {selectedMarker.openNow ? "Nyitva" : "Zárva"}
                        </ThemedText>
                      </View>
                    </>
                )}
                <View style={styles.detailItem}>
                  <Ionicons name="star" size={16} color="#FFC107" />
                  <ThemedText style={styles.detailText}>{selectedMarker.rating}★</ThemedText>
                </View>
              </View>

              <TouchableOpacity style={[
                styles.detailsButton,
                { backgroundColor: '#2196F3' }
              ]}>
                <ThemedText style={{ color: 'white', fontWeight: '600' }}>Részletek megtekintése</ThemedText>
              </TouchableOpacity>
            </ThemedView>
        )}

        {/* List view button */}
        <TouchableOpacity
            style={[
              styles.listViewButton,
              { backgroundColor: colorScheme === 'dark' ? '#222' : 'white' }
            ]}
            onPress={() => setListViewVisible(true)}
        >
          <Ionicons name="list" size={20} color={colors.text} />
          <ThemedText style={styles.listViewText}>Lista nézet</ThemedText>
        </TouchableOpacity>

        {/* List View Modal */}
        <Modal
            visible={listViewVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setListViewVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setListViewVisible(false)}>
            <View style={styles.modalContainer}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <ThemedView style={[
                  styles.modalContent,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#222' : '#fff',
                    borderTopColor: colorScheme === 'dark' ? '#333' : '#eee',
                  }
                ]}>
                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Helyek listája</ThemedText>
                    <TouchableOpacity onPress={() => setListViewVisible(false)}>
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Filter buttons */}
                  <View style={styles.modalFilterContainer}>
                    <TouchableOpacity
                        style={[
                          styles.modalFilterButton,
                          listFilter === 'all' ? { backgroundColor: "azure" } : {}
                        ]}
                        onPress={() => setListFilter('all')}
                    >
                      <ThemedText style={[
                        styles.modalFilterText,
                        listFilter === 'all' ? { color: 'black' } : { color: colors.text }
                      ]}>Összes</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                          styles.modalFilterButton,
                          listFilter === 'storage' ? { backgroundColor: '#4CAF50' } : {}
                        ]}
                        onPress={() => setListFilter('storage')}
                    >
                      <Ionicons name="bicycle" size={16} color={listFilter === 'storage' ? 'white' : colors.text} />
                      <ThemedText style={[
                        styles.modalFilterText,
                        listFilter === 'storage' ? { color: 'white' } : {}
                      ]}>Tárolók</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                          styles.modalFilterButton,
                          listFilter === 'service' ? { backgroundColor: '#2196F3' } : {}
                        ]}
                        onPress={() => setListFilter('service')}
                    >
                      <Ionicons name="construct" size={16} color={listFilter === 'service' ? 'white' : colors.text} />
                      <ThemedText style={[
                        styles.modalFilterText,
                        listFilter === 'service' ? { color: 'white' } : {}
                      ]}>Szervizek</ThemedText>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                      data={listFilter === 'storage' ? bikeStorageLocations :
                          listFilter === 'service' ? serviceLocations :
                              [...bikeStorageLocations, ...serviceLocations]}
                      keyExtractor={(item) => (item.id + (('capacity' in item) ? '-storage' : '-service'))}
                      renderItem={({ item }) => {
                        const isBikeStorage = 'capacity' in item;
                        return (
                            <TouchableOpacity
                                style={styles.listItem}
                                onPress={() => {
                                  setSelectedMarker(item);
                                  setListViewVisible(false);
                                  mapRef.current?.animateToRegion({
                                    latitude: item.coordinates.latitude,
                                    longitude: item.coordinates.longitude,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                  }, 1000);
                                }}
                            >
                              <View style={styles.listItemContent}>
                                <View style={[
                                  styles.listItemIcon,
                                  { backgroundColor: isBikeStorage ? '#4CAF50' : '#2196F3' }
                                ]}>
                                  <Ionicons
                                      name={isBikeStorage ? "bicycle" : "construct"}
                                      size={20}
                                      color="white"
                                  />
                                </View>

                                <View style={styles.listItemDetails}>
                                  <ThemedText style={styles.listItemTitle}>{item.name}</ThemedText>

                                  <View style={styles.listItemInfo}>
                                    {/* Item info remains the same */}
                                  </View>
                                </View>

                                <Ionicons name="chevron-forward" size={20} color={colors.text} />
                              </View>
                            </TouchableOpacity>
                        );
                      }}
                      contentContainerStyle={styles.listContainer}
                  />
                </ThemedView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>




        {/* Custom My Location Button */}
        <TouchableOpacity
            style={[
              styles.currentLocationButton,
              { backgroundColor: colorScheme === 'dark' ? '#222' : 'white' }
            ]}
            onPress={goToMyLocation}
        >
          <Ionicons name="locate" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
    backgroundColor: '#FF5252',
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
  filterContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listViewButton: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: [{ translateX: -60 }],
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    gap: 8,
  },
  listViewText: {
    fontWeight: '600',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  szegedButton: {
    position: 'absolute',
    bottom: 85,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedLocationContainer: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedLocationDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  detailText: {
    fontSize: 14,
  },
  detailsButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalFilterContainer: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  modalFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemDetails: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  listItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 13,
  }
});