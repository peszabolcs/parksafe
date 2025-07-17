import { Platform } from 'react-native';

// Cache for generated SVG URIs
const markerCache = new Map<string, string>();

// Clear cache function for debugging
export const clearMarkerCache = () => {
  markerCache.clear();
};

// Generate marker image URI for iOS to avoid the gray circle issue
export const generateMarkerImageUri = (
  type: 'parking' | 'repairStation',
  isSelected: boolean = false,
  isDarkMode: boolean = false,
  isFavourite: boolean = false
): string => {
  const cacheKey = `${type}_${isSelected}_${isDarkMode}_${isFavourite}`;
  
  if (markerCache.has(cacheKey)) {
    return markerCache.get(cacheKey)!;
  }
  
  // Use a much simpler approach for iOS stability
  const isParking = type === 'parking';
  const color = isParking ? '#22C55E' : '#3B82F6';
  const backgroundColor = isParking ? '#DCFCE7' : '#DBEAFE';
  const size = 30;
  const borderColor = isFavourite ? '#FFD700' : '#fff';
  const borderWidth = isSelected ? 3 : 2;
  
  // Create a simple, stable SVG marker
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <!-- Main circle -->
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - borderWidth}" fill="${backgroundColor}" stroke="${borderColor}" stroke-width="${borderWidth}"/>
    <!-- Icon -->
    <text x="${size/2}" y="${size/2 + 2}" text-anchor="middle" dominant-baseline="central" fill="${color}" font-family="Arial" font-size="14" font-weight="bold">
      ${isParking ? 'P' : 'R'}
    </text>
    <!-- Favourite star -->
    ${isFavourite ? `<circle cx="${size - 6}" cy="6" r="6" fill="#fff" stroke="#FFD700" stroke-width="1"/><text x="${size - 6}" y="8" text-anchor="middle" dominant-baseline="central" fill="#FFD700" font-family="Arial" font-size="8">★</text>` : ''}
  </svg>`;
  
  const encodedSvg = encodeURIComponent(svg);
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  
  markerCache.set(cacheKey, dataUri);
  return dataUri;
};

// Generate cluster marker image URI for iOS
export const generateClusterImageUri = (
  count: number,
  dominantType: 'parking' | 'repairStation',
  isDarkMode: boolean = false
): string => {
  const cacheKey = `cluster_${count}_${dominantType}_${isDarkMode}`;
  
  if (markerCache.has(cacheKey)) {
    return markerCache.get(cacheKey)!;
  }
  
  const isParking = dominantType === 'parking';
  const backgroundColor = isParking ? '#22C55E' : '#3B82F6';
  const size = 28;
  
  // Simple, stable SVG for cluster
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${backgroundColor}" stroke="#fff" stroke-width="2"/>
    <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="Arial" font-size="12" font-weight="bold">
      ${count}
    </text>
  </svg>`;
  
  const encodedSvg = encodeURIComponent(svg);
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  
  markerCache.set(cacheKey, dataUri);
  return dataUri;
};

// Force iOS to use image markers to prevent rotation crash
export const shouldUseImageMarkers = (): boolean => {
  return Platform.OS === 'ios';
};

// Clear cache periodically to prevent memory issues
export const clearMarkerCacheIfNeeded = () => {
  if (markerCache.size > 50) {
    markerCache.clear();
  }
};

// Simple test function to verify SVG generation works
export const getTestMarkerUri = (): string => {
  const simpleTestSvg = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" fill="red" stroke="black" stroke-width="2"/>
  </svg>`;
  
  const encodedSvg = encodeURIComponent(simpleTestSvg);
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  
  console.log(`Test SVG URI: ${dataUri}`);
  return dataUri;
};

// Debug function to test marker generation
export const testMarkerGeneration = () => {
  console.log('Testing marker generation...');
  const testUri = generateMarkerImageUri('parking', false, false, false);
  console.log('Generated URI length:', testUri.length);
  console.log('URI starts with:', testUri.substring(0, 50));
  return testUri;
};