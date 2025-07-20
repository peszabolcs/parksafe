import React, { useCallback, useRef, useMemo } from 'react';
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
import { parseWKBBatch } from '../lib/wkbParser';

export interface DatabaseRecord {
  id: string;
  wkb: string; // WKB hex string from PostGIS
  [key: string]: any; // Additional properties
}

interface OptimizedClusteredMapProps {
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
  // Performance options
  maxMarkersToRender?: number;
  enableClustering?: boolean;
  debounceMs?: number;
}

export const OptimizedClusteredMap: React.FC<OptimizedClusteredMapProps> = ({
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
  maxMarkersToRender = 500,
  enableClustering = true,
  debounceMs = 100,
}) => {
  const internalMapRef = useRef<MapView>(null);
  const mapRef = externalMapRef || internalMapRef;

  // Memoized WKB parsing with batch processing
  const points = useMemo(() => {
    console.log(`Processing ${data.length} database records...`);
    const startTime = Date.now();
    
    // Use batch parser for better performance
    const batchData = data.map(record => ({
      wkb: record.wkb,
      properties: {
        ...record,
        id: record.id,
      }
    }));

    const validPoints = parseWKBBatch(batchData);
    
    const endTime = Date.now();
    console.log(`Parsed ${validPoints.length} points in ${endTime - startTime}ms`);
    
    return validPoints;
  }, [data]);

  // Optimized clustering with performance monitoring
  const clusteringResult = useMemo(() => {
    const startTime = Date.now();
    
    if (!enableClustering) {
      // Return individual points if clustering is disabled
      return {
        clusters: points.slice(0, maxMarkersToRender),
        supercluster: null,
      };
    }

    const result = useSupercluster(points, region, clusterOptions);
    
    // Limit the number of rendered markers for performance
    const limitedClusters = result.clusters.slice(0, maxMarkersToRender);
    
    const endTime = Date.now();
    console.log(`Clustering ${points.length} points into ${limitedClusters.length} clusters in ${endTime - startTime}ms`);
    
    return {
      clusters: limitedClusters,
      supercluster: result.supercluster,
    };
  }, [points, region, clusterOptions, enableClustering, maxMarkersToRender]);

  const { clusters, supercluster } = clusteringResult;

  // Debounced region change handler
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      onRegionChange?.(newRegion);
    }, debounceMs);
  }, [onRegionChange, debounceMs]);

  // Optimized cluster press handler
  const handleClusterPress = useCallback((cluster: ClusterPoint) => {
    if (!mapRef.current || !supercluster) return;

    const clusterId = cluster.properties.cluster_id;
    if (clusterId === undefined) return;

    try {
      const expansionZoom = getClusterExpansionZoom(supercluster, clusterId);
      const newRegion = getClusterZoomRegion(cluster, expansionZoom, region);
      
      mapRef.current.animateToRegion(newRegion, 300); // Faster animation
      onClusterPress?.(cluster);
    } catch (error) {
      console.warn('Error handling cluster press:', error);
    }
  }, [mapRef, supercluster, region, onClusterPress]);

  const handleMarkerPress = useCallback((point: ClusterPoint) => {
    onMarkerPress?.(point);
  }, [onMarkerPress]);

  // Memoized marker rendering with React.memo components
  const renderedMarkers = useMemo(() => {
    const startTime = Date.now();
    
    const markers = clusters.map((point, index) => {
      const key = isCluster(point) 
        ? `cluster-${point.properties.cluster_id}-${index}`
        : `marker-${point.properties.id}-${index}`;

      if (isCluster(point)) {
        return (
          <MemoizedClusterMarker
            key={key}
            cluster={point}
            onPress={handleClusterPress}
            color={clusterColor}
          />
        );
      } else {
        if (renderIndividualMarker) {
          return (
            <React.Fragment key={key}>
              {renderIndividualMarker(point)}
            </React.Fragment>
          );
        }

        return (
          <MemoizedIndividualMarker
            key={key}
            point={point}
            onPress={handleMarkerPress}
            color={markerColor}
          />
        );
      }
    });

    const endTime = Date.now();
    console.log(`Rendered ${markers.length} markers in ${endTime - startTime}ms`);
    
    return markers;
  }, [clusters, handleClusterPress, handleMarkerPress, clusterColor, markerColor, renderIndividualMarker]);

  return (
    <>
      {renderedMarkers}
      {children}
    </>
  );
};

// Memoized components for better performance
const MemoizedClusterMarker = React.memo(ClusterMarker);
const MemoizedIndividualMarker = React.memo(IndividualMarker);

export default OptimizedClusteredMap;