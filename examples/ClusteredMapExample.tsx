import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { ClusteredMapView } from '../components/ClusteredMapView';
import { OptimizedClusteredMap } from '../components/OptimizedClusteredMap';
import { ClusterPoint } from '../hooks/useSupercluster';
import { testWKBParser } from '../lib/wkbParser';

// Sample data structure matching your PostgreSQL database
const sampleData = [
  {
    id: '1',
    wkb: '0101000020E6100000D735B5C766123340F9A3A833F7BF4740',
    name: 'Location 1',
    type: 'restaurant',
  },
  {
    id: '2', 
    wkb: '0101000020E6100000A245B5C766123340E8A3A833F7BF4740',
    name: 'Location 2',
    type: 'store',
  },
  // Add more sample data as needed...
];

const initialRegion: Region = {
  latitude: 47.4979,
  longitude: 19.0402, // Budapest coordinates
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const ClusteredMapExample: React.FC = () => {
  const [region, setRegion] = useState(initialRegion);
  const [useOptimized, setUseOptimized] = useState(true);
  const mapRef = useRef<MapView>(null);

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleMarkerPress = (point: ClusterPoint) => {
    console.log('Marker pressed:', point.properties);
    // Handle individual marker press
  };

  const handleClusterPress = (cluster: ClusterPoint) => {
    console.log('Cluster pressed:', cluster.properties.point_count, 'points');
    // Additional cluster press handling
  };

  // Custom marker renderer (optional)
  const renderCustomMarker = (point: ClusterPoint) => {
    const [longitude, latitude] = point.geometry.coordinates;
    const markerType = point.properties.type;
    
    return (
      <MapView.Marker
        key={point.properties.id}
        coordinate={{ latitude, longitude }}
        onPress={() => handleMarkerPress(point)}
      >
        <View style={[
          styles.customMarker,
          { backgroundColor: markerType === 'restaurant' ? '#FF6B6B' : '#4ECDC4' }
        ]}>
          <Text style={styles.markerText}>
            {markerType === 'restaurant' ? '🍽️' : '🏪'}
          </Text>
        </View>
      </MapView.Marker>
    );
  };

  // Test WKB parser
  React.useEffect(() => {
    testWKBParser();
  }, []);

  const ClusterComponent = useOptimized ? OptimizedClusteredMap : ClusteredMapView;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
      >
        <ClusterComponent
          data={sampleData}
          region={region}
          onRegionChange={handleRegionChange}
          onMarkerPress={handleMarkerPress}
          onClusterPress={handleClusterPress}
          mapRef={mapRef}
          clusterColor="#FF6B6B"
          markerColor="#4ECDC4"
          renderIndividualMarker={renderCustomMarker}
          clusterOptions={{
            radius: 60,
            maxZoom: 15,
            minZoom: 0,
            minPoints: 2,
          }}
          // Optimization options (for OptimizedClusteredMap)
          maxMarkersToRender={300}
          enableClustering={true}
          debounceMs={100}
        />
      </MapView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setUseOptimized(!useOptimized)}
        >
          <Text style={styles.buttonText}>
            {useOptimized ? 'Use Basic' : 'Use Optimized'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  customMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerText: {
    fontSize: 16,
  },
});

export default ClusteredMapExample;