import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as Linking from 'expo-linking';
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, useColorScheme } from "react-native";
import "react-native-reanimated";
import "../lib/polyfills";

import { appStartup } from "@/lib/startup";
import "@/lib/onboardingDebug"; // Import debug helper
import "@/lib/i18n"; // Initialize i18n
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useLanguageStore } from "@/stores/languageStore";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const systemColorScheme = useColorScheme();
  const {
    currentTheme,
    initializeTheme,
    updateSystemTheme,
    isLoading: themeLoading,
  } = useThemeStore();
  const { session, user, loading: authLoading } = useAuthStore();
  const { initializeLanguage } = useLanguageStore();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [isAppReady, setIsAppReady] = useState(false);

  // Initialize theme and language on mount
  useEffect(() => {
    initializeTheme();
    initializeLanguage();
  }, [initializeTheme, initializeLanguage]);

  // Update theme when system theme changes
  useEffect(() => {
    if (systemColorScheme) {
      updateSystemTheme(systemColorScheme as "light" | "dark");
    }
  }, [systemColorScheme, updateSystemTheme]);

  // Handle deep linking for OAuth callbacks
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      if (url.includes('parksafe://auth/callback') || url.includes('auth/callback')) {
        // OAuth callback - navigate to callback screen
        console.log('OAuth callback detected, navigating to callback screen');
        // Small delay to ensure everything is ready
        setTimeout(() => {
          router.replace('/auth/callback');
        }, 100);
      } else {
        console.log('Deep link received but not OAuth callback:', url);
      }
    };

    // Handle initial URL if app was opened with a link
    const getInitialURL = async () => {
      const initialURL = await Linking.getInitialURL();
      if (initialURL) {
        handleDeepLink(initialURL);
      }
    };

    getInitialURL();

    // Listen for incoming links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [router]);

  // Initial app startup
  useEffect(() => {
    async function initializeApp() {
      if (loaded) {
        try {
          // Initialize the app startup logic
          await appStartup.initialize();
        } catch (error) {
          console.error("App initialization failed:", error);
        } finally {
          setIsAppReady(true);
          SplashScreen.hideAsync();
        }
      }
    }

    initializeApp();
  }, [loaded]);

  // Handle auth state changes during runtime (login/logout)
  useEffect(() => {
    if (!isAppReady || authLoading) {
      return; // Don't navigate until app is ready and auth is loaded
    }

    const inAuthGroup = segments[0] === "login" || segments[0] === "register";
    const hasValidSession = !!(session && user);

    console.log("Auth change detected:", {
      hasSession: hasValidSession,
      inAuthGroup,
      currentRoute: segments[0] || "root",
    });

    if (!hasValidSession && !inAuthGroup) {
      // User logged out or session expired - go to login
      console.log("Navigating to login: No session");
      router.replace("/login");
    } else if (hasValidSession && inAuthGroup) {
      // User logged in while on auth screen - go to home
      console.log("Navigating to home: Session found");
      router.replace("/(tabs)");

      // Start loading location and markers immediately after successful login
      appStartup.startDataFetching().catch((error) => {
        console.error("Post-login data loading failed:", error);
      });
    }
  }, [session, user, authLoading, isAppReady, segments, router]);

  if (!loaded || !isAppReady || authLoading) {
    // If theme is still loading, default to dark to avoid white flash
    const bgColor = themeLoading
      ? "#18181B"
      : currentTheme === "dark"
      ? "#18181B"
      : "#FFFFFF";
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: bgColor,
        }}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Use the current theme from the theme store
  const navigationTheme = currentTheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="feedback" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ headerShown: false }} />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="profile-info" options={{ headerShown: false }} />
        <Stack.Screen name="change-email" options={{ headerShown: false }} />
        <Stack.Screen name="change-password" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
