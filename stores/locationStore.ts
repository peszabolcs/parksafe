import { create } from 'zustand';
import * as Location from 'expo-location';
import { generateAllMarkers, getDistance, getDistanceFast, MapMarker } from '../lib/markers';

interface LocationState {
  userLocation: { latitude: number; longitude: number } | null;
  markers: MapMarker[];
  nearbyMarkers: (MapMarker & { distance: number })[];
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  initializeLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => {
  // Cache for markers to avoid refetching
  let markersCache: MapMarker[] | null = null;
  let lastLocationUpdate: { latitude: number; longitude: number } | null = null;
  let locationSubscription: Location.LocationSubscription | null = null;
  let nearbyMarkersCache: (MapMarker & { distance: number })[] | null = null;
  let lastCalculationTime = 0;
  const CACHE_DURATION = 5000; // 5 seconds cache

  // Calculate nearby markers with distance - optimized with better caching
  const calculateNearbyMarkers = (location: { latitude: number; longitude: number }, markerList: MapMarker[]) => {
    const now = Date.now();
    
    // Check if we have a recent cache
    if (nearbyMarkersCache && lastLocationUpdate && now - lastCalculationTime < CACHE_DURATION) {
      const distance = getDistanceFast(
        lastLocationUpdate.latitude,
        lastLocationUpdate.longitude,
        location.latitude,
        location.longitude
      );
      if (distance < 10) {
        return nearbyMarkersCache; // Return cached result
      }
    }
    
    lastLocationUpdate = location;
    lastCalculationTime = now;
    
    // Use a more efficient calculation for large datasets
    const withDistance = markerList.map(m => ({
      ...m,
      distance: getDistanceFast(
        location.latitude, 
        location.longitude, 
        m.coordinate.latitude, 
        m.coordinate.longitude
      )
    }));
    
    const sorted = withDistance.sort((a, b) => a.distance - b.distance);
    nearbyMarkersCache = sorted;
    return sorted;
  };

  const fetchLocationAndMarkers = async () => {
    set({ loading: true, error: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ error: 'Location permission denied', loading: false });
        return;
      }

      // Use cached markers if available to speed up loading
      const markersPromise = markersCache ? Promise.resolve(markersCache) : generateAllMarkers();
      
      const [locationResult, markersResult] = await Promise.allSettled([
        Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced
        }),
        markersPromise
      ]);

      let newUserLocation: { latitude: number; longitude: number } | null = null;
      let generatedMarkers: MapMarker[] = [];

      if (locationResult.status === 'fulfilled') {
        newUserLocation = { 
          latitude: locationResult.value.coords.latitude, 
          longitude: locationResult.value.coords.longitude 
        };
        set({ userLocation: newUserLocation });
      } else {
        set({ error: 'Failed to get location' });
      }

      if (markersResult.status === 'fulfilled') {
        generatedMarkers = markersResult.value;
        markersCache = generatedMarkers;
        set({ markers: generatedMarkers });
      } else {
        if (markersCache) {
          generatedMarkers = markersCache;
          set({ markers: generatedMarkers });
        }
      }

      if (newUserLocation && generatedMarkers.length > 0) {
        const nearby = calculateNearbyMarkers(newUserLocation, generatedMarkers);
        set({ nearbyMarkers: nearby });
      }
    } catch (err) {
      set({ error: 'Failed to fetch data' });
    } finally {
      set({ loading: false });
    }
  };

  return {
    userLocation: null,
    markers: [],
    nearbyMarkers: [],
    loading: true,
    error: null,
    refreshLocation: async () => {
      markersCache = null;
      await fetchLocationAndMarkers();
    },
      initializeLocation: async () => {
    await fetchLocationAndMarkers();
    // Watch for location updates
    if (locationSubscription) {
      locationSubscription.remove();
    }
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 10000 },
      (loc) => {
        const newLocation = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        set({ userLocation: newLocation });
        const markers = get().markers;
        if (markers.length > 0) {
          const nearby = calculateNearbyMarkers(newLocation, markers);
          set({ nearbyMarkers: nearby });
        }
      }
    ).then(subscription => {
      locationSubscription = subscription;
    }).catch(() => {});
  },
  };
}); 