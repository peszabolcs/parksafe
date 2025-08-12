import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  ScrollView, 
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useColors } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import { useProfileStore } from '@/stores/profileStore';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';

interface ValidationErrors {
  username?: string;
  phone?: string;
}

export default function CompleteProfile() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('+36 ');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [userInfo, setUserInfo] = useState<any>(null);
  
  const { user } = useAuthStore();
  const { updateProfile, checkUsernameAvailability } = useProfileStore();
  const colors = useColors();

  const usernameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  useEffect(() => {
    // Load user info from auth metadata
    if (user?.user_metadata) {
      setUserInfo(user.user_metadata);
    }
  }, [user?.user_metadata]);

  const validateForm = async (): Promise<boolean> => {
    const errors: ValidationErrors = {};

    // Username validation
    if (!username.trim()) {
      errors.username = t('auth.validation.usernameRequired');
    } else if (username.length < 3) {
      errors.username = t('auth.validation.usernameTooShort');
    } else {
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        errors.username = t('auth.validation.usernameTaken');
      }
    }

    // Phone validation
    if (!phone || phone === '+36 ') {
      errors.phone = t('auth.validation.phoneRequired');
    } else if (phone.length < 10) {
      errors.phone = t('auth.validation.phoneInvalid');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCompleteProfile = async () => {
    if (!(await validateForm())) {
      return;
    }

    setLoading(true);

    try {
      const success = await updateProfile({
        username: username.trim(),
        phone: phone.trim(),
        // Keep existing Google data
        full_name: userInfo?.full_name || user?.user_metadata?.full_name || null,
        avatar_url: userInfo?.avatar_url || user?.user_metadata?.avatar_url || null,
      });

      if (success) {
        // Navigate directly to main app
        router.replace('/(tabs)');
      } else {
        Alert.alert(t('common.error'), t('auth.profile.updateError'));
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      Alert.alert(t('common.error'), t('common.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const clearValidationError = (field: keyof ValidationErrors) => {
    setValidationErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Header with user info */}
            <View style={styles.header}>
              {userInfo?.avatar_url && (
                <Image 
                  source={{ uri: userInfo.avatar_url }} 
                  style={styles.avatar}
                />
              )}
              <ThemedText style={styles.title} type="title">
                {t('auth.profile.welcomeTitle', { name: userInfo?.full_name?.split(' ')[0] || t('common.user') })}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {t('auth.profile.completeSubtitle')}
              </ThemedText>
            </View>

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                {t('auth.profile.usernameLabel')} *
              </ThemedText>
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: validationErrors.username ? colors.error : colors.border 
                }
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={colors.placeholder} 
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={usernameRef}
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('auth.profile.usernamePlaceholder')}
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  returnKeyType="next"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    clearValidationError('username');
                  }}
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  editable={!loading}
                />
              </View>
              {validationErrors.username && (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {validationErrors.username}
                </ThemedText>
              )}
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                {t('auth.profile.phoneLabel')} *
              </ThemedText>
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: validationErrors.phone ? colors.error : colors.border 
                }
              ]}>
                <Ionicons 
                  name="call-outline" 
                  size={20} 
                  color={colors.placeholder} 
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={phoneRef}
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('auth.profile.phonePlaceholder')}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  returnKeyType="done"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    clearValidationError('phone');
                  }}
                  onSubmitEditing={handleCompleteProfile}
                  editable={!loading}
                />
              </View>
              {validationErrors.phone && (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {validationErrors.phone}
                </ThemedText>
              )}
            </View>

            {/* Complete Button */}
            <TouchableOpacity 
              style={[
                styles.button, 
                { backgroundColor: colors.tint }, 
                loading && styles.buttonDisabled
              ]} 
              onPress={handleCompleteProfile} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.buttonText}>
                  {t('auth.profile.completeButton')}
                </ThemedText>
              )}
            </TouchableOpacity>

            {/* Skip Option */}
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => {
                Alert.alert(
                  t('auth.profile.skipTitle'),
                  t('auth.profile.skipMessage'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { 
                      text: t('auth.profile.skipConfirm'), 
                      onPress: () => router.replace('/(tabs)')
                    }
                  ]
                );
              }}
              disabled={loading}
            >
              <ThemedText style={[styles.skipText, { color: colors.placeholder }]}>
                {t('auth.profile.skipButton')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    gap: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});