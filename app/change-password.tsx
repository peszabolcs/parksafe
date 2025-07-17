import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemeStore } from '@/stores/themeStore';
import { useProfileStore } from '@/stores/profileStore';
import { router } from 'expo-router';

export default function ChangePasswordScreen() {
  const { updatePassword } = useProfileStore();
  const { currentTheme } = useThemeStore();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const errorColor = useThemeColor({ light: '#EF4444', dark: '#F87171' }, 'text');
  const isDarkMode = currentTheme === 'dark';

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'A jelenlegi jelszó megadása kötelező';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'Az új jelszó megadása kötelező';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Az új jelszó minimum 6 karakter hosszú kell legyen';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Az új jelszó megerősítése kötelező';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'A jelszavak nem egyeznek';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'Az új jelszó nem lehet ugyanaz, mint a jelenlegi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const success = await updatePassword(newPassword);
      if (success) {
        Alert.alert(
          'Jelszó megváltoztatva',
          'A jelszó sikeresen megváltoztatva!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Hiba', 'Nem sikerült megváltoztatni a jelszót.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'currentPassword') setCurrentPassword(value);
    if (field === 'newPassword') setNewPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
    
    // Clear validation error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: '' };
    if (password.length < 6) return { strength: 1, text: 'Gyenge' };
    if (password.length < 8) return { strength: 2, text: 'Közepes' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, text: 'Erős' };
    }
    return { strength: 2, text: 'Közepes' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

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
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <ThemedText style={styles.headerTitle}>Jelszó módosítás</ThemedText>
              <View style={styles.headerPlaceholder} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
          {/* Password Form */}
          <View style={[styles.section, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Jelszó módosítása
            </ThemedText>
            
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Jelenlegi jelszó
              </ThemedText>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { 
                      backgroundColor: cardBackground,
                      borderColor: errors.currentPassword ? errorColor : borderColor,
                      color: textColor 
                    }
                  ]}
                  value={currentPassword}
                  onChangeText={(value) => handleInputChange('currentPassword', value)}
                  placeholder="Jelenlegi jelszó"
                  placeholderTextColor={secondaryTextColor}
                  secureTextEntry={!showPasswords.current}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('current')}
                >
                  <Ionicons
                    name={showPasswords.current ? 'eye-off' : 'eye'}
                    size={20}
                    color={secondaryTextColor}
                  />
                </TouchableOpacity>
              </View>
              {errors.currentPassword && (
                <ThemedText style={[styles.errorText, { color: errorColor }]}>
                  {errors.currentPassword}
                </ThemedText>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Új jelszó
              </ThemedText>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { 
                      backgroundColor: cardBackground,
                      borderColor: errors.newPassword ? errorColor : borderColor,
                      color: textColor 
                    }
                  ]}
                  value={newPassword}
                  onChangeText={(value) => handleInputChange('newPassword', value)}
                  placeholder="Új jelszó"
                  placeholderTextColor={secondaryTextColor}
                  secureTextEntry={!showPasswords.new}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('new')}
                >
                  <Ionicons
                    name={showPasswords.new ? 'eye-off' : 'eye'}
                    size={20}
                    color={secondaryTextColor}
                  />
                </TouchableOpacity>
              </View>
              {newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${(passwordStrength.strength / 3) * 100}%`,
                          backgroundColor: 
                            passwordStrength.strength === 1 ? '#EF4444' :
                            passwordStrength.strength === 2 ? '#F59E0B' : '#22C55E'
                        }
                      ]}
                    />
                  </View>
                  <ThemedText style={[styles.strengthText, { color: secondaryTextColor }]}>
                    {passwordStrength.text}
                  </ThemedText>
                </View>
              )}
              {errors.newPassword && (
                <ThemedText style={[styles.errorText, { color: errorColor }]}>
                  {errors.newPassword}
                </ThemedText>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Új jelszó megerősítése
              </ThemedText>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { 
                      backgroundColor: cardBackground,
                      borderColor: errors.confirmPassword ? errorColor : borderColor,
                      color: textColor 
                    }
                  ]}
                  value={confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  placeholder="Új jelszó megerősítése"
                  placeholderTextColor={secondaryTextColor}
                  secureTextEntry={!showPasswords.confirm}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('confirm')}
                >
                  <Ionicons
                    name={showPasswords.confirm ? 'eye-off' : 'eye'}
                    size={20}
                    color={secondaryTextColor}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <ThemedText style={[styles.errorText, { color: errorColor }]}>
                  {errors.confirmPassword}
                </ThemedText>
              )}
            </View>
          </View>

          {/* Security Tips */}
          <View style={[styles.tipsContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <View style={styles.tipsHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
              <ThemedText style={[styles.tipsTitle, { color: '#3B82F6' }]}>
                Biztonságos jelszó tippek
              </ThemedText>
            </View>
            <View style={styles.tipsList}>
              <ThemedText style={[styles.tipText, { color: textColor }]}>
                • Minimum 8 karakter hosszú legyen
              </ThemedText>
              <ThemedText style={[styles.tipText, { color: textColor }]}>
                • Tartalmazzon nagy- és kisbetűket
              </ThemedText>
              <ThemedText style={[styles.tipText, { color: textColor }]}>
                • Használjon számokat és speciális karaktereket
              </ThemedText>
              <ThemedText style={[styles.tipText, { color: textColor }]}>
                • Ne használjon személyes adatokat
              </ThemedText>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { 
                backgroundColor: '#3B82F6',
                opacity: loading ? 0.7 : 1
              }
            ]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <ThemedText style={styles.saveButtonText}>
              {loading ? 'Változtatás...' : 'Jelszó módosítás'}
            </ThemedText>
          </TouchableOpacity>
          
          <View style={styles.bottomSpacing} />
          </View>
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
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  tipsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsList: {
    gap: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});