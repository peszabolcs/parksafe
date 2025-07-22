// Optimized marker data and distance calculation for ParkSafe
import { supabase } from './supabase';
import { parseCoordinate, testWKBParsing } from './wkbParser';

// Test WKB parsing on module load
testWKBParsing();

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

// Process raw database data with WKB coordinates
const processRawLocationData = (item: any): any => {
  // If we have WKB coordinates, parse them
  if (item.coordinate && typeof item.coordinate === 'string') {
    const parsedCoord = parseCoordinate(item.coordinate);
    if (parsedCoord) {
      return {
        ...item,
        latitude: parsedCoord.latitude,
        longitude: parsedCoord.longitude,
      };
    }
  }
  
  // If we already have lat/lng, use them
  if (item.lat && item.lon) {
    return {
      ...item,
      latitude: item.lat,
      longitude: item.lon,
    };
  }
  
  // If we have latitude/longitude, use them
  if (item.latitude && item.longitude) {
    return item;
  }
  
  return null;
};

// Unified validation function
const validateLocationData = (item: any): boolean => {
  const processed = processRawLocationData(item);
  if (!processed) {
    console.warn('Could not process location data:', item);
    return false;
  }
  
  const isValid = processed.id && processed.name && 
         typeof processed.latitude === 'number' && 
         typeof processed.longitude === 'number';
  
  if (!isValid) {
    console.warn('Invalid location data after processing:', { 
      id: processed.id, 
      name: processed.name, 
      lat: typeof processed.latitude, 
      lng: typeof processed.longitude 
    });
  }
  
  return isValid;
};

// Unified mapping function for location data
const mapToMarker = (
  item: any, 
  type: 'parking' | 'repairStation' | 'bicycleService',
  distance?: number
): MapMarker => {
  const processed = processRawLocationData(item);
  if (!processed) {
    throw new Error('Could not process location data for mapping');
  }
  
  return {
    id: processed.id,
    coordinate: {
      latitude: processed.latitude,
      longitude: processed.longitude
    },
    type,
    title: processed.name,
    description: processed.description || '',
    available: processed.available ?? true,
    covered: processed.covered,
    city: processed.city,
    ...(type === 'repairStation' && {
      free: processed.free,
      pictureUrl: processed.pictureUrl,
    }),
    ...(type === 'bicycleService' && {
      phone: processed.phone,
      website: processed.website,
      openingHours: processed.opening_hours,
      services: processed.services,
      rating: processed.rating,
      priceRange: processed.price_range,
      pictureUrl: processed.picture_url,
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
      console.log(`No data returned from ${rpcName}`);
      return [];
    }
    
    console.log(`Raw data from ${rpcName}:`, data.slice(0, 2)); // Log first 2 items
    
    const validData = data.filter(validateLocationData);
    console.log(`Valid data after processing:`, validData.length);
    
    const mappedData = validData.map((item: any) => {
      try {
        return mapToMarker(
          item, 
          type || (rpcName.includes('parking') ? 'parking' : 
                   rpcName.includes('bicycle') ? 'bicycleService' : 'repairStation'),
          item.distance_meters
        );
      } catch (error) {
        console.error('Error mapping item:', error, item);
        return null;
      }
    }).filter(Boolean);
    
    console.log(`Successfully mapped ${mappedData.length} markers`);
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

// Test function with sample data
export const generateTestMarkers = (): MapMarker[] => {
  const sampleData = [
    {
      "id": "0d36f5b3-23e6-4e02-aef3-514efc9a1807",
      "coordinate": "0101000020E6100000D735B5C766123340F9A3A833F7BF4740",
      "name": "biciklitároló",
      "description": null,
      "available": true,
      "city": "",
      "covered": false,
      "created_at": "2025-07-17 14:49:53.820401+00",
      "updated_at": "2025-07-17 14:49:53.820401+00",
      "lon": null,
      "lat": null
    },
    {
      "id": "5ee9d20e-9388-4624-8b92-9d1b154dc34b",
      "coordinate": "0101000020E6100000D184DCFB0A1233406D73637AC2BF4740",
      "name": "biciklitároló",
      "description": null,
      "available": true,
      "city": "",
      "covered": false,
      "created_at": "2025-07-17 14:49:53.820401+00",
      "updated_at": "2025-07-17 14:49:53.820401+00",
      "lon": null,
      "lat": null
    }
  ];

  console.log('Processing test data...');
  const markers: MapMarker[] = [];
  
  for (const item of sampleData) {
    try {
      const processed = processRawLocationData(item);
      if (processed) {
        const marker = mapToMarker(processed, 'parking');
        markers.push(marker);
        console.log('Created marker:', marker);
      } else {
        console.log('Failed to process item:', item);
      }
    } catch (error) {
      console.error('Error processing test item:', error, item);
    }
  }
  
  console.log('Generated test markers:', markers.length);
  return markers;
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

// Get total counts for all location types
export const getTotalLocationCounts = async (): Promise<{parking: number, repairStation: number, bicycleService: number, total: number}> => {
  try {
    const [parkingResponse, repairResponse, bicycleResponse] = await Promise.all([
      supabase.from('parkingSpots').select('id', { count: 'exact', head: true }),
      supabase.from('repairStation').select('id', { count: 'exact', head: true }),
      supabase.from('bicycleService').select('id', { count: 'exact', head: true })
    ]);

    const parkingCount = parkingResponse.count || 0;
    const repairCount = repairResponse.count || 0;
    const bicycleCount = bicycleResponse.count || 0;
    const total = parkingCount + repairCount + bicycleCount;

    // Debug log to see the actual counts
    console.log('Location counts:', {
      parking: parkingCount,
      repairStation: repairCount,
      bicycleService: bicycleCount,
      total
    });

    return {
      parking: parkingCount,
      repairStation: repairCount,
      bicycleService: bicycleCount,
      total
    };
  } catch (error) {
    console.error('Error fetching total location counts:', error);
    return {
      parking: 0,
      repairStation: 0,
      bicycleService: 0,
      total: 0
    };
  }
}; 