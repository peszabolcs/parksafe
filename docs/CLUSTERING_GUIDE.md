# React Native Map Clustering with SuperCluster

This guide explains how to implement map clustering using SuperCluster for React Native apps with Expo and PostgreSQL/PostGIS data.

## Overview

This implementation provides:
- **WKB parsing** for PostGIS geometry data
- **SuperCluster integration** for efficient clustering
- **Custom cluster markers** with dynamic sizing and coloring
- **Zoom-to-cluster functionality**
- **Performance optimizations** for smooth rendering
- **Expo compatibility** (no native linking required)

## Installation

```bash
npm install supercluster
```

## Core Components

### 1. WKB Parser (`lib/wkbParser.ts`)

Converts PostGIS WKB hex strings to coordinates:

```typescript
import { parseWKBPoint, wkbToGeoJSONPoint } from './lib/wkbParser';

// Parse single coordinate
const coord = parseWKBPoint("0101000020E6100000D735B5C766123340F9A3A833F7BF4740");
// Returns: { longitude: 19.0402, latitude: 47.4979 }

// Convert to GeoJSON
const feature = wkbToGeoJSONPoint(wkbHex, { id: '1', name: 'Location' });
```

### 2. SuperCluster Hook (`hooks/useSupercluster.ts`)

Manages clustering logic:

```typescript
import { useSupercluster } from './hooks/useSupercluster';

const { clusters, supercluster } = useSupercluster(points, region, {
  radius: 60,
  maxZoom: 17,
  minZoom: 0,
  minPoints: 2,
});
```

### 3. Cluster Markers (`components/ClusterMarker.tsx`)

Renders clusters and individual markers:

```typescript
import { ClusterMarker, IndividualMarker } from './components/ClusterMarker';

<ClusterMarker 
  cluster={clusterPoint} 
  onPress={handleClusterPress}
  color="#FF6B6B"
/>
```

### 4. Clustered Map View (`components/ClusteredMapView.tsx`)

Main component that combines everything:

```typescript
import { ClusteredMapView } from './components/ClusteredMapView';

<ClusteredMapView
  data={databaseRecords}
  region={mapRegion}
  onMarkerPress={handleMarkerPress}
  onClusterPress={handleClusterPress}
  clusterOptions={{
    radius: 60,
    maxZoom: 15,
    minPoints: 2,
  }}
/>
```

## Usage Example

```typescript
import React, { useState } from 'react';
import MapView from 'react-native-maps';
import { ClusteredMapView } from './components/ClusteredMapView';

const MyMap = () => {
  const [region, setRegion] = useState({
    latitude: 47.4979,
    longitude: 19.0402,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const databaseData = [
    {
      id: '1',
      wkb: '0101000020E6100000D735B5C766123340F9A3A833F7BF4740',
      name: 'Restaurant 1',
      type: 'restaurant',
    },
    // ... more data
  ];

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={region}
      onRegionChangeComplete={setRegion}
    >
      <ClusteredMapView
        data={databaseData}
        region={region}
        onMarkerPress={(point) => console.log('Marker:', point.properties)}
        onClusterPress={(cluster) => console.log('Cluster:', cluster.properties.point_count)}
      />
    </MapView>
  );
};
```

## Performance Optimization

For large datasets, use `OptimizedClusteredMap`:

```typescript
import { OptimizedClusteredMap } from './components/OptimizedClusteredMap';

<OptimizedClusteredMap
  data={largeDataset}
  region={region}
  maxMarkersToRender={500}
  enableClustering={true}
  debounceMs={100}
  clusterOptions={{
    radius: 60,
    maxZoom: 15,
    minPoints: 3,
  }}
/>
```

## Configuration Options

### Cluster Options

```typescript
{
  radius: 60,        // Cluster radius in pixels
  maxZoom: 17,       // Max zoom level for clustering
  minZoom: 0,        // Min zoom level for clustering
  minPoints: 2,      // Minimum points to form a cluster
}
```

### Performance Options

```typescript
{
  maxMarkersToRender: 500,  // Limit rendered markers
  enableClustering: true,   // Toggle clustering on/off
  debounceMs: 100,         // Debounce region changes
}
```

## Database Integration

### PostgreSQL Query Example

```sql
SELECT 
  id,
  name,
  type,
  ST_AsBinary(geometry) as wkb
FROM locations 
WHERE ST_DWithin(
  geometry, 
  ST_SetSRID(ST_MakePoint($longitude, $latitude), 4326), 
  $radiusInMeters
);
```

### TypeScript Interface

```typescript
interface DatabaseRecord {
  id: string;
  wkb: string; // WKB hex string from PostGIS
  name?: string;
  type?: string;
  [key: string]: any;
}
```

## Custom Marker Rendering

```typescript
const renderCustomMarker = (point: ClusterPoint) => {
  const [longitude, latitude] = point.geometry.coordinates;
  
  return (
    <Marker coordinate={{ latitude, longitude }}>
      <View style={customMarkerStyle}>
        <Text>{point.properties.type === 'restaurant' ? '🍽️' : '🏪'}</Text>
      </View>
    </Marker>
  );
};

<ClusteredMapView
  data={data}
  region={region}
  renderIndividualMarker={renderCustomMarker}
/>
```

## Troubleshooting

### Common Issues

1. **Invalid WKB strings**: Ensure your PostGIS query returns proper WKB format
2. **Performance issues**: Use `OptimizedClusteredMap` for large datasets
3. **Clustering not working**: Check zoom levels and cluster options
4. **Markers not appearing**: Verify coordinate parsing and map bounds

### Debugging

Enable console logging to monitor performance:

```typescript
// The components automatically log parsing and clustering times
// Check console for performance metrics
```

### Testing WKB Parser

```typescript
import { testWKBParser } from './lib/wkbParser';

// Test with your WKB data
testWKBParser();
```

## Migration from Existing Code

To replace your current marker rendering:

1. **Replace flat marker list** with `ClusteredMapView`
2. **Update data format** to include WKB field
3. **Add clustering configuration** based on your needs
4. **Customize marker appearance** using render props

### Before

```typescript
{markers.map(marker => (
  <Marker key={marker.id} coordinate={marker.coordinate} />
))}
```

### After

```typescript
<ClusteredMapView
  data={markersWithWKB}
  region={region}
  onMarkerPress={handleMarkerPress}
/>
```

## Best Practices

1. **Use batch WKB parsing** for better performance
2. **Limit rendered markers** for smooth scrolling
3. **Debounce region changes** to avoid excessive re-clustering
4. **Cache parsed coordinates** when possible
5. **Test with realistic data volumes**
6. **Monitor performance** in production

## Support

This implementation supports:
- ✅ Expo managed workflow
- ✅ PostGIS WKB data
- ✅ Large datasets (1000+ points)
- ✅ Custom marker styling
- ✅ TypeScript
- ✅ iOS and Android