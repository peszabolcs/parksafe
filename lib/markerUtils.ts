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
  // For debugging, let's use a simple static data URI that should definitely work
  const simpleRedCircle = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9InJlZCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';
  
  
  return simpleRedCircle;
};

// Force all platforms to use custom view markers until gray square issue is fixed
export const shouldUseImageMarkers = (): boolean => {
  return false;
};

// Debug function to test marker generation
export const testMarkerGeneration = () => {
  console.log('Testing marker generation...');
  const testUri = generateMarkerImageUri('parking', false, false, false);
  console.log('Generated URI length:', testUri.length);
  console.log('URI starts with:', testUri.substring(0, 50));
  return testUri;
};