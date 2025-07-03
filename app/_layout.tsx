import React, { useMemo, useCallback } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import 'react-native-reanimated';

import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { useAppState } from '@/hooks/useAppState';
import { useThemeColor } from '@/hooks/useThemeColor';

const AppInitializer = React.memo(({ children }: { children: React.ReactNode }) => {
  const { isLoading: themeLoading, initializeTheme, updateSystemTheme } = useThemeStore();
  const { loading: authLoading, initializeAuth } = useAuthStore();
  const systemColorScheme = useColorScheme();

  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  // Memoize the loading styles to prevent unnecessary re-renders
  const loadingStyles = useMemo(() => ({
    flex: 1,
    backgroundColor,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  }), [backgroundColor]);

  // Memoize the update system theme callback
  const handleSystemThemeChange = useCallback((scheme: string | null | undefined) => {
    if (scheme) {
      updateSystemTheme(scheme as 'light' | 'dark');
    }
  }, [updateSystemTheme]);

  // Update system theme when it changes
  React.useEffect(() => {
    handleSystemThemeChange(systemColorScheme);
  }, [systemColorScheme, handleSystemThemeChange]);

  // Initialize critical stores on mount (theme and auth)
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize critical stores in parallel
        await Promise.allSettled([
          initializeTheme(),
          initializeAuth(),
        ]);
      } catch (error) {
        console.error('Error during app initialization:', error);
      }
    };

    initializeApp();
  }, [initializeTheme, initializeAuth]);

  // Initialize location store in background (non-blocking)
  React.useEffect(() => {
    const { initializeLocation } = useLocationStore.getState();
    initializeLocation().catch(error => {
      console.error('Error initializing location store:', error);
    });
  }, []);

  // Show loading screen only while critical stores are loading
  if (themeLoading || authLoading) {
    return (
      <View style={loadingStyles}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return <>{children}</>;
});

AppInitializer.displayName = 'AppInitializer';

const AuthGate = React.memo(({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  // Handle app state changes and token refresh
  useAppState();

  // Memoize the auth check logic
  const handleAuthCheck = useCallback(() => {
    if (loading) return;
    
    const inAuth = segments[0] === 'login' || segments[0] === 'register';
    
    if (!session && !inAuth) {
      // User is not authenticated and not on auth pages, redirect to login
      router.replace('/login');
    } else if (session && inAuth) {
      // User is authenticated but on auth pages, redirect to home
      router.replace('/');
    }
  }, [session, loading, segments, router]);

  React.useEffect(() => {
    handleAuthCheck();
  }, [handleAuthCheck]);

  return <>{children}</>;
});

const RootLayoutNav = React.memo(() => {
  const { currentTheme } = useThemeStore();
  const backgroundColor = useThemeColor({}, 'background');

  // Memoize the navigation theme and styles
  const navigationTheme = useMemo(() => 
    currentTheme === 'dark' ? DarkTheme : DefaultTheme, 
    [currentTheme]
  );

  const containerStyle = useMemo(() => ({ 
    flex: 1, 
    backgroundColor 
  }), [backgroundColor]);

  const screenOptions = useMemo(() => ({
    headerShown: false,
    animation: 'none' as const,
    contentStyle: { backgroundColor },
  }), [backgroundColor]);

  const statusBarStyle = useMemo(() => 
    currentTheme === 'dark' ? 'light' : 'dark', 
    [currentTheme]
  );

  return (
    <View style={containerStyle}>
      <NavigationThemeProvider value={navigationTheme}>
        <Stack screenOptions={screenOptions}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: true, title: 'Beállítások' }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={statusBarStyle} />
      </NavigationThemeProvider>
    </View>
  );
});

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
      <AppInitializer>
        <AuthGate>
          <RootLayoutNav />
        </AuthGate>
      </AppInitializer>
    </SafeAreaProvider>
  );
}
