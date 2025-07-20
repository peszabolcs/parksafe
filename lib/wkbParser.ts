/**
 * WKB (Well-Known Binary) Parser for PostGIS geometries
 * Converts WKB hex strings to [longitude, latitude] coordinates
 */

export interface ParsedCoordinate {
  longitude: number;
  latitude: number;
}

/**
 * Parses a WKB hex string from PostGIS to extract longitude and latitude
 * 
 * WKB Format for Point:
 * - Byte order (1 byte): 01 = little endian, 00 = big endian
 * - Geometry type (4 bytes): 01000000 = Point, 20000000 = Point with SRID
 * - SRID (4 bytes, if present): E6100000 = 4326 (WGS84)
 * - X coordinate (8 bytes): longitude as IEEE 754 double
 * - Y coordinate (8 bytes): latitude as IEEE 754 double
 */
export function parseWKBPoint(wkbHex: string): ParsedCoordinate | null {
  try {
    // Remove any whitespace and ensure even length
    const hex = wkbHex.trim();
    if (hex.length % 2 !== 0) {
      throw new Error('Invalid WKB hex string length');
    }

    // Convert hex string to bytes
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }

    // Create DataView for reading binary data
    const view = new DataView(bytes.buffer);
    let offset = 0;

    // Read byte order (1 byte)
    const byteOrder = view.getUint8(offset);
    offset += 1;
    const littleEndian = byteOrder === 1;

    // Read geometry type (4 bytes)
    const geometryType = view.getUint32(offset, littleEndian);
    offset += 4;

    // Check if SRID is present (geometry type will have SRID flag)
    const hasSRID = (geometryType & 0x20000000) !== 0;
    const actualGeometryType = geometryType & 0x1FFFFFFF;

    // Verify it's a Point geometry (type 1)
    if (actualGeometryType !== 1) {
      throw new Error(`Unsupported geometry type: ${actualGeometryType}`);
    }

    // Skip SRID if present (4 bytes)
    if (hasSRID) {
      offset += 4;
    }

    // Read X coordinate (longitude) - 8 bytes
    const longitude = view.getFloat64(offset, littleEndian);
    offset += 8;

    // Read Y coordinate (latitude) - 8 bytes
    const latitude = view.getFloat64(offset, littleEndian);

    // Validate coordinates
    if (isNaN(longitude) || isNaN(latitude)) {
      throw new Error('Invalid coordinates in WKB');
    }

    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      throw new Error('Coordinates out of valid range');
    }

    return {
      longitude,
      latitude,
    };
  } catch (error) {
    console.error('Error parsing WKB:', error);
    return null;
  }
}

/**
 * Convert a coordinate to GeoJSON Point format for supercluster
 */
export function coordinateToGeoJSONPoint(
  coordinate: ParsedCoordinate,
  properties: any = {}
): GeoJSON.Feature<GeoJSON.Point> {
  return {
    type: 'Feature',
    properties,
    geometry: {
      type: 'Point',
      coordinates: [coordinate.longitude, coordinate.latitude],
    },
  };
}

/**
 * Parse WKB and convert directly to GeoJSON Point
 */
export function wkbToGeoJSONPoint(
  wkbHex: string,
  properties: any = {}
): GeoJSON.Feature<GeoJSON.Point> | null {
  const coordinate = parseWKBPoint(wkbHex);
  if (!coordinate) {
    return null;
  }
  return coordinateToGeoJSONPoint(coordinate, properties);
}

/**
 * Batch convert multiple WKB points to GeoJSON features
 */
export function parseWKBBatch(
  items: Array<{ wkb: string; properties?: any }>
): GeoJSON.Feature<GeoJSON.Point>[] {
  const results: GeoJSON.Feature<GeoJSON.Point>[] = [];
  
  for (const item of items) {
    const feature = wkbToGeoJSONPoint(item.wkb, item.properties || {});
    if (feature) {
      results.push(feature);
    }
  }
  
  return results;
}

/**
 * Test function with your sample WKB
 */
export function testWKBParser(): void {
  const sampleWKB = "0101000020E6100000D735B5C766123340F9A3A833F7BF4740";
  const result = parseWKBPoint(sampleWKB);
  console.log('Sample WKB parsing result:', result);
  
  if (result) {
    const geoJSON = coordinateToGeoJSONPoint(result, { id: 'test', name: 'Test Point' });
    console.log('GeoJSON result:', geoJSON);
  }
}