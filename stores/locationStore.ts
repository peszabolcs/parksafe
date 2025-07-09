import { create } from 'zustand';
import * as Location from 'expo-location';
import { calculateDistance, MapMarker, fetchNearbyMarkers, generateAllMarkers } from '../lib/markers';
import { PERFORMANCE_CONFIG } from '../constants/Performance';

interface LocationState {
  userLocation: { latitude: number; longitude: number } | null;
  markers: MapMarker[];
  nearbyMarkers: (MapMarker & { distance: number })[];
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  initializeLocation: () => Promise<void>;
  fetchNearbyMarkersOptimized: (radiusMeters?: number, onlyAvailable?: boolean) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => {
  console.log('🏪 Location Store initialized');
  
  // Optimized caching using performance constants
  let markersCache: MapMarker[] | null = null;
  let nearbyCache: { 
    markers: (MapMarker & { distance: number })[], 
    location: { latitude: number; longitude: number },
    timestamp: number,
    radius: number
  } | null = null;
  let locationSubscription: Location.LocationSubscription | null = null;

  // Check if location has changed significantly
  const hasLocationChanged = (
    oldLoc: { latitude: number; longitude: number },
    newLoc: { latitude: number; longitude: number }
  ): boolean => {
    const distance = calculateDistance(
      oldLoc.latitude, 
      oldLoc.longitude, 
      newLoc.latitude, 
      newLoc.longitude
    );
    
    const hasChanged = distance > PERFORMANCE_CONFIG.LOCATION.UPDATE_THRESHOLD;
    
    console.log('📍 Location change check:', {
      distance: `${Math.round(distance)}m`,
      threshold: `${PERFORMANCE_CONFIG.LOCATION.UPDATE_THRESHOLD}m`,
      hasChanged: hasChanged ? '✅ Significant change' : '❌ No significant change'
    });
    
    return hasChanged;
  };

  // Optimized nearby markers calculation with smart caching
  const calculateNearbyMarkers = (
    location: { latitude: number; longitude: number }, 
    markerList: MapMarker[]
  ): (MapMarker & { distance: number })[] => {
    console.log('🧮 Starting nearby markers calculation...');
    console.time('⏱️ Calculate nearby markers');
    
    const now = Date.now();
    
    // Check cache validity using performance config
    if (nearbyCache) {
      const cacheAge = now - nearbyCache.timestamp;
      const locationChanged = hasLocationChanged(nearbyCache.location, location);
      
      console.log('💾 Cache check:', {
        cacheAge: `${Math.round(cacheAge / 1000)}s`,
        maxAge: `${PERFORMANCE_CONFIG.LOCATION.CACHE_DURATION / 1000}s`,
        locationChanged,
        cacheValid: !locationChanged && cacheAge < PERFORMANCE_CONFIG.LOCATION.CACHE_DURATION
      });
      
      if (!locationChanged && cacheAge < PERFORMANCE_CONFIG.LOCATION.CACHE_DURATION) {
        console.log('🎯 Cache HIT - Using cached nearby markers:', nearbyCache.markers.length);
        console.timeEnd('⏱️ Calculate nearby markers');
        return nearbyCache.markers;
      } else {
        console.log('❌ Cache MISS - Recalculating nearby markers');
      }
    } else {
      console.log('🆕 No cache available - First calculation');
    }
    
    // Calculate new nearby markers with memory optimization
    console.log('🔄 Processing markers:', {
      totalMarkers: markerList.length,
      memoryLimit: PERFORMANCE_CONFIG.MEMORY.MAX_CACHED_MARKERS
    });
    
    const limitedMarkers = markerList.slice(0, PERFORMANCE_CONFIG.MEMORY.MAX_CACHED_MARKERS);
    console.log('📝 Markers after memory limit:', limitedMarkers.length);
    
    const withDistance = limitedMarkers.map(marker => {
      const distance = calculateDistance(
        location.latitude, 
        location.longitude, 
        marker.coordinate.latitude, 
        marker.coordinate.longitude
      );
      
      return {
        ...marker,
        distance
      };
    });
    
    console.log('📏 Distance calculations completed for', withDistance.length, 'markers');
    
    const sortedMarkers = withDistance.sort((a, b) => a.distance - b.distance);
    console.log('📊 Markers sorted by distance');
    
    // Update cache
    nearbyCache = {
      markers: sortedMarkers,
      location: { ...location },
      timestamp: now,
      radius: PERFORMANCE_CONFIG.LOCATION.DEFAULT_RADIUS
    };
    
    console.log('💾 Cache UPDATED with new data');
    console.timeEnd('⏱️ Calculate nearby markers');
    
    return sortedMarkers;
  };

  // Optimized nearby search using PostGIS
  const fetchNearbyMarkersOptimized = async (
    radiusMeters: number = PERFORMANCE_CONFIG.LOCATION.DEFAULT_RADIUS, 
    onlyAvailable: boolean = true
  ) => {
    console.log('🚀 Starting optimized nearby markers fetch...');
    console.time('⏱️ Total fetchNearbyMarkersOptimized');
    
    const { userLocation } = get();
    if (!userLocation) {
      console.log('❌ No user location available');
      set({ error: 'Location not available' });
      return;
    }

    console.log('📍 User location:', {
      lat: userLocation.latitude.toFixed(4),
      lng: userLocation.longitude.toFixed(4)
    });

    // Enforce maximum radius
    const constrainedRadius = Math.min(radiusMeters, PERFORMANCE_CONFIG.LOCATION.MAX_RADIUS);
    if (constrainedRadius !== radiusMeters) {
      console.log('⚠️ Radius constrained:', {
        requested: `${radiusMeters}m`,
        constrained: `${constrainedRadius}m`,
        max: `${PERFORMANCE_CONFIG.LOCATION.MAX_RADIUS}m`
      });
    }

    // Check if we can use cached results
    if (nearbyCache) {
      const cacheAge = Date.now() - nearbyCache.timestamp;
      const locationChanged = hasLocationChanged(nearbyCache.location, userLocation);
      const radiusOk = nearbyCache.radius >= constrainedRadius;
      
      console.log('🔍 PostGIS cache check:', {
        cacheAge: `${Math.round(cacheAge / 1000)}s`,
        maxAge: `${PERFORMANCE_CONFIG.LOCATION.CACHE_DURATION / 1000}s`,
        locationChanged,
        radiusOk: radiusOk ? `✅ (cached: ${nearbyCache.radius}m >= requested: ${constrainedRadius}m)` : '❌',
        canUseCache: !locationChanged && cacheAge < PERFORMANCE_CONFIG.LOCATION.CACHE_DURATION && radiusOk
      });
      
      if (!locationChanged && 
          cacheAge < PERFORMANCE_CONFIG.LOCATION.CACHE_DURATION &&
          radiusOk) {
        console.log('🎯 PostGIS Cache HIT - Using cached results:', nearbyCache.markers.length, 'markers');
        set({ nearbyMarkers: nearbyCache.markers, error: null });
        console.timeEnd('⏱️ Total fetchNearbyMarkersOptimized');
        return;
      } else {
        console.log('❌ PostGIS Cache MISS - Fetching fresh data');
      }
    } else {
      console.log('🆕 No PostGIS cache - First fetch');
    }

    set({ loading: true, error: null });
    console.log('⏳ Loading state set to true');
    
    try {
      console.log('📡 Calling fetchNearbyMarkers API...');
      const nearbyMarkers = await fetchNearbyMarkers(
        userLocation.latitude, 
        userLocation.longitude, 
        constrainedRadius, 
        onlyAvailable
      );

      console.log('✅ API response received:', nearbyMarkers.length, 'markers');

      // Limit results for performance
      const limitedMarkers = nearbyMarkers.slice(0, PERFORMANCE_CONFIG.DATABASE.MAX_RESULTS);
      if (limitedMarkers.length !== nearbyMarkers.length) {
        console.log('✂️ Results limited for performance:', {
          original: nearbyMarkers.length,
          limited: limitedMarkers.length,
          limit: PERFORMANCE_CONFIG.DATABASE.MAX_RESULTS
        });
      }

      console.log('🔄 Processing marker distances...');
      const markersWithDistance = limitedMarkers.map(marker => ({
        ...marker,
        distance: marker.distance || calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          marker.coordinate.latitude,
          marker.coordinate.longitude
        )
      }));

      console.log('📊 Distance processing completed');

      // Update cache
      nearbyCache = {
        markers: markersWithDistance,
        location: { ...userLocation },
        timestamp: Date.now(),
        radius: constrainedRadius
      };

      console.log('💾 PostGIS cache updated:', {
        markerCount: markersWithDistance.length,
        location: `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`,
        radius: `${constrainedRadius}m`
      });

      set({ 
        nearbyMarkers: markersWithDistance,
        markers: limitedMarkers
      });

      console.log('✅ State updated with new markers');
    } catch (error) {
      console.error('💥 Error fetching nearby markers:', error);
      set({ error: 'Failed to fetch nearby markers' });
    } finally {
      set({ loading: false });
      console.log('⏳ Loading state set to false');
      console.timeEnd('⏱️ Total fetchNearbyMarkersOptimized');
    }
  };

  // Simplified location and markers fetching
  const fetchLocationAndMarkers = async () => {
    console.log('🌍 Starting location and markers fetch...');
    console.time('⏱️ Total fetchLocationAndMarkers');
    
    set({ loading: true, error: null });
    console.log('⏳ Loading state set to true');
    
    try {
      // Request location permission
      console.log('🔒 Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      console.log('🔒 Permission status:', status);
      
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        set({ error: 'Location permission denied', loading: false });
        return;
      }

      console.log('✅ Location permission granted');

      // Get current location with balanced accuracy
      console.log('📍 Getting current location...');
      console.time('⏱️ Get current position');
      
      const locationResult = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced
      });

      console.timeEnd('⏱️ Get current position');

      const newUserLocation = { 
        latitude: locationResult.coords.latitude, 
        longitude: locationResult.coords.longitude 
      };

      console.log('📍 Current location obtained:', {
        lat: newUserLocation.latitude.toFixed(6),
        lng: newUserLocation.longitude.toFixed(6),
        accuracy: `${Math.round(locationResult.coords.accuracy || 0)}m`
      });

      set({ userLocation: newUserLocation });
      console.log('💾 User location stored in state');

      // Use optimized nearby search if location is available
      if (newUserLocation) {
        console.log('🎯 Using location-based optimized search...');
        await fetchNearbyMarkersOptimized(PERFORMANCE_CONFIG.LOCATION.DEFAULT_RADIUS, true);
      } else {
        console.log('🗂️ Fallback to all markers (no location)...');
        // Fallback to all markers if location not available
        const allMarkers = markersCache || await generateAllMarkers();
        markersCache = allMarkers;
        
        const limitedMarkers = allMarkers.slice(0, PERFORMANCE_CONFIG.DATABASE.MAX_RESULTS);
        console.log('📝 Fallback markers loaded:', {
          total: allMarkers.length,
          limited: limitedMarkers.length
        });
        
        set({ markers: limitedMarkers });
      }
    } catch (error) {
      console.error('💥 Error fetching location and markers:', error);
      set({ error: 'Failed to fetch location and data' });
    } finally {
      set({ loading: false });
      console.log('⏳ Loading state set to false');
      console.timeEnd('⏱️ Total fetchLocationAndMarkers');
    }
  };

  // Optimized location watching using performance config
  const startLocationWatch = async () => {
    console.log('👀 Starting location watching...');
    
    if (locationSubscription) {
      console.log('⚠️ Removing existing location subscription');
      locationSubscription.remove();
    }

    try {
      console.log('📡 Setting up location watcher with config:', {
        accuracy: 'Balanced',
        distanceInterval: `${PERFORMANCE_CONFIG.LOCATION.UPDATE_THRESHOLD}m`,
        timeInterval: `${PERFORMANCE_CONFIG.LOCATION.UPDATE_INTERVAL / 1000}s`
      });
      
      locationSubscription = await Location.watchPositionAsync(
        { 
          accuracy: Location.Accuracy.Balanced, 
          distanceInterval: PERFORMANCE_CONFIG.LOCATION.UPDATE_THRESHOLD, 
          timeInterval: PERFORMANCE_CONFIG.LOCATION.UPDATE_INTERVAL 
        },
        (location) => {
          const newLocation = { 
            latitude: location.coords.latitude, 
            longitude: location.coords.longitude 
          };
          
          console.log('📍 Location update received:', {
            lat: newLocation.latitude.toFixed(6),
            lng: newLocation.longitude.toFixed(6),
            accuracy: `${Math.round(location.coords.accuracy || 0)}m`,
            timestamp: new Date(location.timestamp).toLocaleTimeString()
          });
          
          const { userLocation, markers } = get();
          
          // Only update if location changed significantly
          if (!userLocation || hasLocationChanged(userLocation, newLocation)) {
            console.log('✅ Significant location change detected - updating');
            set({ userLocation: newLocation });
            
            // Update nearby markers if we have cached markers
            if (markers.length > 0) {
              console.log('🔄 Recalculating nearby markers with new location...');
              const nearby = calculateNearbyMarkers(newLocation, markers);
              set({ nearbyMarkers: nearby });
              console.log('✅ Nearby markers updated');
            } else {
              console.log('ℹ️ No cached markers to recalculate');
            }
          } else {
            console.log('ℹ️ Location change not significant - ignoring');
          }
        }
      );
      
      console.log('✅ Location watcher started successfully');
    } catch (error) {
      console.error('💥 Error starting location watch:', error);
    }
  };

  // Cleanup function
  const cleanup = () => {
    console.log('🧹 Cleaning up location store...');
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
      console.log('✅ Location subscription removed');
    }
  };

  return {
    userLocation: null,
    markers: [],
    nearbyMarkers: [],
    loading: false,
    error: null,
    
    initializeLocation: async () => {
      console.log('🚀 Initializing location store...');
      console.time('⏱️ Total initialization');
      
      await fetchLocationAndMarkers();
      await startLocationWatch();
      
      console.timeEnd('⏱️ Total initialization');
      console.log('✅ Location store initialization complete');
    },
    
    refreshLocation: async () => {
      console.log('🔄 Refreshing location (clearing caches)...');
      
      // Clear caches for fresh data
      markersCache = null;
      nearbyCache = null;
      console.log('💾 Caches cleared');
      
      await fetchLocationAndMarkers();
      console.log('✅ Location refresh complete');
    },
    
    fetchNearbyMarkersOptimized
  };
}); 