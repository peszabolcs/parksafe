// Optimized marker data and distance calculation for ParkSafe
import { supabase } from './supabase';

export interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'parking' | 'repairStation' | 'bicycleService';
  title: string;
  description: string;
  available: boolean;
  covered?: boolean;
  free?: boolean;
  city?: string;
  pictureUrl?: string;
  distance?: number; // For nearby searches
  // Bicycle service specific fields
  phone?: string;
  website?: string;
  openingHours?: string;
  services?: string[];
  rating?: number;
  priceRange?: string;
}

// Base interface for location data
interface BaseLocationData {
  id: string;
  name: string;
  description: string;
  available: boolean;
  covered: boolean;
  city: string;
  latitude: number;
  longitude: number;
}

// Interface for parking spot data
export interface ParkingSpot extends BaseLocationData {}

// Interface for repair station data
export interface RepairStation extends BaseLocationData {
  free: boolean;
  pictureUrl: string;
}

// Interface for bicycle service data
export interface BicycleService extends BaseLocationData {
  phone?: string;
  website?: string;
  opening_hours?: string;
  services?: string[];
  rating?: number;
  price_range?: string;
  picture_url?: string;
}

// Unified validation function
const validateLocationData = (item: any): boolean => {
  const isValid = item.id && item.name && 
         typeof item.latitude === 'number' && 
         typeof item.longitude === 'number';
  
  if (!isValid) {
    console.warn('Invalid location data:', { 
      id: item.id, 
      name: item.name, 
      lat: typeof item.latitude, 
      lng: typeof item.longitude 
    });
  }
  
  return isValid;
};

// Unified mapping function for location data
const mapToMarker = (
  item: BaseLocationData | RepairStation | BicycleService, 
  type: 'parking' | 'repairStation' | 'bicycleService',
  distance?: number
): MapMarker => {
  return {
    id: item.id,
    coordinate: {
      latitude: item.latitude,
      longitude: item.longitude
    },
    type,
    title: item.name,
    description: item.description || '',
    available: item.available ?? true,
    covered: item.covered,
    city: item.city,
    ...(type === 'repairStation' && {
      free: (item as RepairStation).free,
      pictureUrl: (item as RepairStation).pictureUrl,
    }),
    ...(type === 'bicycleService' && {
      phone: (item as BicycleService).phone,
      website: (item as BicycleService).website,
      openingHours: (item as BicycleService).opening_hours,
      services: (item as BicycleService).services,
      rating: (item as BicycleService).rating,
      priceRange: (item as BicycleService).price_range,
      pictureUrl: (item as BicycleService).picture_url,
    }),
    ...(distance !== undefined && { distance })
  };
};

// Generic fetch function for RPC calls
const fetchFromRPC = async (
  rpcName: string, 
  params?: any,
  type?: 'parking' | 'repairStation' | 'bicycleService'
): Promise<MapMarker[]> => {
  try {
    const { data, error } = await supabase.rpc(rpcName, params);

    if (error) {
      console.error(`Error fetching from ${rpcName}:`, error);
      return [];
    }

    if (!data?.length) {
      return [];
    }
    
    const validData = data.filter(validateLocationData);
    const mappedData = validData.map((item: any) => mapToMarker(
      item, 
      type || (rpcName.includes('parking') ? 'parking' : 
               rpcName.includes('bicycle') ? 'bicycleService' : 'repairStation'),
      item.distance_meters
    ));
    
    return mappedData;
  } catch (error) {
    console.error(`Exception in ${rpcName}:`, error);
    return [];
  }
};

// Fetch all parking spots
export const fetchParkingSpots = async (): Promise<MapMarker[]> => {
  return fetchFromRPC('get_all_parking_spots', undefined, 'parking');
};

// Fetch all repair stations
export const fetchRepairStations = async (): Promise<MapMarker[]> => {
  return fetchFromRPC('get_all_repair_stations', undefined, 'repairStation');
};

// Fetch all bicycle services
export const fetchBicycleServices = async (): Promise<MapMarker[]> => {
  return fetchFromRPC('get_all_bicycle_services', undefined, 'bicycleService');
};

// Fetch nearby parking spots
export const fetchNearbyParkingSpots = async (
  userLatitude: number, 
  userLongitude: number, 
  radiusMeters: number = 1000,
  onlyAvailable: boolean = true
): Promise<MapMarker[]> => {
  return fetchFromRPC('find_nearby_parking_spots', {
    user_lat: userLatitude,
    user_lng: userLongitude,
    radius_meters: radiusMeters,
    only_available: onlyAvailable
  }, 'parking');
};

// Fetch nearby repair stations
export const fetchNearbyRepairStations = async (
  userLatitude: number, 
  userLongitude: number, 
  radiusMeters: number = 1000,
  onlyAvailable: boolean = true
): Promise<MapMarker[]> => {
  return fetchFromRPC('find_nearby_repair_stations', {
    user_lat: userLatitude,
    user_lng: userLongitude,
    radius_meters: radiusMeters,
    only_available: onlyAvailable
  }, 'repairStation');
};

// Fetch nearby bicycle services
export const fetchNearbyBicycleServices = async (
  userLatitude: number, 
  userLongitude: number, 
  radiusMeters: number = 1000,
  onlyAvailable: boolean = true
): Promise<MapMarker[]> => {
  return fetchFromRPC('find_nearby_bicycle_services', {
    user_lat: userLatitude,
    user_lng: userLongitude,
    radius_meters: radiusMeters,
    only_available: onlyAvailable
  }, 'bicycleService');
};

// Optimized fetch all types nearby with single call
export const fetchNearbyMarkers = async (
  userLatitude: number, 
  userLongitude: number, 
  radiusMeters: number = 5000,
  onlyAvailable: boolean = true
): Promise<MapMarker[]> => {
  const [parkingSpots, repairStations, bicycleServices] = await Promise.all([
    fetchNearbyParkingSpots(userLatitude, userLongitude, radiusMeters, onlyAvailable),
    fetchNearbyRepairStations(userLatitude, userLongitude, radiusMeters, onlyAvailable),
    fetchNearbyBicycleServices(userLatitude, userLongitude, radiusMeters, onlyAvailable)
  ]);
  
  const combinedMarkers = [...parkingSpots, ...repairStations, ...bicycleServices];
  const sortedMarkers = combinedMarkers.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  
  return sortedMarkers;
};

// Generate all markers (fallback for non-location based usage)
export const generateAllMarkers = async (): Promise<MapMarker[]> => {
  try {
    const [parkingSpots, repairStations, bicycleServices] = await Promise.all([
      fetchParkingSpots(),
      fetchRepairStations(),
      fetchBicycleServices()
    ]);
    
    return [...parkingSpots, ...repairStations, ...bicycleServices];
  } catch (error) {
    console.error('Error generating all markers:', error);
    return [];
  }
};

// Optimized distance calculation (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Fast distance approximation for short distances (more performant)
export const getDistanceFast = calculateDistance; // Use same function, simplified

// Legacy alias for backward compatibility
export const getDistance = calculateDistance; 