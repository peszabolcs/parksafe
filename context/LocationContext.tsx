import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { generateAllMarkers, getDistance, MapMarker } from '../lib/markers';

interface LocationContextType {
  userLocation: { latitude: number; longitude: number } | null;
  markers: MapMarker[];
  nearbyMarkers: (MapMarker & { distance: number })[];
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [nearbyMarkers, setNearbyMarkers] = useState<(MapMarker & { distance: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for markers to avoid refetching
  const markersCache = useRef<MapMarker[] | null>(null);
  const lastLocationUpdate = useRef<{ latitude: number; longitude: number } | null>(null);

  // Calculate nearby markers with distance
  const calculateNearbyMarkers = useCallback((location: { latitude: number; longitude: number }, markerList: MapMarker[]) => {
    // Skip calculation if location hasn't changed significantly (< 10 meters)
    if (lastLocationUpdate.current) {
      const distance = getDistance(
        lastLocationUpdate.current.latitude,
        lastLocationUpdate.current.longitude,
        location.latitude,
        location.longitude
      );
      if (distance < 10) {
        return nearbyMarkers; // Return cached result
      }
    }
    
    lastLocationUpdate.current = location;
    const withDistance = markerList.map(m => ({
      ...m,
      distance: getDistance(
        location.latitude, 
        location.longitude, 
        m.coordinate.latitude, 
        m.coordinate.longitude
      )
    }));
    return withDistance.sort((a, b) => a.distance - b.distance);
  }, [nearbyMarkers]);

  const fetchLocationAndMarkers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get location permission and current position
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      const [locationResult, markersResult] = await Promise.allSettled([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Faster than High accuracy
        }),
        // Use cache if available, otherwise fetch fresh data
        markersCache.current ? Promise.resolve(markersCache.current) : generateAllMarkers()
      ]);

      let newUserLocation: { latitude: number; longitude: number } | null = null;
      let generatedMarkers: MapMarker[] = [];

      if (locationResult.status === 'fulfilled') {
        newUserLocation = { 
          latitude: locationResult.value.coords.latitude, 
          longitude: locationResult.value.coords.longitude 
        };
        setUserLocation(newUserLocation);
      } else {
        console.error('Error getting location:', locationResult.reason);
        setError('Failed to get location');
      }

      if (markersResult.status === 'fulfilled') {
        generatedMarkers = markersResult.value;
        markersCache.current = generatedMarkers; // Cache the results
        setMarkers(generatedMarkers);
      } else {
        console.error('Error getting markers:', markersResult.reason);
        // Use cached markers if available
        if (markersCache.current) {
          generatedMarkers = markersCache.current;
          setMarkers(generatedMarkers);
        }
      }

      // Calculate nearby markers if we have both location and markers
      if (newUserLocation && generatedMarkers.length > 0) {
        const nearby = calculateNearbyMarkers(newUserLocation, generatedMarkers);
        setNearbyMarkers(nearby);
      }
    } catch (err) {
      console.error('Error fetching location and markers:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = useCallback(async () => {
    // Force refresh - clear cache
    markersCache.current = null;
    await fetchLocationAndMarkers();
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchLocationAndMarkers();
  }, []);

  // Watch for location updates with reduced sensitivity
  useEffect(() => {
    if (!userLocation) return;

    let locationSubscription: Location.LocationSubscription | null = null;

    Location.watchPositionAsync(
      { 
        accuracy: Location.Accuracy.Balanced, 
        distanceInterval: 50, // Increased from 10 to reduce updates
        timeInterval: 10000, // Only update every 10 seconds at most
      },
      (loc) => {
        const newLocation = { 
          latitude: loc.coords.latitude, 
          longitude: loc.coords.longitude 
        };
        setUserLocation(newLocation);

        // Only recalculate if markers are available
        if (markers.length > 0) {
          const nearby = calculateNearbyMarkers(newLocation, markers);
          setNearbyMarkers(nearby);
        }
      }
    ).then(subscription => {
      locationSubscription = subscription;
    }).catch(err => {
      console.error('Error setting up location watch:', err);
    });

    return () => {
      locationSubscription?.remove();
    };
  }, [markers, calculateNearbyMarkers]);

  return (
    <LocationContext.Provider value={{
      userLocation,
      markers,
      nearbyMarkers,
      loading,
      error,
      refreshLocation,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
} 