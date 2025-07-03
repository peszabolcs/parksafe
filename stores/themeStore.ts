import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  currentTheme: 'light' | 'dark';
  isLoading: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  initializeTheme: () => void;
  updateSystemTheme: (systemTheme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  return {
    themeMode: 'system',
    currentTheme: 'light',
    isLoading: true,
    setThemeMode: async (mode: ThemeMode) => {
      try {
        // Optimize by not awaiting the storage operation
        AsyncStorage.setItem('themeMode', mode).catch(error => {
          console.error('Error saving theme mode:', error);
        });
        
        const currentState = get();
        set({
          themeMode: mode,
          currentTheme: mode === 'system' ? currentState.currentTheme : mode,
        });
      } catch (error) {
        console.error('Error saving theme mode:', error);
      }
    },
    initializeTheme: () => {
      (async () => {
        try {
          const savedThemeMode = await AsyncStorage.getItem('themeMode');
          let themeMode: ThemeMode = 'system';
          if (savedThemeMode && ['light', 'dark', 'system'].includes(savedThemeMode)) {
            themeMode = savedThemeMode as ThemeMode;
          }
          set({
            themeMode,
            currentTheme: themeMode === 'system' ? 'light' : themeMode, // Default to light, will be updated by updateSystemTheme
            isLoading: false,
          });
        } catch (error) {
          console.error('Error loading theme mode:', error);
          set({ isLoading: false });
        }
      })();
    },
    updateSystemTheme: (systemTheme: 'light' | 'dark') => {
      const currentState = get();
      if (currentState.themeMode === 'system' && currentState.currentTheme !== systemTheme) {
        set({ currentTheme: systemTheme });
      }
    },
  };
}); 