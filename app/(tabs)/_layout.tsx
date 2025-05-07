import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'green',
        headerShown: true,
        headerTitle: 'ParkSafe',
        headerTitleAlign: 'center',
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {},
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Főoldal',
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Térkép',
          tabBarIcon: ({ color }) => (
            <Feather name="map" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: 'Kedvencek',
          tabBarIcon: ({ color }) => (
            <Feather name="star" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Clean up unused styles
});