/**
 * Unified theme color hook that integrates with the centralized Colors system
 */

import { Colors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';
import { useMemo } from 'react';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName?: keyof typeof Colors.light
) {
  const { currentTheme } = useThemeStore();

  return useMemo(() => {
    // If explicit colors provided, use them
    if (props[currentTheme]) {
      return props[currentTheme]!;
    }

    // If colorName provided, use from Colors system
    if (colorName && Colors[currentTheme] && colorName in Colors[currentTheme]) {
      return Colors[currentTheme][colorName as keyof typeof Colors.light];
    }

    // Default fallback
    return Colors[currentTheme].background;
  }, [props, currentTheme, colorName]);
}

// Convenience hook for direct access to Colors
export function useColors() {
  const { currentTheme } = useThemeStore();
  return Colors[currentTheme];
}
