import React, { useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/lib/supabase';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { handleGoogleAuth } from '@/lib/googleAuth';
import { handleError } from '@/lib/errorHandler';
import { NetworkErrorBanner } from '@/components/NetworkErrorBanner';
import { useTranslation } from 'react-i18next';

interface ValidationErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const segments = useSegments();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { forceSessionUpdate } = useAuthStore();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const inputBg = useThemeColor({ light: '#F8FAFC', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E2E8F0', dark: '#374151' }, 'background');
  const errorBorderColor = '#EF4444';
  const textColor = useThemeColor({}, 'text');
  const labelColor = useThemeColor({ light: '#374151', dark: '#D1D5DB' }, 'text');
  const placeholderColor = useThemeColor({ light: '#9CA3AF', dark: '#6B7280' }, 'text');
  const backgroundColor = useThemeColor({}, 'background');


  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!email) {
      errors.email = t('auth.validation.emailRequired');
    } else if (!validateEmail(email)) {
      errors.email = t('auth.validation.emailInvalid');
    }

    if (!password) {
      errors.password = t('auth.validation.passwordRequired');
    } else if (password.length < 6) {
      errors.password = t('auth.validation.passwordTooShort');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleAuthSuccess() {
    try {
      console.log('handleAuthSuccess called');
      
      // Force auth store to update with the new session
      await forceSessionUpdate();
      
      // Give a moment for auth state to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if we need to complete profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Checking profile completion for user:', session.user.email);
        
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, phone')
            .eq('id', session.user.id)
            .single();
          
          console.log('Profile data:', profileData);
          
          if (!profileData?.username || !profileData?.phone) {
            console.log('Profile incomplete, redirecting to complete-profile');
            router.replace('/complete-profile');
          } else {
            console.log('Profile complete, auth state listener should handle navigation...');
            // Instead of manual navigation, let the auth listener in _layout.tsx handle it
            // The auth store should now have the updated session and trigger navigation
          }
        } catch (profileError) {
          const errorResult = handleError(profileError);
          console.error('Error checking profile:', errorResult.userMessage);
          console.log('Profile check failed, assuming incomplete');
          router.replace('/complete-profile');
        }
      } else {
        console.log('No session found after OAuth');
        handleAuthError(t('common.error'));
      }
    } catch (error) {
      const errorResult = handleError(error);
      console.error('Failed to initialize auth after login:', errorResult.userMessage);
      handleAuthError(errorResult.userMessage);
    }
  }

  const handleAuthError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.forgotPassword.errorNoEmail'));
      return;
    }
    
    Alert.alert(
      t('auth.forgotPassword.title'),
      t('auth.forgotPassword.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('auth.forgotPassword.send'), 
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'parksafe://reset-password',
              });
              
              if (error) {
                const errorResult = handleError(error);
                Alert.alert(t('common.error'), errorResult.userMessage);
              } else {
                Alert.alert(t('common.success'), t('auth.forgotPassword.success'));
              }
            } catch (err) {
              const errorResult = handleError(err);
              Alert.alert(t('common.error'), errorResult.userMessage);
            }
          }
        }
      ]
    );
  };

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError('');
    setValidationErrors({});
    
    try {
      const result = await handleGoogleAuth('login');
      
      if (result.success) {
        await handleAuthSuccess();
      } else {
        const errorResult = handleError(result.error || 'Google bejelentkezés sikertelen.');
        handleAuthError(errorResult.userMessage);
      }
    } catch (err) {
      const errorResult = handleError(err);
      console.error('Google login error:', errorResult.userMessage);
      handleAuthError(errorResult.userMessage);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLogin() {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        const errorResult = handleError(error);
        handleAuthError(errorResult.userMessage);
      } else {
        await handleAuthSuccess();
      }
    } catch (err) {
      const errorResult = handleError(err);
      handleAuthError(errorResult.userMessage);
    } finally {
      setLoading(false);
    }
  }

  const isLoading = loading || googleLoading;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <NetworkErrorBanner />
          <View style={styles.form}>
            <View style={styles.header}>
              <ThemedText style={styles.title} type="title">{t('auth.login.title')}</ThemedText>
              <ThemedText style={styles.subtitle}>
                {t('auth.login.subtitle')}
              </ThemedText>
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                {t('auth.login.emailLabel')}
              </ThemedText>
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: inputBg, 
                  borderColor: validationErrors.email ? errorBorderColor : borderColor 
                }
              ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={placeholderColor} 
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={emailRef}
                  style={[styles.input, { color: textColor }]}
                  placeholder={t('auth.login.emailPlaceholder')}
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: undefined }));
                    }
                    if (error) {
                      setError('');
                    }
                  }}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!isLoading}
                />
              </View>
              {validationErrors.email && (
                <ThemedText style={styles.errorText}>{validationErrors.email}</ThemedText>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                {t('auth.login.passwordLabel')}
              </ThemedText>
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: inputBg, 
                  borderColor: validationErrors.password ? errorBorderColor : borderColor 
                }
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={placeholderColor} 
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { color: textColor }]}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  placeholderTextColor={placeholderColor}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (validationErrors.password) {
                      setValidationErrors(prev => ({ ...prev, password: undefined }));
                    }
                    if (error) {
                      setError('');
                    }
                  }}
                  onSubmitEditing={handleLogin}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={placeholderColor} 
                  />
                </TouchableOpacity>
              </View>
              {validationErrors.password && (
                <ThemedText style={styles.errorText}>{validationErrors.password}</ThemedText>
              )}
            </View>

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                <ThemedText style={styles.forgotPassword}>{t('auth.login.forgotPassword')}</ThemedText>
              </TouchableOpacity>
            </View>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                <ThemedText style={styles.error}>{error}</ThemedText>
              </View>
            ) : null}
            
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleLogin} 
              disabled={isLoading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.buttonText}>{t('auth.login.loginButton')}</ThemedText>
              )}
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <ThemedText style={[styles.dividerText, { color: placeholderColor }]}>
                {t('common.or')}
              </ThemedText>
              <View style={styles.dividerLine} />
            </View>
            
            <TouchableOpacity 
              style={[styles.googleButton, isLoading && styles.buttonDisabled]} 
              onPress={handleGoogleLogin} 
              disabled={isLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#374151" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <ThemedText style={styles.googleButtonText}>
                    {t('auth.login.googleLogin')}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: placeholderColor }]}>
                {t('auth.login.noAccount')}
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <ThemedText style={styles.link}>{t('auth.login.registerNow')}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Light theme fallback
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
    gap: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
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
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotPassword: {
    color: '#34aa56',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: '#34aa56',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    gap: 12,
  },
  googleButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    color: '#34aa56',
    fontWeight: '600',
    fontSize: 14,
  },
}); 