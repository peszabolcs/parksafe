import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';

export default function BlurTabBarBackground() {
  const { currentTheme } = useThemeStore();
  
  return (
    <BlurView
      // Use different tint based on current theme
      tint={currentTheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
