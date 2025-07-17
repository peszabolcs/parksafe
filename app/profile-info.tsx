import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AvatarPicker } from '@/components/AvatarPicker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { router } from 'expo-router';

export default function ProfileInfoScreen() {
  const { user } = useAuthStore();
  const { profile, loading, error, loadProfile, updateProfile, uploadAvatar, deleteAvatar, checkUsernameAvailability } = useProfileStore();
  const { currentTheme } = useThemeStore();
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    phone: '',
    location: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const errorColor = useThemeColor({ light: '#EF4444', dark: '#F87171' }, 'text');
  const isDarkMode = currentTheme === 'dark';

  // Load profile data
  useEffect(() => {
    if (user) {
      loadProfile(user.id);
    }
  }, [user, loadProfile]);

  // Force StatusBar hide when screen focuses
  useFocusEffect(
    useCallback(() => {
      // This runs when screen comes into focus
      return () => {
        // This runs when screen goes out of focus
      };
    }, [])
  );

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      console.log('Profile loaded:', profile); // Debug log
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
      });
      setHasUnsavedChanges(false); // Reset unsaved changes when profile loads
    }
  }, [profile]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (formData.username.length < 3) {
      errors.username = 'A felhasználónév minimum 3 karakter hosszú kell legyen';
    }

    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'A felhasználónév csak betűket, számokat és aláhúzást tartalmazhat';
    }

    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Érvénytelen telefonszám formátum';
    }


    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkUsername = async (username: string) => {
    if (username === profile?.username) return true;
    
    setUsernameChecking(true);
    const available = await checkUsernameAvailability(username);
    setUsernameChecking(false);
    
    if (!available) {
      setValidationErrors(prev => ({
        ...prev,
        username: 'Ez a felhasználónév már foglalt'
      }));
      return false;
    }
    
    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleUsernameChange = async (value: string) => {
    handleInputChange('username', value);
    
    if (value.length >= 3 && value !== profile?.username) {
      await checkUsername(value);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Check username availability if changed
    if (formData.username !== profile?.username) {
      const usernameAvailable = await checkUsername(formData.username);
      if (!usernameAvailable) return;
    }

    setSaving(true);
    try {
      const success = await updateProfile(formData);
      if (success) {
        setHasUnsavedChanges(false);
        Alert.alert('Siker', 'A profil sikeresen frissítve!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Hiba', 'Nem sikerült menteni a változtatásokat.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (uri: string) => {
    const avatarUrl = await uploadAvatar(uri);
    if (avatarUrl) {
      // Avatar upload automatically updates the profile
      Alert.alert('Siker', 'A profilkép sikeresen feltöltve!');
    }
  };

  const handleAvatarDelete = async () => {
    const success = await deleteAvatar();
    if (success) {
      Alert.alert('Siker', 'A profilkép sikeresen törölve!');
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Nem mentett változtatások',
        'Vannak nem mentett változtatások. Biztosan ki szeretne lépni?',
        [
          { text: 'Mégse', style: 'cancel' },
          { text: 'Kilépés', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  if (loading && !profile) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ThemedText>Profil betöltése...</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <LinearGradient
          colors={isDarkMode ? ['#0F172A', '#1E293B'] : ['#22C55E', '#16A34A']}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <ThemedText style={styles.headerTitle}>Profilinformációk</ThemedText>
              <TouchableOpacity
                style={[styles.saveButton, { opacity: hasUnsavedChanges ? 1 : 0.5 }]}
                onPress={handleSave}
                disabled={!hasUnsavedChanges || saving}
              >
                <ThemedText style={styles.saveButtonText}>
                  {saving ? 'Mentés...' : 'Mentés'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={[styles.section, { backgroundColor: cardBackground }]}>
            <AvatarPicker
              currentAvatarUrl={profile?.avatar_url}
              onAvatarChange={handleAvatarChange}
              onAvatarDelete={handleAvatarDelete}
              disabled={loading}
            />
          </View>

          {/* Form Fields */}
          <View style={[styles.section, { backgroundColor: cardBackground }]}>
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Felhasználónév *
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: cardBackground,
                    borderColor: validationErrors.username ? errorColor : borderColor,
                    color: textColor 
                  }
                ]}
                value={formData.username}
                onChangeText={handleUsernameChange}
                placeholder="felhasználónév"
                placeholderTextColor={secondaryTextColor}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {usernameChecking && (
                <ThemedText style={[styles.helperText, { color: secondaryTextColor }]}>
                  Ellenőrzés...
                </ThemedText>
              )}
              {validationErrors.username && (
                <ThemedText style={[styles.errorText, { color: errorColor }]}>
                  {validationErrors.username}
                </ThemedText>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Teljes név
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: cardBackground,
                    borderColor: borderColor,
                    color: textColor 
                  }
                ]}
                value={formData.full_name}
                onChangeText={(value) => handleInputChange('full_name', value)}
                placeholder="Teljes név"
                placeholderTextColor={secondaryTextColor}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Telefonszám
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: cardBackground,
                    borderColor: validationErrors.phone ? errorColor : borderColor,
                    color: textColor 
                  }
                ]}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="+36 30 123 4567"
                placeholderTextColor={secondaryTextColor}
                keyboardType="phone-pad"
              />
              {validationErrors.phone && (
                <ThemedText style={[styles.errorText, { color: errorColor }]}>
                  {validationErrors.phone}
                </ThemedText>
              )}
            </View>


            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Helyszín
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: cardBackground,
                    borderColor: borderColor,
                    color: textColor 
                  }
                ]}
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                placeholder="Város, Ország"
                placeholderTextColor={secondaryTextColor}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email Section */}
          <View style={[styles.section, { backgroundColor: cardBackground }]}>
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Email cím
              </ThemedText>
              <View style={styles.emailContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.emailInput,
                    { 
                      backgroundColor: cardBackground,
                      borderColor: borderColor,
                      color: secondaryTextColor 
                    }
                  ]}
                  value={profile?.email || ''}
                  editable={false}
                  placeholder="email@example.com"
                  placeholderTextColor={secondaryTextColor}
                />
                <TouchableOpacity
                  style={[styles.changeEmailButton, { borderColor: '#3B82F6' }]}
                  onPress={() => router.push('/change-email')}
                >
                  <ThemedText style={[styles.changeEmailButtonText, { color: '#3B82F6' }]}>
                    Módosítás
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <ThemedText style={[styles.errorText, { color: errorColor }]}>
                {error}
              </ThemedText>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emailInput: {
    flex: 1,
  },
  changeEmailButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  changeEmailButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  bottomSpacing: {
    height: 40,
  },
});