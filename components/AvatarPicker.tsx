import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
        t('profileInfo.avatar.permissions.mediaTitle'),
        t('profileInfo.avatar.permissions.mediaMessage'),
        [{ text: t('common.ok') }]
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
      t('profileInfo.avatar.modal.title'),
      t('profileInfo.avatar.modal.message'),
      [
        { text: t('profileInfo.avatar.modal.cancel'), style: 'cancel' },
        { text: t('profileInfo.avatar.modal.camera'), onPress: () => pickImageFromCamera() },
        { text: t('profileInfo.avatar.modal.gallery'), onPress: () => pickImageFromGallery() },
        ...(currentAvatarUrl && onAvatarDelete ? [
          { text: t('profileInfo.avatar.modal.delete'), style: 'destructive', onPress: () => handleDeleteAvatar() }
        ] : [])
      ]
    );
  };

  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('profileInfo.avatar.permissions.mediaTitle'), t('profileInfo.avatar.permissions.cameraMessage'));
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
      Alert.alert(t('common.error'), t('profileInfo.avatar.errors.cameraError'));
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
      Alert.alert(t('common.error'), t('profileInfo.avatar.errors.galleryError'));
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
      Alert.alert(t('common.error'), t('profileInfo.avatar.errors.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!onAvatarDelete) return;

    Alert.alert(
      t('profileInfo.avatar.deleteConfirm.title'),
      t('profileInfo.avatar.deleteConfirm.message'),
      [
        { text: t('profileInfo.avatar.deleteConfirm.cancel'), style: 'cancel' },
        {
          text: t('profileInfo.avatar.deleteConfirm.delete'),
          style: 'destructive',
          onPress: async () => {
            setUploading(true);
            try {
              await onAvatarDelete();
            } catch (error) {
              console.error('Error deleting avatar:', error);
              Alert.alert(t('common.error'), t('profileInfo.avatar.errors.deleteError'));
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
      <View style={styles.avatarWrapper}>
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
        </TouchableOpacity>
        
        {!uploading && (
          <View style={[styles.editBadge, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="camera" size={16} color="white" />
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.changeButton}
        onPress={showImagePicker}
        disabled={disabled || uploading}
        activeOpacity={0.7}
      >
        <ThemedText style={[styles.changeButtonText, { color: '#3B82F6' }]}>
          {uploading ? t('profileInfo.avatar.uploading') : currentAvatarUrl ? t('profileInfo.avatar.changeButton') : t('profileInfo.avatar.addButton')}
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
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    borderRadius: 58,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
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