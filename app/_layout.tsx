import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
import { useAppState } from '@/hooks/useAppState';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Handle app state changes and token refresh
  useAppState();

  React.useEffect(() => {
    if (loading) return;
    
    const inAuth = segments[0] === 'login' || segments[0] === 'register';
    
    if (!session && !inAuth) {
      // User is not authenticated and not on auth pages, redirect to login
      router.replace('/login');
    } else if (session && inAuth) {
      // User is authenticated but on auth pages, redirect to home
      router.replace('/');
    }
  }, [session, loading, segments]);

  if (loading) {
    // Show loading screen while checking authentication
    return null;
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  const { currentTheme } = useTheme();

  return (
    <NavigationThemeProvider value={currentTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Beállítások' }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <AuthGate>
              <RootLayoutNav />
            </AuthGate>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
