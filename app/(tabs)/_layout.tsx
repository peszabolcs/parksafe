import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import Feather from '@expo/vector-icons/Feather';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useThemeStore } from '@/stores/themeStore';

export default function TabLayout() {
  const { currentTheme } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentTheme === 'dark' ? '#0A84FF' : '#007AFF',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Főoldal',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Térkép',
          tabBarIcon: ({ color }) => <Feather name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favourite"
        options={{
          title: 'Kedvencek',
          tabBarIcon: ({ color }) => <Feather name="star" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
