// Performance configuration for ParkSafe app
console.log('⚙️ Loading Performance Configuration...');

export const PERFORMANCE_CONFIG = {
  // Location settings
  LOCATION: {
    // Cache duration for location-based queries (ms)
    CACHE_DURATION: 30000, // 30 seconds
    // Minimum distance change to trigger updates (meters)
    UPDATE_THRESHOLD: 50,
    // Default search radius (meters)  
    DEFAULT_RADIUS: 1000,
    // Maximum search radius (meters)
    MAX_RADIUS: 5000,
    // Location accuracy setting
    ACCURACY: 'balanced' as const,
    // Minimum time between location updates (ms)
    UPDATE_INTERVAL: 10000, // 10 seconds
  },

  // Database query optimization
  DATABASE: {
    // Maximum number of results to fetch at once
    MAX_RESULTS: 100,
    // Default batch size for bulk operations
    BATCH_SIZE: 50,
    // Query timeout (ms)
    TIMEOUT: 10000,
  },

  // UI performance
  UI: {
    // Debounce time for search inputs (ms)
    SEARCH_DEBOUNCE: 300,
    // Animation duration for smooth transitions (ms)
    ANIMATION_DURATION: 200,
    // Virtual list item height for large lists
    LIST_ITEM_HEIGHT: 80,
  },

  // Memory management
  MEMORY: {
    // Maximum items in marker cache
    MAX_CACHED_MARKERS: 500,
    // Clear cache interval (ms)
    CACHE_CLEANUP_INTERVAL: 300000, // 5 minutes
  },
} as const;

console.log('✅ Performance Configuration loaded:', {
  cacheThreshold: `${PERFORMANCE_CONFIG.LOCATION.UPDATE_THRESHOLD}m`,
  defaultRadius: `${PERFORMANCE_CONFIG.LOCATION.DEFAULT_RADIUS}m`,
  maxResults: PERFORMANCE_CONFIG.DATABASE.MAX_RESULTS,
  maxCachedMarkers: PERFORMANCE_CONFIG.MEMORY.MAX_CACHED_MARKERS
});

// Environment-specific optimizations
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

console.log('🌍 Environment detected:', {
  NODE_ENV: process.env.NODE_ENV || 'undefined',
  isProduction,
  isDevelopment
});

// Production optimizations
export const PRODUCTION_CONFIG = {
  // Disable debug logs in production
  ENABLE_DEBUG_LOGS: isDevelopment,
  // Enable performance monitoring
  ENABLE_PERFORMANCE_MONITORING: isProduction,
  // Optimize image loading
  IMAGE_OPTIMIZATION: {
    LAZY_LOADING: true,
    COMPRESSION_QUALITY: 0.8,
    MAX_IMAGE_SIZE: 1024, // px
  },
} as const;

// Enhanced logging utilities
export const Logger = {
  // Performance timing logger
  time: (label: string) => {
    if (PRODUCTION_CONFIG.ENABLE_DEBUG_LOGS) {
      console.time(`⏱️ ${label}`);
    }
  },

  timeEnd: (label: string) => {
    if (PRODUCTION_CONFIG.ENABLE_DEBUG_LOGS) {
      console.timeEnd(`⏱️ ${label}`);
    }
  },

  // Debug logger (only in development)
  debug: (message: string, data?: any) => {
    if (PRODUCTION_CONFIG.ENABLE_DEBUG_LOGS) {
      if (data) {
        console.log(`🐛 ${message}`, data);
      } else {
        console.log(`🐛 ${message}`);
      }
    }
  },

  // Info logger (always shown)
  info: (message: string, data?: any) => {
    if (data) {
      console.log(`ℹ️ ${message}`, data);
    } else {
      console.log(`ℹ️ ${message}`);
    }
  },

  // Warning logger (always shown)
  warn: (message: string, data?: any) => {
    if (data) {
      console.warn(`⚠️ ${message}`, data);
    } else {
      console.warn(`⚠️ ${message}`);
    }
  },

  // Error logger (always shown)
  error: (message: string, error?: any) => {
    if (error) {
      console.error(`❌ ${message}`, error);
    } else {
      console.error(`❌ ${message}`);
    }
  },

  // Success logger
  success: (message: string, data?: any) => {
    if (PRODUCTION_CONFIG.ENABLE_DEBUG_LOGS) {
      if (data) {
        console.log(`✅ ${message}`, data);
      } else {
        console.log(`✅ ${message}`);
      }
    }
  },

  // Performance metric logger
  metric: (metric: string, value: number, unit: string = '') => {
    if (PRODUCTION_CONFIG.ENABLE_PERFORMANCE_MONITORING) {
      console.log(`📊 ${metric}: ${value}${unit}`);
    }
  },

  // Cache operation logger
  cache: (operation: 'hit' | 'miss' | 'update' | 'clear', details?: any) => {
    if (PRODUCTION_CONFIG.ENABLE_DEBUG_LOGS) {
      const emoji = {
        hit: '🎯',
        miss: '❌', 
        update: '💾',
        clear: '🧹'
      }[operation];
      
      if (details) {
        console.log(`${emoji} Cache ${operation}:`, details);
      } else {
        console.log(`${emoji} Cache ${operation}`);
      }
    }
  }
};

// Performance monitoring utilities
export const PerformanceUtils = {
  // Debounce function for expensive operations
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: any;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        Logger.debug(`Debounced function executed after ${delay}ms`);
        func(...args);
      }, delay);
    };
  },

  // Throttle function for frequent events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastExecuted = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastExecuted >= delay) {
        Logger.debug(`Throttled function executed (${now - lastExecuted}ms since last)`);
        func(...args);
        lastExecuted = now;
      }
    };
  },

  // Memory-efficient batch processing
  batchProcess: async <T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = PERFORMANCE_CONFIG.DATABASE.BATCH_SIZE
  ): Promise<R[]> => {
    Logger.debug(`Starting batch processing: ${items.length} items in batches of ${batchSize}`);
    Logger.time('Batch processing');
    
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      Logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
      
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    Logger.timeEnd('Batch processing');
    Logger.success(`Batch processing complete: ${results.length} results`);
    
    return results;
  },

  // Memory usage tracker
  getMemoryUsage: () => {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
      };
    }
    return null;
  },

  // Log memory usage
  logMemoryUsage: (context: string) => {
    const memory = PerformanceUtils.getMemoryUsage();
    if (memory) {
      Logger.metric(`Memory usage (${context})`, memory.used, 'MB');
      Logger.debug('Detailed memory usage:', memory);
    }
  }
};

console.log('🚀 Performance utilities initialized');

// Log initial memory usage
PerformanceUtils.logMemoryUsage('initialization'); 