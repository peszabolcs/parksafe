import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

type ThemeMode = 'light' | 'dark' | 'system';

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();
  
  // Use themed colors
  const borderColor = useThemeColor({}, 'icon');
  const selectedBackgroundColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title} type="subtitle">
        Theme
      </ThemedText>
      <View style={styles.optionsContainer}>
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              { borderColor },
              themeMode === option.value && {
                backgroundColor: selectedBackgroundColor,
                borderColor: selectedBackgroundColor,
              },
            ]}
            onPress={() => setThemeMode(option.value)}
          >
            <ThemedText
              style={[
                styles.optionText,
                themeMode === option.value && styles.selectedOptionText,
              ]}
            >
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
  },
  title: {
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
  },
}); 