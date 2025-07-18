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
        // When switching to system mode, immediately check system theme
        if (mode === 'system') {
          // Get system theme from react-native
          const { Appearance } = require('react-native');
          const systemTheme = Appearance.getColorScheme() || 'light';
          set({
            themeMode: mode,
            currentTheme: systemTheme,
          });
        } else {
          set({
            themeMode: mode,
            currentTheme: mode,
          });
        }
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
          
          // If system mode, get the actual system theme
          let currentTheme: 'light' | 'dark' = 'light';
          if (themeMode === 'system') {
            const { Appearance } = require('react-native');
            currentTheme = Appearance.getColorScheme() || 'light';
          } else {
            currentTheme = themeMode;
          }
          
          set({
            themeMode,
            currentTheme,
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