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

// Convert MapMarker to SuperCluster point format
export const markersToPoints = (markers: MapMarker[]): ClusterPoint[] => {
  return markers.map((marker) => ({
    type: 'Feature',
    properties: marker,
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
    
    // Create SuperCluster instance optimized for stability
    const supercluster = new Supercluster({
      radius: 50, // Nagyobb radius - kevesebb cluster
      maxZoom: 15, // Még alacsonyabb max zoom - korai szétválás
      minZoom: 0,  // Min zoom level for clustering
      minPoints: 4, // Még több pont kell - kevesebb cluster
      extent: 256, // Kisebb extent - kevesebb pontosság, több stabilitás
      nodeSize: 32, // Kisebb node size - gyorsabb
    });

    // Load points into SuperCluster
    supercluster.load(points);

    // Get current zoom level
    const zoom = getZoomLevel(region.latitudeDelta);

    // Calculate bounds for current region
    const bounds = [
      region.longitude - region.longitudeDelta / 2, // west
      region.latitude - region.latitudeDelta / 2,   // south
      region.longitude + region.longitudeDelta / 2, // east
      region.latitude + region.latitudeDelta / 2,   // north
    ] as [number, number, number, number];

    // Get clusters for current bounds and zoom
    const clusteredFeatures = supercluster.getClusters(bounds, zoom);

    // Debug information
    console.log(`Clustering debug:`, {
      zoom: zoom.toFixed(2),
      latitudeDelta: region.latitudeDelta.toFixed(6),
      inputMarkers: points.length,
      clusteredFeatures: clusteredFeatures.length,
      bounds: bounds.map(b => b.toFixed(4))
    });

    // Fallback: ha nincs eredmény, mutassuk az eredeti markereket
    const finalClusters = clusteredFeatures.length > 0 ? clusteredFeatures : points;

    return {
      clusters: finalClusters,
      supercluster,
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