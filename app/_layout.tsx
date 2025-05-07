import 'react-native-get-random-values'; // Add this line at the very top
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text, View, StyleSheet } from 'react-native'; // Hozzáadva Text, View, StyleSheet
import { Slot } from 'expo-router'; // Helyettesíti a children propot

import { useColorScheme } from '@/hooks/useColorScheme';
import AuthProvider from './context/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Fontos: ne térjünk vissza null-lal, mindig rendereljünk valamit
  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            {/* A Slot komponens az expo-router-ben a children helyét jelöli */}
            <Slot />
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </ThemeProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </View>
  );
}