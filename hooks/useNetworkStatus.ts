import { useState, useEffect } from 'react';

interface NetworkStatus {
  isConnected: boolean;
  lastChecked: Date;
  error?: string;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true, // Assume connected initially to avoid premature error states
    lastChecked: new Date(),
  });

  const checkNetworkConnection = async () => {
    try {
      // Try to fetch a lightweight endpoint to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      setNetworkStatus({
        isConnected: response.ok,
        lastChecked: new Date(),
        error: undefined,
      });

      return response.ok;
    } catch (error) {
      setNetworkStatus({
        isConnected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Network check failed',
      });
      return false;
    }
  };

  useEffect(() => {
    // Initial check
    checkNetworkConnection();

    // Set up periodic checks every 30 seconds
    const intervalId = setInterval(checkNetworkConnection, 30000);

    return () => clearInterval(intervalId);
  }, []);

  return {
    ...networkStatus,
    checkConnection: checkNetworkConnection,
  };
}