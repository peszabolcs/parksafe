import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  currentTheme: 'light' | 'dark';
  isLoading: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);
  const systemColorScheme = useSystemColorScheme();

  const currentTheme: 'light' | 'dark' = 
    themeMode === 'system' 
      ? (systemColorScheme ?? 'light')
      : themeMode;

  useEffect(() => {
    // Load saved theme mode from storage
    const loadThemeMode = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        if (savedThemeMode && ['light', 'dark', 'system'].includes(savedThemeMode)) {
          setThemeModeState(savedThemeMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemeMode();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const value: ThemeContextType = {
    themeMode,
    currentTheme,
    isLoading,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 