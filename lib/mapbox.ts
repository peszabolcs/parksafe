import Mapbox from '@rnmapbox/maps';

// Initialize Mapbox with access token following official pattern
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_KEY;

// Simple initialization check
if (MAPBOX_ACCESS_TOKEN) {
  try {
    Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
    console.log('Mapbox access token set successfully');
  } catch (error) {
    console.error('Failed to set Mapbox access token:', error);
  }
} else {
  console.warn('Mapbox access token not found. Please set EXPO_PUBLIC_MAPBOX_PUBLIC_KEY in your .env file');
}

// Map configuration following official patterns
export const MAP_CONFIG = {
  // Default camera settings
  camera: {
    centerCoordinate: [20.1484, 46.253], // Szeged, Hungary
    zoomLevel: 12,
    animationMode: 'flyTo',
    animationDuration: 2000,
  },
  
  // Map styles (official Mapbox styles)
  styles: {
    street: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    light: 'mapbox://styles/mapbox/streets-v12',
    dark: 'mapbox://styles/mapbox/dark-v11',
  },
  
  // Marker colors by type
  markerColors: {
    parking: '#059669',
    bicycleService: '#F97316', 
    repairStation: '#1D4ED8',
    default: '#6B7280',
  },
  
  // Clustering configuration
  clustering: {
    maxZoom: 14,
    radius: 50,
    clusterMaxZoom: 14,
  },
}; 