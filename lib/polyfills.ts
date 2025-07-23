import "core-js/actual/structured-clone";

// Minimal Buffer polyfill for WKB parsing in React Native
// Following official React Native patterns for Node.js compatibility
if (typeof global.Buffer === 'undefined') {
  global.Buffer = {
    from: (data: string, encoding?: string) => {
      if (encoding === 'hex') {
        // Simple hex string to Uint8Array conversion
        const matches = data.match(/.{1,2}/g) || [];
        return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
      }
      // Default: treat as UTF-8 string
      return new TextEncoder().encode(data);
    },
    
    isBuffer: (obj: any) => obj instanceof Uint8Array,
  } as any;
}
