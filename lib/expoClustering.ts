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

// Convert MapMarker to SuperCluster point format with type grouping
export const markersToPoints = (markers: MapMarker[]): ClusterPoint[] => {
  return markers.map((marker) => ({
    type: 'Feature',
    properties: {
      ...marker,
      // Add marker type as cluster category to ensure same types cluster together
      cluster_category: marker.type,
    },
    geometry: {
      type: 'Point',
      coordinates: [marker.coordinate.longitude, marker.coordinate.latitude],
    },
  }));
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
    const points = markersToPoints(markers);
    
    // Get current zoom level and bounds first
    const zoom = getZoomLevel(region.latitudeDelta);

    // Calculate bounds for current region
    const bounds = [
      region.longitude - region.longitudeDelta / 2, // west
      region.latitude - region.latitudeDelta / 2,   // south
      region.longitude + region.longitudeDelta / 2, // east
      region.latitude + region.latitudeDelta / 2,   // north
    ] as [number, number, number, number];
    
    // Debug: Check all unique marker types in the data
    const allTypes = new Set(points.map(p => p.properties.type));
    console.log("All marker types found:", Array.from(allTypes));
    
    // Group markers by type first, then cluster each type separately
    const markersByType = {
      parking: points.filter(p => p.properties.type === 'parking'),
      bicycleService: points.filter(p => p.properties.type === 'bicycleService'),
      repairStation: points.filter(p => p.properties.type === 'repairStation'),
    };

    // Debug: Show how many markers of each type we have
    console.log("Markers grouped by type:", {
      parking: markersByType.parking.length,
      bicycleService: markersByType.bicycleService.length,
      repairStation: markersByType.repairStation.length,
      total: points.length
    });

    let allClusters: any[] = [];

    // Cluster each type separately
    Object.entries(markersByType).forEach(([type, typePoints]) => {
      if (typePoints.length === 0) return;
      
      console.log(`Clustering ${typePoints.length} markers of type ${type}`);

      // Special case: if there's only 1 marker of this type, just add it directly
      if (typePoints.length === 1) {
        console.log(`Type ${type}: Only 1 marker, adding directly as individual marker`);
        allClusters = allClusters.concat(typePoints);
        return;
      }

      const supercluster = new Supercluster({
        radius: 50,
        maxZoom: 18, // Higher maxZoom to ensure individual markers show at high zoom levels
        minZoom: 0,
        minPoints: 2, // Legalább 2 ugyanolyan típus kell
        extent: 256,
        nodeSize: 32,
      });

      supercluster.load(typePoints);
      
      const typeClusters = supercluster.getClusters(bounds, zoom);
      
      console.log(`Type ${type} produced ${typeClusters.length} clusters/markers from ${typePoints.length} input points`);
      
      // Debug: show what types of results we got
      const clusterCount = typeClusters.filter(c => c.properties && 'cluster' in c.properties).length;
      const individualCount = typeClusters.length - clusterCount;
      console.log(`Type ${type}: ${clusterCount} clusters, ${individualCount} individual markers`);
      
      // Add type information to clusters
      const enhancedClusters = typeClusters.map(cluster => {
        if (cluster.properties && 'cluster' in cluster.properties) {
          // It's a cluster, add type info
          return {
            ...cluster,
            properties: {
              ...cluster.properties,
              cluster_category: type,
            }
          };
        } else {
          // It's an individual marker
          return cluster;
        }
      });

      allClusters = allClusters.concat(enhancedClusters);
    });

    // Debug information
    console.log(`Type-based clustering debug:`, {
      zoom: zoom.toFixed(2),
      latitudeDelta: region.latitudeDelta.toFixed(6),
      inputMarkers: points.length,
      finalClusters: allClusters.length,
      parkingMarkers: markersByType.parking.length,
      bicycleServiceMarkers: markersByType.bicycleService.length,
      repairStationMarkers: markersByType.repairStation.length,
    });

    // Fallback: ha nincs eredmény, mutassuk az eredeti markereket
    const finalClusters = allClusters.length > 0 ? allClusters : points;

    return {
      clusters: finalClusters,
      supercluster: null, // No single supercluster instance
    };
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

    leaves.forEach((leaf) => {
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