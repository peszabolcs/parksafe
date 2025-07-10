// Performance configuration for ParkSafe app

export const PERFORMANCE_CONFIG = {
  LOCATION: {
    CACHE_DURATION: 60000, // Increased to 1 minute
    UPDATE_THRESHOLD: 100, // Increased to reduce unnecessary updates
    DEFAULT_RADIUS: 2000, // Reduced from 5000m to 2000m for faster loading
    MAX_RADIUS: 5000,
    ACCURACY: 'balanced' as const,
    UPDATE_INTERVAL: 15000, // Increased to 15 seconds
  },

  DATABASE: {
    MAX_RESULTS: 50, // Reduced from 100 to 50 for faster loading
    BATCH_SIZE: 25, // Reduced batch size
    TIMEOUT: 8000, // Reduced timeout to 8 seconds
  },

  UI: {
    SEARCH_DEBOUNCE: 200, // Reduced debounce for faster response
    ANIMATION_DURATION: 150, // Faster animations
    LIST_ITEM_HEIGHT: 80,
  },

  MEMORY: {
    MAX_CACHED_MARKERS: 200, // Reduced cache size for faster processing
    CACHE_CLEANUP_INTERVAL: 300000,
  },
} as const;

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

export const PRODUCTION_CONFIG = {
  ENABLE_DEBUG_LOGS: isDevelopment,
  ENABLE_PERFORMANCE_MONITORING: isProduction,
  IMAGE_OPTIMIZATION: {
    LAZY_LOADING: true,
    COMPRESSION_QUALITY: 0.8,
    MAX_IMAGE_SIZE: 1024,
  },
} as const;

export const Logger = {
  debug: (message: string, data?: any) => {
    if (PRODUCTION_CONFIG.ENABLE_DEBUG_LOGS) {
      if (data) {
        console.log(`🐛 ${message}`, data);
      } else {
        console.log(`🐛 ${message}`);
      }
    }
  },

  info: (message: string, data?: any) => {
    if (data) {
      console.log(`ℹ️ ${message}`, data);
    } else {
      console.log(`ℹ️ ${message}`);
    }
  },

  warn: (message: string, data?: any) => {
    if (data) {
      console.warn(`⚠️ ${message}`, data);
    } else {
      console.warn(`⚠️ ${message}`);
    }
  },

  error: (message: string, error?: any) => {
    if (error) {
      console.error(`❌ ${message}`, error);
    } else {
      console.error(`❌ ${message}`);
    }
  },
};

export const PerformanceUtils = {
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: any;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  },

  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastExecuted = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastExecuted >= delay) {
        func(...args);
        lastExecuted = now;
      }
    };
  },

  measureTime: <T>(fn: () => T, label?: string): T => {
    if (PRODUCTION_CONFIG.ENABLE_DEBUG_LOGS && label) {
      console.time(label);
    }
    const result = fn();
    if (PRODUCTION_CONFIG.ENABLE_DEBUG_LOGS && label) {
      console.timeEnd(label);
    }
    return result;
  },

  async measureTimeAsync<T>(fn: () => Promise<T>, label?: string): Promise<T> {
    if (PRODUCTION_CONFIG.ENABLE_DEBUG_LOGS && label) {
      console.time(label);
    }
    const result = await fn();
    if (PRODUCTION_CONFIG.ENABLE_DEBUG_LOGS && label) {
      console.timeEnd(label);
    }
    return result;
  },
}; 