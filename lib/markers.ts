// Optimized marker data and distance calculation for ParkSafe
import { supabase } from './supabase';

export interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'parking' | 'repairStation';
  title: string;
  description: string;
  available: boolean;
  covered?: boolean;
  free?: boolean;
  city?: string;
  pictureUrl?: string;
  distance?: number; // For nearby searches
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

// Unified validation function
const validateLocationData = (item: any): boolean => {
  const isValid = item.id && item.name && 
         typeof item.latitude === 'number' && 
         typeof item.longitude === 'number';
  
  if (!isValid) {
    console.log('❌ Invalid location data:', { 
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
  item: BaseLocationData | RepairStation, 
  type: 'parking' | 'repairStation',
  distance?: number
): MapMarker => {
  console.log(`🔄 Mapping ${type} marker:`, item.name, distance ? `(${Math.round(distance)}m)` : '');
  
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
    ...(distance !== undefined && { distance })
  };
};

// Generic fetch function for RPC calls
const fetchFromRPC = async (
  rpcName: string, 
  params?: any,
  type?: 'parking' | 'repairStation'
): Promise<MapMarker[]> => {
  console.log('🚀 Starting RPC call:', rpcName, params ? 'with params' : 'no params');
  console.time(`⏱️ ${rpcName} execution time`);
  
  try {
    console.log('📡 Calling Supabase RPC:', rpcName);
    const { data, error } = await supabase.rpc(rpcName, params);

    if (error) {
      console.error(`❌ Error fetching from ${rpcName}:`, error);
      console.timeEnd(`⏱️ ${rpcName} execution time`);
      return [];
    }

    if (!data?.length) {
      console.log(`ℹ️ No data returned from ${rpcName}`);
      console.timeEnd(`⏱️ ${rpcName} execution time`);
      return [];
    }

    console.log(`✅ Raw data from ${rpcName}:`, data.length, 'items');
    
    const validData = data.filter(validateLocationData);
    console.log(`✨ Valid data after filtering:`, validData.length, 'items');
    
    const mappedData = validData.map((item: any) => mapToMarker(
      item, 
      type || (rpcName.includes('parking') ? 'parking' : 'repairStation'),
      item.distance_meters
    ));
    
    console.log(`🎯 Final mapped data:`, mappedData.length, 'markers');
    console.timeEnd(`⏱️ ${rpcName} execution time`);
    
    return mappedData;
  } catch (error) {
    console.error(`💥 Exception in ${rpcName}:`, error);
    console.timeEnd(`⏱️ ${rpcName} execution time`);
    return [];
  }
};

// Fetch all parking spots
export const fetchParkingSpots = async (): Promise<MapMarker[]> => {
  console.log('🅿️ Fetching all parking spots...');
  return fetchFromRPC('get_all_parking_spots', undefined, 'parking');
};

// Fetch all repair stations
export const fetchRepairStations = async (): Promise<MapMarker[]> => {
  console.log('🔧 Fetching all repair stations...');
  return fetchFromRPC('get_all_repair_stations', undefined, 'repairStation');
};

// Fetch nearby parking spots
export const fetchNearbyParkingSpots = async (
  userLatitude: number, 
  userLongitude: number, 
  radiusMeters: number = 1000,
  onlyAvailable: boolean = true
): Promise<MapMarker[]> => {
  console.log('📍 Fetching nearby parking spots:', {
    location: `${userLatitude.toFixed(4)}, ${userLongitude.toFixed(4)}`,
    radius: `${radiusMeters}m`,
    onlyAvailable
  });
  
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
  console.log('🛠️ Fetching nearby repair stations:', {
    location: `${userLatitude.toFixed(4)}, ${userLongitude.toFixed(4)}`,
    radius: `${radiusMeters}m`,
    onlyAvailable
  });
  
  return fetchFromRPC('find_nearby_repair_stations', {
    user_lat: userLatitude,
    user_lng: userLongitude,
    radius_meters: radiusMeters,
    only_available: onlyAvailable
  }, 'repairStation');
};

// Optimized fetch both types nearby with single call
export const fetchNearbyMarkers = async (
  userLatitude: number, 
  userLongitude: number, 
  radiusMeters: number = 1000,
  onlyAvailable: boolean = true
): Promise<MapMarker[]> => {
  console.log('🎯 Fetching nearby markers (combined):', {
    location: `${userLatitude.toFixed(4)}, ${userLongitude.toFixed(4)}`,
    radius: `${radiusMeters}m`,
    onlyAvailable
  });
  console.time('⏱️ Combined nearby markers fetch');
  
  console.log('🔄 Starting parallel fetch for parking spots and repair stations...');
  const [parkingSpots, repairStations] = await Promise.all([
    fetchNearbyParkingSpots(userLatitude, userLongitude, radiusMeters, onlyAvailable),
    fetchNearbyRepairStations(userLatitude, userLongitude, radiusMeters, onlyAvailable)
  ]);
  
  console.log('📊 Parallel fetch results:', {
    parkingSpots: parkingSpots.length,
    repairStations: repairStations.length
  });
  
  const combinedMarkers = [...parkingSpots, ...repairStations];
  console.log('🔗 Combined markers before sorting:', combinedMarkers.length);
  
  const sortedMarkers = combinedMarkers.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  console.log('📈 Sorted markers by distance:', sortedMarkers.length);
  
  console.timeEnd('⏱️ Combined nearby markers fetch');
  return sortedMarkers;
};

// Generate all markers (fallback for non-location based usage)
export const generateAllMarkers = async (): Promise<MapMarker[]> => {
  console.log('🗂️ Generating all markers (fallback mode)...');
  console.time('⏱️ Generate all markers');
  
  console.log('🔄 Starting parallel fetch for all data...');
  const [parkingSpots, repairStations] = await Promise.all([
    fetchParkingSpots(),
    fetchRepairStations()
  ]);
  
  console.log('📊 All markers fetch results:', {
    parkingSpots: parkingSpots.length,
    repairStations: repairStations.length,
    total: parkingSpots.length + repairStations.length
  });
  
  const allMarkers = [...parkingSpots, ...repairStations];
  console.timeEnd('⏱️ Generate all markers');
  
  return allMarkers;
};

// Optimized distance calculation (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) ** 2 + 
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
            Math.sin(dLon / 2) ** 2;
  
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Only log for very close calculations to avoid spam
  if (distance < 100) {
    console.log(`📏 Distance calculated: ${Math.round(distance)}m`);
  }
  
  return distance;
};

// Fast distance approximation for short distances (more performant)
export const getDistanceFast = calculateDistance; // Use same function, simplified

// Legacy alias for backward compatibility
export const getDistance = calculateDistance; 