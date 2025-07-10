import { create } from 'zustand';
import * as Location from 'expo-location';
import { MapMarker, fetchNearbyMarkers } from '../lib/markers';

interface LocationState {
  userLocation: { latitude: number; longitude: number } | null;
  markers: MapMarker[];
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Cache for quick access
let locationCache: { latitude: number; longitude: number } | null = null;
let markersCache: MapMarker[] = [];

export const useLocationStore = create<LocationState>((set, get) => ({
  userLocation: null,
  markers: [],
  loading: false,
  error: null,

  initialize: async () => {
    const state = get();
    if (state.loading) return; // Prevent multiple calls

    set({ loading: true, error: null });

    try {
      // Step 1: Fast location with cached fallback
      let userLocation = locationCache;
      
      if (!userLocation) {
        // Get location permission first
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          set({ error: 'Location permission denied', loading: false });
          return;
        }

        // Use faster, less accurate location for speed
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low, // Much faster than Balanced
        });

        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Location timeout')), 5000);
        });

        try {
          const location = await Promise.race([locationPromise, timeoutPromise]);
          userLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          locationCache = userLocation; // Cache for next time
        } catch (locationError) {
          console.error('Location error:', locationError);
          // Use default location if GPS fails (Szeged city center)
          userLocation = {
            latitude: 46.2530,
            longitude: 20.1484,
          };
          set({ error: 'Using default location' });
        }
      }

      set({ userLocation });

      // Step 2: Serve cached markers immediately if available
      if (markersCache.length > 0) {
        set({ markers: markersCache, loading: false });
        // Continue fetching fresh data in background
        setTimeout(() => {
          fetchNearbyMarkers(userLocation!.latitude, userLocation!.longitude, 5000, true)
            .then(markers => {
              markersCache = markers;
              set({ markers });
            })
            .catch(error => console.error('Background marker refresh failed:', error));
        }, 100);
        return;
      }

      // Step 3: Fetch markers with timeout
      const markersPromise = fetchNearbyMarkers(
        userLocation.latitude,
        userLocation.longitude,
        5000, // 5km radius
        true   // only available
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Markers timeout')), 8000);
      });

      try {
        const markers = await Promise.race([markersPromise, timeoutPromise]);
        markersCache = markers; // Cache for next time
        set({ markers, loading: false });
      } catch (markersError) {
        console.error('Markers error:', markersError);
        set({ error: 'Failed to load nearby places', loading: false });
      }

    } catch (error) {
      console.error('Location initialization failed:', error);
      set({ error: 'Failed to get location', loading: false });
    }
  },

  refresh: async () => {
    const state = get();
    
    // Quick refresh: use current location if available
    if (state.userLocation) {
      set({ loading: true, error: null });

      try {
        const markers = await Promise.race([
          fetchNearbyMarkers(state.userLocation.latitude, state.userLocation.longitude, 5000, true),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Refresh timeout')), 6000);
          })
        ]);

        markersCache = markers;
        set({ markers, loading: false });
      } catch (error) {
        console.error('Location refresh failed:', error);
        set({ error: 'Failed to refresh locations', loading: false });
      }
    } else {
      // No location, run full initialization
      await state.initialize();
    }
  },
})); 