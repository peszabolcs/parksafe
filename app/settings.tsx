import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Pressable, SafeAreaView, StatusBar, 
  Platform, ScrollView, Animated, useColorScheme 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors'; // Using your app's color constants

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const [backButtonAnim] = useState(new Animated.Value(0));
  
  // Get colors based on theme
  const themeColors = Colors[colorScheme];
  
  // Settings options
  const settingsOptions: { id: string; title: string; icon: "eye" | "bell" | "lock" | "globe" | "info"; description: string }[] = [
    { id: 'appearance', title: 'Megjelenés', icon: 'eye', description: 'Téma, betűméret, megjelenítési beállítások' },
    { id: 'notifications', title: 'Értesítések', icon: 'bell', description: 'Push értesítési beállítások' },
    { id: 'privacy', title: 'Adatvédelem', icon: 'lock', description: 'Adatvédelmi beállítások és engedélyek' },
    { id: 'language', title: 'Nyelv', icon: 'globe', description: 'Alkalmazás nyelvi beállítások' },
    { id: 'about', title: 'Az alkalmazásról', icon: 'info', description: 'Verzió és licenc információk' },
  ];

  const animateBackButton = (pressed: boolean) => {
    Animated.spring(backButtonAnim, {
      toValue: pressed ? 1 : 0,
      friction: 7,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  const backButtonTransform = {
    transform: [
      { translateX: backButtonAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5]
        })
      },
      { scale: backButtonAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.95]
        })
      }
    ]
  };

  // Create styles with the current theme
  const themeStyles = createThemedStyles(themeColors, colorScheme);

  return (
    <SafeAreaView style={themeStyles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header with Animated Back Button */}
      <View style={themeStyles.header}>
        <Animated.View style={backButtonTransform}>
          <Pressable 
            style={themeStyles.backButton} 
            onPress={() => router.back()}
            onPressIn={() => animateBackButton(true)}
            onPressOut={() => animateBackButton(false)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Feather name="arrow-left" size={24} color={themeColors.text} />
          </Pressable>
        </Animated.View>
        <Text style={themeStyles.headerTitle}>Beállítások</Text>
        <View style={themeStyles.placeholder} />
      </View>
      
      {/* Content */}
      <ScrollView style={themeStyles.scrollView}>
        <View style={themeStyles.sectionContainer}>
          {settingsOptions.map((option) => (
            <Pressable 
              key={option.id}
              style={({pressed}) => [
                themeStyles.settingItem,
                pressed && themeStyles.settingItemPressed
              ]}
              onPress={() => console.log(`Selected setting: ${option.id}`)}
            >
              <View style={themeStyles.settingIconContainer}>
                <Feather name={option.icon} size={22} color={themeColors.tint} />
              </View>
              <View style={themeStyles.settingContent}>
                <Text style={themeStyles.settingTitle}>{option.title}</Text>
                <Text style={themeStyles.settingDescription}>{option.description}</Text>
              </View>
              <Feather 
                name="chevron-right" 
                size={20} 
                color={colorScheme === 'dark' ? '#777' : '#CCCCCC'} 
              />
            </Pressable>
          ))}
        </View>

        <View style={themeStyles.versionContainer}>
          <Text style={themeStyles.versionText}>ParkSafe v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Create theme-specific styles
const createThemedStyles = (themeColors: any, colorScheme: 'light' | 'dark') => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? '#333' : '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    paddingVertical: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? '#333' : '#F0F0F0',
  },
  settingItemPressed: {
    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F8F8F8',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colorScheme === 'dark' 
      ? 'rgba(74, 144, 226, 0.2)' 
      : 'rgba(74, 144, 226, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: themeColors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colorScheme === 'dark' ? '#AAA' : '#888888',
  },
  versionContainer: {
    padding: 24,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: colorScheme === 'dark' ? '#777' : '#999999',
  },
});