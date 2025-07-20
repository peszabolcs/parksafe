import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { ClusterPoint, formatClusterCount } from '../hooks/useSupercluster';

interface ClusterMarkerProps {
  cluster: ClusterPoint;
  onPress?: (cluster: ClusterPoint) => void;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

/**
 * Calculate cluster size based on point count
 */
function getClusterSize(pointCount: number): { size: number; fontSize: number } {
  if (pointCount < 10) {
    return { size: 30, fontSize: 12 };
  } else if (pointCount < 100) {
    return { size: 40, fontSize: 14 };
  } else if (pointCount < 1000) {
    return { size: 50, fontSize: 16 };
  } else {
    return { size: 60, fontSize: 18 };
  }
}

/**
 * Get cluster color based on point count
 */
function getClusterColor(pointCount: number): string {
  if (pointCount < 10) {
    return '#3B82F6'; // Blue
  } else if (pointCount < 100) {
    return '#10B981'; // Green
  } else if (pointCount < 1000) {
    return '#F59E0B'; // Yellow
  } else {
    return '#EF4444'; // Red
  }
}

export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  cluster,
  onPress,
  color,
  textColor = '#FFFFFF',
  borderColor = '#FFFFFF',
  borderWidth = 2,
}) => {
  const pointCount = cluster.properties.point_count || 0;
  const [longitude, latitude] = cluster.geometry.coordinates;
  
  const { size, fontSize } = getClusterSize(pointCount);
  const backgroundColor = color || getClusterColor(pointCount);
  const displayCount = formatClusterCount(pointCount);

  const handlePress = () => {
    onPress?.(cluster);
  };

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 0.5 }}
      centerOffset={{ x: 0, y: 0 }}
      tracksViewChanges={false}
      zIndex={1000}
    >
      <View style={[
        styles.clusterContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor,
          borderWidth,
        }
      ]}>
        <Text style={[
          styles.clusterText,
          {
            fontSize,
            color: textColor,
          }
        ]}>
          {displayCount}
        </Text>
      </View>
    </Marker>
  );
};

export const IndividualMarker: React.FC<{
  point: ClusterPoint;
  onPress?: (point: ClusterPoint) => void;
  size?: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  children?: React.ReactNode;
}> = ({
  point,
  onPress,
  size = 24,
  color = '#3B82F6',
  borderColor = '#FFFFFF',
  borderWidth = 2,
  children,
}) => {
  const [longitude, latitude] = point.geometry.coordinates;

  const handlePress = () => {
    onPress?.(point);
  };

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 0.5 }}
      centerOffset={{ x: 0, y: 0 }}
      tracksViewChanges={false}
      zIndex={100}
    >
      {children || (
        <View style={[
          styles.markerContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            borderColor,
            borderWidth,
          }
        ]} />
      )}
    </Marker>
  );
};

const styles = StyleSheet.create({
  clusterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  clusterText: {
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});