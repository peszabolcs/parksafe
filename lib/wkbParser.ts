// WKB (Well-Known Binary) Parser for PostGIS coordinates
// Simplified version focusing on hex parsing for React Native compatibility

export interface ParsedCoordinate {
  latitude: number;
  longitude: number;
}

// Test function - simplified
export function testWKBParsing(): void {
  const testWKB = "0101000020E6100000D735B5C766123340F9A3A833F7BF4740";
  console.log('Testing WKB parsing with:', testWKB);
  
  const result = parseCoordinate(testWKB);
  console.log('WKB parsing result:', result);
}

// Primary parsing function - hex-based for reliability
export function parseCoordinate(wkbString: string): ParsedCoordinate | null {
  try {
    // Remove SRID prefix if present
    const cleanWkb = wkbString.replace(/^SRID=\d+;/, '');
    
    // Use hex parsing as primary method (more reliable in React Native)
    return parseWKBHex(cleanWkb);
  } catch (error) {
    console.error('Error parsing WKB coordinate:', error);
    return null;
  }
}

// Hex-based WKB parsing (primary method)
export function parseWKBHex(wkbHex: string): ParsedCoordinate | null {
  try {
    if (!wkbHex || wkbHex.length < 42) {
      console.warn('Invalid WKB hex string length:', wkbHex?.length);
      return null;
    }

    // Convert hex string to bytes
    const bytes: number[] = [];
    for (let i = 0; i < wkbHex.length; i += 2) {
      const hex = wkbHex.substr(i, 2);
      bytes.push(parseInt(hex, 16));
    }

    if (bytes.length < 21) {
      console.warn('Insufficient bytes for WKB parsing:', bytes.length);
      return null;
    }

    // Read geometry type (little endian, 4 bytes starting at byte 1)
    const geometryType = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24);
    
    // Check for Point geometry (1) or Point with SRID (0x20000001)
    const isPoint = geometryType === 1 || geometryType === 0x20000001;
    if (!isPoint) {
      console.warn('Not a Point geometry, type:', geometryType.toString(16));
      return null;
    }

    // Calculate coordinate start position
    const coordStart = geometryType === 0x20000001 ? 9 : 5;
    
    if (bytes.length < coordStart + 16) {
      console.warn('Not enough bytes for coordinates');
      return null;
    }

    // Parse coordinates (8 bytes each, little endian)
    const longitude = parseDoubleLE(bytes, coordStart);
    const latitude = parseDoubleLE(bytes, coordStart + 8);

    // Validate coordinates
    if (isNaN(longitude) || isNaN(latitude)) {
      console.warn('Invalid coordinates parsed');
      return null;
    }

    // Basic coordinate range validation
    if (Math.abs(longitude) > 180 || Math.abs(latitude) > 90) {
      console.warn('Coordinates out of valid range:', { longitude, latitude });
      return null;
    }

    return { longitude, latitude };
  } catch (error) {
    console.error('Error in hex WKB parsing:', error);
    return null;
  }
}

// Helper function to parse double from byte array (little endian)
function parseDoubleLE(bytes: number[], offset: number): number {
  try {
    // Create 8-byte array for double
    const doubleBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      doubleBytes[i] = bytes[offset + i];
    }
    
    // Use DataView to parse as double
    const view = new DataView(doubleBytes.buffer);
    return view.getFloat64(0, true); // true = little endian
  } catch (error) {
    console.error('Error parsing double:', error);
    return NaN;
  }
}

// Legacy Buffer-based parsing (fallback, simplified)
export function parseWKB(wkbString: string): ParsedCoordinate | null {
  try {
    // Fallback to hex parsing if Buffer is not working properly
    if (!global.Buffer || typeof global.Buffer.from !== 'function') {
      return parseWKBHex(wkbString);
    }

    const cleanWkb = wkbString.replace(/^SRID=\d+;/, '');
    const buffer = global.Buffer.from(cleanWkb, 'hex');
    
    if (!buffer || buffer.length < 21) {
      return parseWKBHex(cleanWkb);
    }

    // Simple buffer reading
    const geometryType = buffer[1] | (buffer[2] << 8) | (buffer[3] << 16) | (buffer[4] << 24);
    const isPoint = geometryType === 1 || geometryType === 0x20000001;
    
    if (!isPoint) {
      return parseWKBHex(cleanWkb);
    }

    const coordStart = geometryType === 0x20000001 ? 9 : 5;
    const longitude = parseDoubleLE(Array.from(buffer), coordStart);
    const latitude = parseDoubleLE(Array.from(buffer), coordStart + 8);

    if (isNaN(longitude) || isNaN(latitude)) {
      return parseWKBHex(cleanWkb);
    }

    return { longitude, latitude };
  } catch (error) {
    console.error('Buffer WKB parsing failed, using hex fallback:', error);
    return parseWKBHex(wkbString);
  }
}