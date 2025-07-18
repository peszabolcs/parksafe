import { MapMarker } from './markers';

export interface ClusterMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'cluster';
  markers: MapMarker[];
  count: number;
}

export type ClusteredMarker = MapMarker | ClusterMarker;

// Calculate distance between two coordinates in meters
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate clustering distance based on zoom level
export const getClusterDistance = (latitudeDelta: number): number => {
  // The smaller the latitudeDelta, the more zoomed in we are
  // More zoomed in = smaller cluster distance (more separation)
  if (latitudeDelta > 0.2) return 3000;   // Very zoomed out - large clusters
  if (latitudeDelta > 0.1) return 1500;   // Zoomed out - medium clusters
  if (latitudeDelta > 0.05) return 800;   // Medium zoom - smaller clusters
  if (latitudeDelta > 0.02) return 300;   // Close zoom - very small clusters
  if (latitudeDelta > 0.015) return 150;  // Very close zoom - minimal clustering
  if (latitudeDelta > 0.01) return 75;    // Very zoomed in - almost no clustering
  if (latitudeDelta > 0.007) return 30;   // Extremely close - tiny clusters only
  if (latitudeDelta > 0.005) return 15;   // Super close - separate unless identical
  if (latitudeDelta > 0.003) return 5;    // Maximum zoom - only identical coordinates cluster
  return 1; // Extreme zoom - separate everything except exact duplicates
};

// Calculate the center point of a group of markers
const calculateClusterCenter = (markers: MapMarker[]) => {
  const lat = markers.reduce((sum, marker) => sum + marker.coordinate.latitude, 0) / markers.length;
  const lng = markers.reduce((sum, marker) => sum + marker.coordinate.longitude, 0) / markers.length;
  return { latitude: lat, longitude: lng };
};

// Main clustering function
export const clusterMarkers = (
  markers: MapMarker[],
  latitudeDelta: number,
  longitudeDelta: number
): ClusteredMarker[] => {
  if (markers.length === 0) return [];

  const clusterDistance = getClusterDistance(latitudeDelta);
  const clustered: ClusteredMarker[] = [];
  const processed = new Set<string>();

  const markersToCluster = markers;

  for (const marker of markersToCluster) {
    if (processed.has(marker.id)) continue;

    // Find all markers within cluster distance
    const nearbyMarkers = markersToCluster.filter(otherMarker => {
      if (processed.has(otherMarker.id) || otherMarker.id === marker.id) {
        return false;
      }

      const distance = calculateDistance(
        marker.coordinate.latitude,
        marker.coordinate.longitude,
        otherMarker.coordinate.latitude,
        otherMarker.coordinate.longitude
      );

      return distance <= clusterDistance;
    });

    // Mark all nearby markers as processed
    processed.add(marker.id);
    nearbyMarkers.forEach(m => processed.add(m.id));

    if (nearbyMarkers.length === 0) {
      // Single marker, no clustering needed
      clustered.push(marker);
    } else {
      // For very close zoom levels, only cluster if markers are extremely close or identical
      if (latitudeDelta < 0.005) {
        const allMarkersInCluster = [marker, ...nearbyMarkers];
        
        // Check if all markers are at essentially the same location (within 1 meter)
        const maxDistanceInCluster = Math.max(...allMarkersInCluster.flatMap(m1 => 
          allMarkersInCluster.map(m2 => 
            m1.id === m2.id ? 0 : calculateDistance(
              m1.coordinate.latitude, m1.coordinate.longitude,
              m2.coordinate.latitude, m2.coordinate.longitude
            )
          )
        ));

        if (maxDistanceInCluster > 1) {
          // Markers are not at the same location, don't cluster at this zoom level
          clustered.push(marker);
          nearbyMarkers.forEach(m => clustered.push(m));
          continue;
        }
      }

      // Create cluster with all nearby markers
      const allMarkersInCluster = [marker, ...nearbyMarkers];
      const clusterCenter = calculateClusterCenter(allMarkersInCluster);

      const clusterMarker: ClusterMarker = {
        id: `cluster_${marker.id}_${nearbyMarkers.map(m => m.id).join('_')}`,
        coordinate: clusterCenter,
        type: 'cluster',
        markers: allMarkersInCluster,
        count: allMarkersInCluster.length,
      };

      clustered.push(clusterMarker);
    }
  }

  return clustered;
};

// Helper function to check if a marker is a cluster
export const isClusterMarker = (marker: ClusteredMarker): marker is ClusterMarker => {
  return marker.type === 'cluster';
};

// Helper function to get the dominant type in a cluster (for styling)
export const getClusterDominantType = (cluster: ClusterMarker): 'parking' | 'repairStation' => {
  const parkingCount = cluster.markers.filter(m => m.type === 'parking').length;
  const repairCount = cluster.markers.filter(m => m.type === 'repairStation').length;
  return parkingCount >= repairCount ? 'parking' : 'repairStation';
};

// Helper function to get cluster breakdown text
export const getClusterBreakdown = (cluster: ClusterMarker): string => {
  const parkingCount = cluster.markers.filter(m => m.type === 'parking').length;
  const repairCount = cluster.markers.filter(m => m.type === 'repairStation').length;
  
  const parts = [];
  if (parkingCount > 0) parts.push(`${parkingCount} parkoló`);
  if (repairCount > 0) parts.push(`${repairCount} szerviz`);
  
  return parts.join(', ');
}; 