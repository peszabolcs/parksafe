import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export const useAppState = () => {
  const appState = useRef(AppState.currentState);
  const { refreshSession } = useAuth();

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        console.log('App has come to the foreground');
        
        // Refresh the session to ensure we have a valid token
        try {
          await refreshSession();
        } catch (error) {
          console.error('Error refreshing session on app state change:', error);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [refreshSession]);
}; 