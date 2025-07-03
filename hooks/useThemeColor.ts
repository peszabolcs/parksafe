/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useThemeStore } from '@/stores/themeStore';
import { useMemo } from 'react';

// Memoized color tokens to avoid recreating on every call
const COLOR_TOKENS: Record<string, { light: string; dark: string }> = {
  background: { light: '#fff', dark: '#18181B' },
  text: { light: '#18181B', dark: '#fff' },
  tint: { light: '#007AFF', dark: '#0A84FF' },
  icon: { light: '#18181B', dark: '#fff' },
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
) {
  const { currentTheme } = useThemeStore();

  return useMemo(() => {
    if (props[currentTheme]) {
      return props[currentTheme]!;
    }

    const token = COLOR_TOKENS[colorName];
    if (token) {
      return token[currentTheme];
    }

    // Default fallback
    return currentTheme === 'dark' ? '#18181B' : '#fff';
  }, [props, currentTheme, colorName]);
}
