import React, { useCallback, useRef } from 'react';
import MapView, { Region } from 'react-native-maps';
import { 
  useSupercluster, 
  isCluster, 
  getClusterExpansionZoom, 
  getClusterZoomRegion,
  ClusterPoint,
  MapRegion 
} from '../hooks/useSupercluster';
import { ClusterMarker, IndividualMarker } from './ClusterMarker';

export interface DatabaseRecord {
  id: string;
  wkb: string; // WKB hex string from PostGIS
  [key: string]: any; // Additional properties
}

interface ClusteredMapViewProps {
  data: DatabaseRecord[];
  region: MapRegion;
  onRegionChange?: (region: Region) => void;
  onMarkerPress?: (point: ClusterPoint) => void;
  onClusterPress?: (cluster: ClusterPoint) => void;
  clusterColor?: string;
  markerColor?: string;
  renderIndividualMarker?: (point: ClusterPoint) => React.ReactNode;
  children?: React.ReactNode;
  mapRef?: React.RefObject<MapView>;
  clusterOptions?: {
    radius?: number;
    maxZoom?: number;
    minZoom?: number;
    minPoints?: number;
  };
}

export const ClusteredMapView: React.FC<ClusteredMapViewProps> = ({
  data,
  region,
  onRegionChange,
  onMarkerPress,
  onClusterPress,
  clusterColor,
  markerColor,
  renderIndividualMarker,
  children,
  mapRef: externalMapRef,
  clusterOptions = {},
}) => {
  const internalMapRef = useRef<MapView>(null);
  const mapRef = externalMapRef || internalMapRef;

  // Convert database records to GeoJSON points
  const points = React.useMemo(() => {
    const validPoints: GeoJSON.Feature<GeoJSON.Point>[] = [];
    
    data.forEach(record => {
      try {
        // Parse WKB to get coordinates
        const coordinate = parseWKBPoint(record.wkb);
        if (coordinate) {
          validPoints.push({
            type: 'Feature',
            properties: {
              ...record,
              id: record.id,
            },
            geometry: {
              type: 'Point',
              coordinates: [coordinate.longitude, coordinate.latitude],
            },
          });
        }
      } catch (error) {
        console.warn(`Failed to parse WKB for record ${record.id}:`, error);
      }
    });

    return validPoints;
  }, [data]);

  // Get clusters using supercluster
  const { clusters, supercluster } = useSupercluster(points, region, clusterOptions);

  // Handle cluster press - zoom to cluster
  const handleClusterPress = useCallback((cluster: ClusterPoint) => {
    if (!mapRef.current || !supercluster) return;

    const clusterId = cluster.properties.cluster_id;
    if (clusterId === undefined) return;

    try {
      // Get expansion zoom level
      const expansionZoom = getClusterExpansionZoom(supercluster, clusterId);
      
      // Calculate new region
      const newRegion = getClusterZoomRegion(cluster, expansionZoom, region);
      
      // Animate to new region
      mapRef.current.animateToRegion(newRegion, 500);
      
      // Call custom handler if provided
      onClusterPress?.(cluster);
    } catch (error) {
      console.warn('Error handling cluster press:', error);
    }
  }, [mapRef, supercluster, region, onClusterPress]);

  // Handle individual marker press
  const handleMarkerPress = useCallback((point: ClusterPoint) => {
    onMarkerPress?.(point);
  }, [onMarkerPress]);

  // Render markers
  const renderMarkers = () => {
    return clusters.map((point, index) => {
      if (isCluster(point)) {
        return (
          <ClusterMarker
            key={`cluster-${point.properties.cluster_id}-${index}`}
            cluster={point}
            onPress={handleClusterPress}
            color={clusterColor}
          />
        );
      } else {
        if (renderIndividualMarker) {
          return (
            <React.Fragment key={`marker-${point.properties.id}-${index}`}>
              {renderIndividualMarker(point)}
            </React.Fragment>
          );
        }

        return (
          <IndividualMarker
            key={`marker-${point.properties.id}-${index}`}
            point={point}
            onPress={handleMarkerPress}
            color={markerColor}
          />
        );
      }
    });
  };

  return (
    <>
      {renderMarkers()}
      {children}
    </>
  );
};

// Simple WKB parser function (you can import from your wkbParser.ts)
function parseWKBPoint(wkbHex: string): { longitude: number; latitude: number } | null {
  try {
    const hex = wkbHex.trim();
    if (hex.length % 2 !== 0) {
      throw new Error('Invalid WKB hex string length');
    }

    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }

    const view = new DataView(bytes.buffer);
    let offset = 0;

    // Read byte order
    const byteOrder = view.getUint8(offset);
    offset += 1;
    const littleEndian = byteOrder === 1;

    // Read geometry type
    const geometryType = view.getUint32(offset, littleEndian);
    offset += 4;

    // Check if SRID is present
    const hasSRID = (geometryType & 0x20000000) !== 0;
    const actualGeometryType = geometryType & 0x1FFFFFFF;

    if (actualGeometryType !== 1) {
      throw new Error(`Unsupported geometry type: ${actualGeometryType}`);
    }

    // Skip SRID if present
    if (hasSRID) {
      offset += 4;
    }

    // Read coordinates
    const longitude = view.getFloat64(offset, littleEndian);
    offset += 8;
    const latitude = view.getFloat64(offset, littleEndian);

    if (isNaN(longitude) || isNaN(latitude)) {
      throw new Error('Invalid coordinates in WKB');
    }

    return { longitude, latitude };
  } catch (error) {
    console.error('Error parsing WKB:', error);
    return null;
  }
}

export default ClusteredMapView;