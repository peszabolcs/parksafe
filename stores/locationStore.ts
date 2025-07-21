import { create } from 'zustand';
import * as Location from 'expo-location';
import { MapMarker, fetchNearbyMarkers } from '../lib/markers';

interface LocationState {
  userLocation: { latitude: number; longitude: number } | null;
  homeMarkers: MapMarker[]; // Markers near user's location - never disappear
  searchMarkers: MapMarker[]; // Markers from manual searches
  markers: MapMarker[]; // Combined markers for display
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  searchAtLocation: (latitude: number, longitude: number) => Promise<void>;
  clearSearchResults: () => void;
}

// Cache for quick access
let locationCache: { latitude: number; longitude: number } | null = null;
let homeMarkersCache: MapMarker[] = [];

export const useLocationStore = create<LocationState>((set, get) => {
  
  const updateCombinedMarkers = () => {
    const state = get();
    
    // Combine markers while avoiding duplicates (home markers take priority)
    const homeMarkerIds = new Set(state.homeMarkers.map(m => m.id));
    const uniqueSearchMarkers = state.searchMarkers.filter(m => !homeMarkerIds.has(m.id));
    const combined = [...state.homeMarkers, ...uniqueSearchMarkers];
    
    set({ markers: combined });
  };

  return {
    userLocation: null,
    homeMarkers: [],
    searchMarkers: [],
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

          try {
            // Try to get last known location first (fastest)
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (lastKnown && lastKnown.coords) {
              userLocation = {
                latitude: lastKnown.coords.latitude,
                longitude: lastKnown.coords.longitude,
              };
              console.log('Using last known location');
            } else {
              // Try current location with longer timeout and fallback accuracy
              let location;
              
              try {
                // First try: Low accuracy with 10 second timeout
                const locationPromise = Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Low,
                });
                const timeoutPromise = new Promise<never>((_, reject) => {
                  setTimeout(() => reject(new Error('Location timeout')), 10000);
                });
                location = await Promise.race([locationPromise, timeoutPromise]);
              } catch (firstTry) {
                console.log('Low accuracy failed, trying Lowest accuracy...');
                // Second try: Lowest accuracy with 8 second timeout
                const locationPromise = Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Lowest,
                });
                const timeoutPromise = new Promise<never>((_, reject) => {
                  setTimeout(() => reject(new Error('Location timeout')), 8000);
                });
                location = await Promise.race([locationPromise, timeoutPromise]);
              }

              userLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              };
            }
            
            locationCache = userLocation; // Cache for next time
            console.log('Location acquired:', userLocation);
            
          } catch (locationError) {
            console.error('Location error:', locationError);
            // Use default location if GPS fails (Szeged city center)
            userLocation = {
              latitude: 46.2530,
              longitude: 20.1484,
            };
            set({ error: 'GPS unavailable, using default location' });
            console.log('Using default location (Szeged)');
          }
        }

        set({ userLocation });

        // Step 2: Serve cached home markers immediately if available
        if (homeMarkersCache.length > 0) {
          set({ homeMarkers: homeMarkersCache });
          updateCombinedMarkers();
          set({ loading: false });
          
          // Continue fetching fresh data in background
          setTimeout(() => {
            fetchNearbyMarkers(userLocation!.latitude, userLocation!.longitude, 5000, true)
              .then(markers => {
                homeMarkersCache = markers;
                set({ homeMarkers: markers });
                updateCombinedMarkers();
              })
              .catch(error => console.error('Background marker refresh failed:', error));
          }, 100);
          return;
        }

        // Step 3: Fetch home markers with timeout
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
          const homeMarkers = await Promise.race([markersPromise, timeoutPromise]);
          homeMarkersCache = homeMarkers; // Cache for next time
          set({ homeMarkers, loading: false });
          updateCombinedMarkers();
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
      
      set({ loading: true, error: null });

      try {
        // Force fresh location update - clear cache first
        locationCache = null;
        
        // Get fresh location permission first
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          set({ error: 'Location permission denied', loading: false });
          return;
        }

        let userLocation;
        
        try {
          // First try: Current location with good accuracy
          const location = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Location timeout')), 8000);
            })
          ]);

          userLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          console.log('Fresh location acquired:', userLocation);
          
        } catch (locationError) {
          console.error('Fresh location error:', locationError);
          // Fallback to last known if fresh fails
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (lastKnown && lastKnown.coords) {
            userLocation = {
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude,
            };
            console.log('Using last known location as fallback');
          } else {
            // Use default location if all fails
            userLocation = {
              latitude: 46.2530,
              longitude: 20.1484,
            };
            console.log('Using default location (Szeged)');
          }
        }

        // Update cache and state
        locationCache = userLocation;
        set({ userLocation });

        // Fetch markers for the new location
        try {
          const homeMarkers = await Promise.race([
            fetchNearbyMarkers(userLocation.latitude, userLocation.longitude, 5000, true),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Markers timeout')), 6000);
            })
          ]);

          homeMarkersCache = homeMarkers;
          set({ homeMarkers, loading: false });
          updateCombinedMarkers();
        } catch (error) {
          console.error('Markers refresh failed:', error);
          set({ loading: false });
        }

      } catch (error) {
        console.error('Location refresh failed:', error);
        set({ error: 'Failed to refresh location', loading: false });
      }
    },

    searchAtLocation: async (latitude: number, longitude: number) => {
      set({ loading: true, error: null });

      try {
        console.log('Searching at location:', { latitude, longitude });
        
        const searchResults = await Promise.race([
          fetchNearbyMarkers(latitude, longitude, 5000, true),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Search timeout')), 6000);
          })
        ]);

        // Add search results to existing markers (don't replace home markers)
        set({ searchMarkers: searchResults, loading: false });
        updateCombinedMarkers();
        console.log('Search completed, found', searchResults.length, 'new markers');

      } catch (error) {
        console.error('Search at location failed:', error);
        set({ error: 'Failed to search at this location', loading: false });
      }
    },

    clearSearchResults: () => {
      set({ searchMarkers: [] });
      updateCombinedMarkers();
      console.log('Search results cleared, showing only home markers');
    },
  };
}); 