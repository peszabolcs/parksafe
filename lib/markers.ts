// Shared marker data and distance calculation for ParkSafe

export interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'parking' | 'repair';
  title: string;
  description: string;
  available: boolean;
}

// Generate static markers for Szeged
export const generateMarkers = (): MapMarker[] => {
  const parkingSpots: MapMarker[] = [
    {
      id: 'parking-1',
      coordinate: { latitude: 46.2530, longitude: 20.1484 },
      type: 'parking',
      title: 'Szeged Központi Parkoló',
      description: '12 szabad hely',
      available: true,
    },
    {
      id: 'parking-2',
      coordinate: { latitude: 46.2490, longitude: 20.1520 },
      type: 'parking',
      title: 'Dugonics tér Parkoló',
      description: '8 szabad hely',
      available: true,
    },
    {
      id: 'parking-3',
      coordinate: { latitude: 46.2570, longitude: 20.1440 },
      type: 'parking',
      title: 'Széchenyi tér Parkoló',
      description: '15 szabad hely',
      available: true,
    },
    {
      id: 'parking-4',
      coordinate: { latitude: 46.2510, longitude: 20.1400 },
      type: 'parking',
      title: 'Dóm tér Parkoló',
      description: '6 szabad hely',
      available: false,
    },
  ];

  const repairShops: MapMarker[] = [
    {
      id: 'repair-1',
      coordinate: { latitude: 46.2550, longitude: 20.1500 },
      type: 'repair',
      title: 'Bike Service Szeged',
      description: 'Nyitva',
      available: true,
    },
    {
      id: 'repair-2',
      coordinate: { latitude: 46.2480, longitude: 20.1550 },
      type: 'repair',
      title: 'Bringa Szerviz Kft.',
      description: 'Nyitva',
      available: true,
    },
    {
      id: 'repair-3',
      coordinate: { latitude: 46.2600, longitude: 20.1420 },
      type: 'repair',
      title: 'Cycling Center',
      description: 'Zárva',
      available: false,
    },
    {
      id: 'repair-4',
      coordinate: { latitude: 46.2500, longitude: 20.1350 },
      type: 'repair',
      title: 'Bicikli Műhely',
      description: 'Nyitva',
      available: true,
    },
    {
      id: 'repair-5',
      coordinate: { latitude: 46.2560, longitude: 20.1580 },
      type: 'repair',
      title: 'Szeged Bike Repair',
      description: 'Nyitva',
      available: true,
    },
  ];

  return [...parkingSpots, ...repairShops];
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