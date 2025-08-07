import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface NetworkErrorBannerProps {
  visible?: boolean;
  onRetry?: () => void;
  customMessage?: string;
}

export function NetworkErrorBanner({ visible, onRetry, customMessage }: NetworkErrorBannerProps) {
  const { isConnected, checkConnection } = useNetworkStatus();
  const backgroundColor = useThemeColor({ light: '#FEF2F2', dark: '#7F1D1D' }, 'background');
  const borderColor = useThemeColor({ light: '#FECACA', dark: '#991B1B' }, 'background');
  const textColor = useThemeColor({ light: '#DC2626', dark: '#FCA5A5' }, 'text');

  // Only show if explicitly visible or if network is disconnected
  const shouldShow = visible !== undefined ? visible : !isConnected;

  if (!shouldShow) return null;

  const handleRetry = async () => {
    await checkConnection();
    onRetry?.();
  };

  const message = customMessage || 
    (!isConnected 
      ? 'Nincs internetkapcsolat. Ellenőrizze a kapcsolatot és próbálja újra.'
      : 'Hálózati hiba történt.'
    );

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <View style={styles.content}>
        <Ionicons 
          name="cloud-offline-outline" 
          size={20} 
          color={textColor} 
          style={styles.icon}
        />
        <ThemedText style={[styles.message, { color: textColor }]} numberOfLines={2}>
          {message}
        </ThemedText>
        <TouchableOpacity 
          onPress={handleRetry}
          style={[styles.retryButton, { borderColor: textColor }]}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={16} color={textColor} />
          <ThemedText style={[styles.retryText, { color: textColor }]}>
            Újra
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  icon: {
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
    gap: 4,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
});