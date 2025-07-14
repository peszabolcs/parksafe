import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeStore } from '@/stores/themeStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

type ThemeMode = 'light' | 'dark' | 'system';

const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Világos', icon: 'sunny' },
  { value: 'dark', label: 'Sötét', icon: 'moon' },
  { value: 'system', label: 'Rendszer', icon: 'phone-portrait' },
];

export const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode } = useThemeStore();
  
  // Use themed colors
  const containerBackground = useThemeColor({ light: '#F1F5F9', dark: '#334155' }, 'background');
  const selectedBackground = useThemeColor({ light: '#3B82F6', dark: '#60A5FA' }, 'tint');
  const textColor = useThemeColor({ light: '#64748B', dark: '#CBD5E1' }, 'text');
  const selectedTextColor = '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: containerBackground }]}>
      {themeOptions.map((option) => {
        const isSelected = themeMode === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              isSelected && { backgroundColor: selectedBackground }
            ]}
            onPress={() => setThemeMode(option.value)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={option.icon as any} 
              size={16} 
              color={isSelected ? selectedTextColor : textColor}
            />
            <ThemedText
              style={[
                styles.optionText,
                { color: isSelected ? selectedTextColor : textColor }
              ]}
            >
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    width: 180,
    alignSelf: 'flex-end',
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    gap: 4,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 