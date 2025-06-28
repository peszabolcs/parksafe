// Shared marker data and distance calculation for ParkSafe
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
  // Additional fields for repair stations
  covered?: boolean;
  averagePoint?: number;
  free?: boolean;
  city?: string;
  pictureUrl?: string;
}

// Interface for Supabase repair station data
export interface RepairStation {
  id: string;
  coordinate: { latitude: number; longitude: number };
  name: string;
  description: string;
  available: boolean;
  covered: boolean;
  averagePoint: number;
  free: boolean;
  city: string;
  pictureUrl: string;
}

// Interface for Supabase parking spot data
export interface ParkingSpot {
  id: string;
  coordinate: { latitude: number; longitude: number };
  name: string;
  description: string;
  available: boolean;
  city: string;
}

// Fetch parking spots from Supabase
export const fetchParkingSpots = async (): Promise<MapMarker[]> => {
  try {
    console.log('Fetching parking spots from Supabase...');
    const { data, error } = await supabase
      .from('parkingSpots')
      .select('id, coordinate, name, description, available, city');

    if (error) {
      console.error('Error fetching parking spots:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No parking spots data found');
      return [];
    }

    const mappedData = data
      .filter((spot: any) => {
        // Quick validation - only check essential fields
        return spot.id && spot.name && spot.coordinate && 
               typeof spot.coordinate.latitude === 'number' && 
               typeof spot.coordinate.longitude === 'number';
      })
      .map((spot: ParkingSpot) => ({
        id: spot.id,
        coordinate: spot.coordinate,
        type: 'parking' as const,
        title: spot.name,
        description: spot.description || '',
        available: spot.available ?? true,
        city: spot.city,
      }));

    console.log(`Processed ${mappedData.length}/${data.length} parking spots`);
    return mappedData;
  } catch (error) {
    console.error('Error fetching parking spots:', error);
    return [];
  }
};

// Fetch repair stations from Supabase
export const fetchRepairStations = async (): Promise<MapMarker[]> => {
  try {
    console.log('Fetching repair stations from Supabase...');
    const { data, error } = await supabase
      .from('repairStation')
      .select('id, coordinate, name, description, available, covered, averagePoint, free, city, pictureUrl');

    if (error) {
      console.error('Error fetching repair stations:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No repair stations data found');
      return [];
    }

    const mappedData = data
      .filter((station: any) => {
        // Quick validation - only check essential fields
        return station.id && station.name && station.coordinate && 
               typeof station.coordinate.latitude === 'number' && 
               typeof station.coordinate.longitude === 'number';
      })
      .map((station: RepairStation) => ({
        id: station.id,
        coordinate: station.coordinate,
        type: 'repairStation' as const,
        title: station.name,
        description: station.description || '',
        available: station.available ?? true,
        covered: station.covered,
        averagePoint: station.averagePoint,
        free: station.free,
        city: station.city,
        pictureUrl: station.pictureUrl,
      }));

    console.log(`Processed ${mappedData.length}/${data.length} repair stations`);
    return mappedData;
  } catch (error) {
    console.error('Error fetching repair stations:', error);
    return [];
  }
};

// Generate all markers including parking spots and repair stations from Supabase
export const generateAllMarkers = async (): Promise<MapMarker[]> => {
  try {
    console.log('Generating all markers...');
    
    // Fetch both data sources in parallel for better performance
    const [parkingSpots, repairStations] = await Promise.allSettled([
      fetchParkingSpots(),
      fetchRepairStations()
    ]);
    
    let parkingSpotsData: MapMarker[] = [];
    let repairStationsData: MapMarker[] = [];
    
    if (parkingSpots.status === 'fulfilled') {
      parkingSpotsData = parkingSpots.value;
      console.log(`Loaded ${parkingSpotsData.length} parking spots`);
    } else {
      console.error('Error fetching parking spots:', parkingSpots.reason);
    }
    
    if (repairStations.status === 'fulfilled') {
      repairStationsData = repairStations.value;
      console.log(`Loaded ${repairStationsData.length} repair stations`);
    } else {
      console.error('Error fetching repair stations:', repairStations.reason);
    }
    
    const allMarkers = [...parkingSpotsData, ...repairStationsData];
    console.log(`Total markers loaded: ${allMarkers.length}`);
    return allMarkers;
  } catch (error) {
    console.error('Error in generateAllMarkers:', error);
    return [];
  }
};

// Haversine formula for distance in meters
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371e3; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
} 