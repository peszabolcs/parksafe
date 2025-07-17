import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface AvatarPickerProps {
  currentAvatarUrl?: string | null;
  onAvatarChange: (uri: string) => Promise<void>;
  onAvatarDelete?: () => Promise<void>;
  size?: number;
  disabled?: boolean;
}

export function AvatarPicker({
  currentAvatarUrl,
  onAvatarChange,
  onAvatarDelete,
  size = 120,
  disabled = false,
}: AvatarPickerProps) {
  const [uploading, setUploading] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Engedély szükséges',
        'Az alkalmazásnak hozzáférést kell adni a fényképekhez a profilkép módosításához.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showImagePicker = async () => {
    if (disabled || uploading) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Profilkép választás',
      'Válassz egy opciót',
      [
        { text: 'Mégse', style: 'cancel' },
        { text: 'Kamera', onPress: () => pickImageFromCamera() },
        { text: 'Galéria', onPress: () => pickImageFromGallery() },
        ...(currentAvatarUrl && onAvatarDelete ? [
          { text: 'Törlés', style: 'destructive', onPress: () => handleDeleteAvatar() }
        ] : [])
      ]
    );
  };

  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Engedély szükséges', 'A kamera használatához engedély szükséges.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Hiba', 'Nem sikerült a kamera megnyitása.');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Hiba', 'Nem sikerült a galéria megnyitása.');
    }
  };

  const handleImageUpload = async (uri: string) => {
    setUploading(true);
    console.log('Starting image upload with URI:', uri);
    try {
      await onAvatarChange(uri);
      console.log('Image upload completed successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Hiba', 'Nem sikerült a kép feltöltése.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!onAvatarDelete) return;

    Alert.alert(
      'Profilkép törlése',
      'Biztosan törölni szeretné a profilképet?',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            setUploading(true);
            try {
              await onAvatarDelete();
            } catch (error) {
              console.error('Error deleting avatar:', error);
              Alert.alert('Hiba', 'Nem sikerült a kép törlése.');
            } finally {
              setUploading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            backgroundColor: cardBackground,
            borderColor: borderColor,
          }
        ]}
        onPress={showImagePicker}
        disabled={disabled || uploading}
        activeOpacity={0.7}
      >
        {uploading ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : currentAvatarUrl ? (
          <Image
            source={{ uri: currentAvatarUrl }}
            style={[styles.avatar, { width: size - 4, height: size - 4 }]}
          />
        ) : (
          <Ionicons name="person" size={size * 0.4} color={secondaryTextColor} />
        )}
        
        {!uploading && (
          <View style={[styles.editBadge, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="camera" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.changeButton}
        onPress={showImagePicker}
        disabled={disabled || uploading}
        activeOpacity={0.7}
      >
        <ThemedText style={[styles.changeButtonText, { color: '#3B82F6' }]}>
          {uploading ? 'Feltöltés...' : currentAvatarUrl ? 'Kép módosítása' : 'Kép hozzáadása'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatar: {
    borderRadius: 58,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  changeButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});