import { useMemo } from 'react';
import Supercluster from 'supercluster';
import { MapMarker } from './markers';

export interface ClusterPoint {
  type: 'Feature';
  properties: MapMarker;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface ClusterFeature {
  type: 'Feature';
  properties: {
    cluster: boolean;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export type ClusteredFeature = ClusterPoint | ClusterFeature;

// Convert MapMarker to SuperCluster point format with type-based coordinate offset
export const markersToPoints = (markers: MapMarker[]): ClusterPoint[] => {
  if (!markers || !Array.isArray(markers)) {
    console.warn('Invalid markers array passed to markersToPoints:', markers);
    return [];
  }
  
  return markers.filter(marker => {
    if (!marker || !marker.coordinate) {
      console.warn('Marker missing coordinate:', marker);
      return false;
    }
    return true;
  }).map((marker) => {
    // Add tiny coordinate offset based on type to ensure absolute separation
    const typeOffset = {
      parking: { lat: 0, lng: 0 }, // No offset for parking
      bicycleService: { lat: 0.00001, lng: 0.00001 }, // Tiny offset for bicycle service
      repairStation: { lat: 0.00002, lng: 0.00002 }, // Different offset for repair stations
    };
    
    const offset = typeOffset[marker.type] || { lat: 0, lng: 0 };
    
    return {
      type: 'Feature',
      properties: {
        ...marker,
        // Add marker type as cluster category to ensure same types cluster together
        cluster_category: marker.type,
        // Add a type-specific ID to prevent cross-type clustering
        type_id: `${marker.type}_${marker.id}`,
      },
      geometry: {
        type: 'Point',
        coordinates: [
          marker.coordinate.longitude + offset.lng, 
          marker.coordinate.latitude + offset.lat
        ],
      },
    };
  });
};

// Convert latitude delta to zoom level for SuperCluster
const getZoomLevel = (latitudeDelta: number): number => {
  // Convert latitude delta to zoom level (0-20)
  const zoom = Math.log2(360 / latitudeDelta);
  // Használjuk a kerekített értéket, de biztosítsuk hogy ne "lyukak" legyenek
  const clampedZoom = Math.max(0, Math.min(20, zoom));
  // Ne floor-oljuk le, hanem használjuk a pontos értéket
  return clampedZoom;
};

// Alternative clustering approach: completely separate coordinate spaces for each type
const clusterMarkersWithSeparateSpaces = (
  markers: MapMarker[],
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }
) => {
  console.log("=== STRICT TYPE SEPARATION CLUSTERING ===");
  
  // Input validation
  if (!markers || !Array.isArray(markers)) {
    console.error("Invalid markers input:", markers);
    return { clusters: [], supercluster: null };
  }
  
  if (!region || typeof region.latitude !== 'number') {
    console.error("Invalid region input:", region);
    return { clusters: [], supercluster: null };
  }
  
  // Group markers by type BEFORE any processing
  const markersByType = {
    parking: markers.filter(m => m.type === 'parking'),
    bicycleService: markers.filter(m => m.type === 'bicycleService'),
    repairStation: markers.filter(m => m.type === 'repairStation'),
  };
  
  console.log("Raw markers by type:", {
    parking: markersByType.parking.length,
    bicycleService: markersByType.bicycleService.length,
    repairStation: markersByType.repairStation.length,
    total: markers.length
  });
  
  // Show geographic distribution of markers (will show bounds after calculation)
  if (markers.length > 0) {
    const latitudes = markers.map(m => m.coordinate.latitude);
    const longitudes = markers.map(m => m.coordinate.longitude);
    console.log("Marker geographic distribution:", {
      latRange: [Math.min(...latitudes).toFixed(4), Math.max(...latitudes).toFixed(4)],
      lngRange: [Math.min(...longitudes).toFixed(4), Math.max(...longitudes).toFixed(4)],
      searchCenter: [region.latitude.toFixed(4), region.longitude.toFixed(4)]
    });
  }
  
  const zoom = getZoomLevel(region.latitudeDelta);
  
  // Expand bounds for better marker coverage when zoomed out
  const expansionFactor = zoom < 12 ? 2.0 : 1.0; // Expand bounds when zoomed out
  
  // Validate region values
  if (isNaN(region.longitude) || isNaN(region.latitude) || isNaN(region.longitudeDelta) || isNaN(region.latitudeDelta)) {
    console.error("Invalid region values:", region);
    return { clusters: [], supercluster: null };
  }
  
  const bounds = [
    region.longitude - (region.longitudeDelta * expansionFactor) / 2,
    region.latitude - (region.latitudeDelta * expansionFactor) / 2,
    region.longitude + (region.longitudeDelta * expansionFactor) / 2,
    region.latitude + (region.latitudeDelta * expansionFactor) / 2,
  ] as [number, number, number, number];
  
  // Validate bounds
  if (bounds.some(b => isNaN(b))) {
    console.error("Invalid bounds calculated:", bounds);
    return { clusters: [], supercluster: null };
  }
  
  console.log(`Clustering bounds (expansion: ${expansionFactor}x):`, {
    zoom: zoom.toFixed(2),
    searchBounds: bounds.map(b => b.toFixed(4)),
    west: bounds[0].toFixed(4),
    south: bounds[1].toFixed(4), 
    east: bounds[2].toFixed(4),
    north: bounds[3].toFixed(4),
    latDelta: region.latitudeDelta.toFixed(6),
    lngDelta: region.longitudeDelta.toFixed(6)
  });
  
  let allClusters: any[] = [];
  
  // Process each type in completely separate coordinate spaces
  Object.entries(markersByType).forEach(([type, typeMarkers]) => {
    if (typeMarkers.length === 0) return;
    
    console.log(`\n--- Processing ${typeMarkers.length} markers of type: ${type} ---`);
    
    // Validate markers first
    const validMarkers = typeMarkers.filter((marker) => {
      if (!marker || !marker.coordinate) {
        console.warn(`Invalid marker found (no coordinate):`, marker);
        return false;
      }
      if (typeof marker.coordinate.latitude !== 'number' || typeof marker.coordinate.longitude !== 'number') {
        console.warn(`Invalid marker coordinate:`, marker.coordinate);
        return false;
      }
      if (isNaN(marker.coordinate.latitude) || isNaN(marker.coordinate.longitude)) {
        console.warn(`NaN in marker coordinate:`, marker.coordinate);
        return false;
      }
      return true;
    });
    
    if (validMarkers.length !== typeMarkers.length) {
      console.warn(`Filtered out ${typeMarkers.length - validMarkers.length} invalid markers of type ${type}`);
    }
    
    if (validMarkers.length === 0) {
      console.warn(`No valid markers for type ${type}`);
      return;
    }
    
    // Convert markers to points with type-specific coordinate offset
    const typeOffset = {
      parking: { lat: 0, lng: 0 },
      bicycleService: { lat: 100, lng: 100 }, // Move to different coordinate space
      repairStation: { lat: 200, lng: 200 }, // Even more separated space
    };
    
    const offset = typeOffset[type as keyof typeof typeOffset] || { lat: 0, lng: 0 };
    
    const typePoints = validMarkers.map((marker) => ({
      type: 'Feature' as const,
      properties: {
        ...marker,
        cluster_category: type,
        type_locked: type, // Lock the type to prevent mixing
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [
          marker.coordinate.longitude + offset.lng,
          marker.coordinate.latitude + offset.lat
        ] as [number, number],
      },
    }));
    
    // If only 1 marker, add directly
    if (typePoints.length === 1) {
      console.log(`Single ${type} marker - adding directly`);
      // Reset coordinates back to original for rendering
      const originalMarker = validMarkers[0];
      const originalPoint = {
        ...typePoints[0],
        geometry: {
          ...typePoints[0].geometry,
          coordinates: [
            originalMarker.coordinate.longitude,
            originalMarker.coordinate.latitude
          ] as [number, number],
        }
      };
      allClusters.push(originalPoint);
      return;
    }
    
    // Extra check: calculate distances between markers to prevent distant clustering
    const shouldCluster = validMarkers.length >= 2;
    if (shouldCluster && validMarkers.length === 2) {
      const [m1, m2] = validMarkers;
      // Calculate distance in meters (rough approximation)
      const latDiff = (m1.coordinate.latitude - m2.coordinate.latitude) * 111000; // ~111km per degree
      const lngDiff = (m1.coordinate.longitude - m2.coordinate.longitude) * 111000 * Math.cos(m1.coordinate.latitude * Math.PI / 180);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      console.log(`Distance between ${type} markers: ${distance.toFixed(1)}m`);
      
      // If markers are more than 10 meters apart, don't cluster them
      if (distance > 10) {
        console.log(`${type} markers too far apart (${distance.toFixed(1)}m) - adding as separate markers`);
        const separatePoints = validMarkers.map(marker => ({
          type: 'Feature' as const,
          properties: {
            ...marker,
            cluster_category: type,
            forced_separate: true,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [
              marker.coordinate.longitude,
              marker.coordinate.latitude
            ] as [number, number],
          },
        }));
        allClusters = allClusters.concat(separatePoints);
        return;
      }
    }
    
    // Create supercluster for this type with platform-optimized clustering
    // Note: We can't access Platform.OS in this pure function, so we use moderate settings
    // that work well for both platforms but lean toward more clustering for safety
    
    const supercluster = new Supercluster({
      radius: 25, // Moderate clustering - not too aggressive, not too loose
      maxZoom: 16, // Good balance for both platforms
      minZoom: 0,
      minPoints: 2, // Lower threshold for easier clustering
      extent: 256,
      nodeSize: 12, // Balanced node size
    });
    
    supercluster.load(typePoints);
    
    // Get clusters in the offset coordinate space
    const offsetBounds = [
      bounds[0] + offset.lng,
      bounds[1] + offset.lat,
      bounds[2] + offset.lng,
      bounds[3] + offset.lat,
    ] as [number, number, number, number];
    
    // Safe bounds logging - prevent undefined.map() errors
    const safeOriginalBounds = Array.isArray(bounds) ? bounds.map(b => (typeof b === 'number' ? b.toFixed(4) : 'NaN')) : 'undefined';
    const safeOffsetBounds = Array.isArray(offsetBounds) ? offsetBounds.map(b => (typeof b === 'number' ? b.toFixed(4) : 'NaN')) : 'undefined';
    
    console.log(`${type} offset bounds:`, {
      original: safeOriginalBounds,
      offset: { lat: offset.lat, lng: offset.lng },
      final: safeOffsetBounds
    });
    
    const typeClusters = supercluster.getClusters(offsetBounds, zoom);
    
    const clusterCount = typeClusters.filter((c: any) => c.properties && 'cluster' in c.properties).length;
    const individualCount = typeClusters.length - clusterCount;
    console.log(`${type}: Created ${clusterCount} clusters and ${individualCount} individual markers (total: ${typeClusters.length})`);
    
    // Reset coordinates back to original space and add type information
    const processedClusters = typeClusters.map((cluster: any) => {
      if (cluster.properties && 'cluster' in cluster.properties) {
        // It's a cluster - reset coordinates to original space
        return {
          ...cluster,
          geometry: {
            ...cluster.geometry,
            coordinates: [
              cluster.geometry.coordinates[0] - offset.lng,
              cluster.geometry.coordinates[1] - offset.lat,
            ],
          },
          properties: {
            ...cluster.properties,
            cluster_category: type,
            pure_type: type,
            type_separation_enforced: true,
          },
        };
      } else {
        // It's an individual marker - reset coordinates
        return {
          ...cluster,
          geometry: {
            ...cluster.geometry,
            coordinates: [
              cluster.geometry.coordinates[0] - offset.lng,
              cluster.geometry.coordinates[1] - offset.lat,
            ],
          },
          properties: {
            ...cluster.properties,
            confirmed_type: cluster.properties.type,
          },
        };
      }
    });
    
    allClusters = allClusters.concat(processedClusters);
  });
  
  console.log("\n=== FINAL RESULT ===");
  
  // Validate allClusters is a proper array
  if (!Array.isArray(allClusters)) {
    console.error("allClusters is not an array:", allClusters);
    return { clusters: [], supercluster: null };
  }
  
  console.log(`Total clusters/markers: ${allClusters.length}`);
  
  // Validate no type mixing occurred
  const clusterTypes = new Set();
  allClusters.forEach((cluster: any) => {
    if (cluster?.properties?.cluster_category) {
      clusterTypes.add(cluster.properties.cluster_category);
    }
  });
  console.log("Cluster types found:", Array.from(clusterTypes));
  
  return {
    clusters: allClusters || [],
    supercluster: null,
  };
};

// Simple zoom-based clustering - only cluster when really zoomed out
export const clusterMarkers = (
  markers: MapMarker[],
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }
) => {
  console.log('=== SIMPLE ZOOM-BASED CLUSTERING ===');
  console.log(`Region delta: ${region.latitudeDelta.toFixed(6)} (clustering threshold: 0.05)`);
  
  // Only cluster when REALLY zoomed out (latitudeDelta > 0.05)
  // This means clustering only happens when viewing large areas
  if (region.latitudeDelta <= 0.05) {
    console.log('✅ Zoom level good - NO CLUSTERING, showing individual markers');
    
    // No clustering - return individual markers as-is
    const individualMarkers = markers.map(marker => ({
      type: 'Feature' as const,
      properties: marker,
      geometry: {
        type: 'Point' as const,
        coordinates: [marker.coordinate.longitude, marker.coordinate.latitude] as [number, number]
      }
    }));
    
    return {
      clusters: individualMarkers,
      supercluster: null
    };
  }
  
  console.log('🔄 Very zoomed out - applying minimal clustering');
  
  // Simple distance-based grouping for very zoomed out view
  const grouped: { [key: string]: MapMarker[] } = {};
  const gridSize = 0.01; // ~1km grid cells
  
  markers.forEach(marker => {
    const gridX = Math.floor(marker.coordinate.latitude / gridSize);
    const gridY = Math.floor(marker.coordinate.longitude / gridSize);
    const key = `${gridX}-${gridY}-${marker.type}`; // Group by location AND type
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(marker);
  });
  
  const result: any[] = [];
  
  Object.values(grouped).forEach(group => {
    if (group.length === 1) {
      // Single marker
      result.push({
        type: 'Feature',
        properties: group[0],
        geometry: {
          type: 'Point',
          coordinates: [group[0].coordinate.longitude, group[0].coordinate.latitude]
        }
      });
    } else {
      // Simple cluster - use center of group
      const centerLat = group.reduce((sum, m) => sum + m.coordinate.latitude, 0) / group.length;
      const centerLng = group.reduce((sum, m) => sum + m.coordinate.longitude, 0) / group.length;
      
      result.push({
        type: 'Feature',
        properties: {
          cluster: true,
          cluster_id: Math.random(),
          point_count: group.length,
          point_count_abbreviated: group.length.toString(),
          cluster_category: group[0].type // All same type due to grouping key
        },
        geometry: {
          type: 'Point',
          coordinates: [centerLng, centerLat]
        }
      });
    }
  });
  
  console.log(`Simple clustering result: ${result.length} features from ${markers.length} markers`);
  
  return {
    clusters: result,
    supercluster: null
  };
};

// Hook for using clustering in components
export const useExpoClustering = (
  markers: MapMarker[],
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }
) => {
  const clusters = useMemo(() => {
    return clusterMarkers(markers, region);
  }, [markers, region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  return clusters;
};

// Helper function to check if a feature is a cluster
export const isCluster = (feature: ClusteredFeature): feature is ClusterFeature => {
  return feature.properties && 'cluster' in feature.properties && feature.properties.cluster === true;
};

// Helper function to get marker from cluster point
export const getMarkerFromPoint = (point: ClusterPoint): MapMarker => {
  return point.properties;
};

// Helper function to get cluster info
export const getClusterInfo = (cluster: ClusterFeature) => {
  return {
    pointCount: cluster.properties.point_count,
    pointCountAbbreviated: cluster.properties.point_count_abbreviated,
    clusterId: cluster.properties.cluster_id,
    coordinate: {
      latitude: cluster.geometry.coordinates[1],
      longitude: cluster.geometry.coordinates[0],
    },
  };
};

// Helper function to get the dominant marker type in a cluster
export const getClusterDominantType = (
  supercluster: Supercluster,
  clusterId: number
): 'parking' | 'repairStation' | 'bicycleService' => {
  try {
    const leaves = supercluster.getLeaves(clusterId, Infinity);
    const typeCounts = {
      parking: 0,
      repairStation: 0,
      bicycleService: 0,
    };

    leaves.forEach((leaf: any) => {
      const marker = leaf.properties as MapMarker;
      const type = marker.type;
      if (type in typeCounts) {
        typeCounts[type as keyof typeof typeCounts]++;
      }
    });

    // Return the type with the highest count
    return Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0] as keyof typeof typeCounts] > typeCounts[b[0] as keyof typeof typeCounts] ? a : b
    )[0] as 'parking' | 'repairStation' | 'bicycleService';
  } catch (error) {
    console.warn('Error getting cluster dominant type:', error);
    return 'parking'; // fallback
  }
};