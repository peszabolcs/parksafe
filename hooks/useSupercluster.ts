import { useMemo } from 'react';
import Supercluster from 'supercluster';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface ClusterOptions {
  radius?: number;
  maxZoom?: number;
  minZoom?: number;
  minPoints?: number;
}

export interface ClusterPoint extends GeoJSON.Feature<GeoJSON.Point> {
  properties: {
    cluster?: boolean;
    cluster_id?: number;
    point_count?: number;
    point_count_abbreviated?: string;
    [key: string]: any;
  };
}

/**
 * Convert latitude delta to zoom level for supercluster
 */
function getZoomLevel(latitudeDelta: number): number {
  // Convert latitude delta to zoom level (0-20)
  // Formula: zoom = log2(360 / latitudeDelta)
  const zoom = Math.log2(360 / latitudeDelta);
  return Math.max(0, Math.min(20, Math.floor(zoom)));
}

/**
 * Calculate map bounds from region
 */
function getMapBounds(region: MapRegion): [number, number, number, number] {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
  
  return [
    longitude - longitudeDelta / 2, // west
    latitude - latitudeDelta / 2,   // south
    longitude + longitudeDelta / 2, // east
    latitude + latitudeDelta / 2,   // north
  ];
}

/**
 * Hook for using supercluster with react-native-maps
 */
export function useSupercluster(
  points: GeoJSON.Feature<GeoJSON.Point>[],
  region: MapRegion,
  options: ClusterOptions = {}
) {
  const {
    radius = 60,
    maxZoom = 17,
    minZoom = 0,
    minPoints = 2,
  } = options;

  return useMemo(() => {
    // Create supercluster instance
    const supercluster = new Supercluster({
      radius,
      maxZoom,
      minZoom,
      minPoints,
    });

    // Load points into supercluster
    supercluster.load(points);

    // Get current zoom level and bounds
    const zoom = getZoomLevel(region.latitudeDelta);
    const bounds = getMapBounds(region);

    // Get clusters for current view
    const clusters = supercluster.getClusters(bounds, zoom) as ClusterPoint[];

    return {
      clusters,
      supercluster,
      zoom,
      bounds,
    };
  }, [points, region, radius, maxZoom, minZoom, minPoints]);
}

/**
 * Helper function to check if a point is a cluster
 */
export function isCluster(point: ClusterPoint): boolean {
  return point.properties.cluster === true;
}

/**
 * Helper function to get cluster expansion zoom level
 */
export function getClusterExpansionZoom(
  supercluster: Supercluster,
  clusterId: number
): number {
  return supercluster.getClusterExpansionZoom(clusterId);
}

/**
 * Helper function to get cluster children
 */
export function getClusterChildren(
  supercluster: Supercluster,
  clusterId: number
): ClusterPoint[] {
  return supercluster.getChildren(clusterId) as ClusterPoint[];
}

/**
 * Helper function to get cluster leaves (individual points)
 */
export function getClusterLeaves(
  supercluster: Supercluster,
  clusterId: number,
  limit = 10,
  offset = 0
): ClusterPoint[] {
  return supercluster.getLeaves(clusterId, limit, offset) as ClusterPoint[];
}

/**
 * Calculate new region for zooming to a cluster
 */
export function getClusterZoomRegion(
  cluster: ClusterPoint,
  expansionZoom: number,
  currentRegion: MapRegion
): MapRegion {
  const [longitude, latitude] = cluster.geometry.coordinates;
  
  // Calculate new latitude delta based on expansion zoom
  const newLatitudeDelta = 360 / Math.pow(2, expansionZoom);
  const newLongitudeDelta = newLatitudeDelta;

  return {
    latitude,
    longitude,
    latitudeDelta: Math.max(newLatitudeDelta, 0.001), // Minimum zoom level
    longitudeDelta: Math.max(newLongitudeDelta, 0.001),
  };
}

/**
 * Get cluster statistics
 */
export function getClusterStats(clusters: ClusterPoint[]) {
  const stats = {
    totalClusters: 0,
    totalPoints: 0,
    largestCluster: 0,
    individualPoints: 0,
  };

  clusters.forEach(cluster => {
    if (isCluster(cluster)) {
      stats.totalClusters++;
      const pointCount = cluster.properties.point_count || 0;
      stats.totalPoints += pointCount;
      stats.largestCluster = Math.max(stats.largestCluster, pointCount);
    } else {
      stats.individualPoints++;
      stats.totalPoints++;
    }
  });

  return stats;
}

/**
 * Format cluster count for display
 */
export function formatClusterCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 10000) {
    return `${Math.floor(count / 100) / 10}k`;
  } else if (count < 1000000) {
    return `${Math.floor(count / 1000)}k`;
  } else {
    return `${Math.floor(count / 100000) / 10}M`;
  }
}