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
import { useColors } from '@/hooks/useThemeColor';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { GoogleAuth } from '@/lib/googleAuth';
import { handleError } from '@/lib/errorHandler';
import { NetworkErrorBanner } from '@/components/NetworkErrorBanner';
import { useTranslation } from 'react-i18next';

interface ValidationErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const colors = useColors();


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
      const result = await GoogleAuth.authenticate();
      
      if (result.success) {
        // Let the auth callback handler take over - don't navigate here
      } else {
        const errorResult = handleError(result.error || t('auth.login.googleError'));
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
        // Let the auth state listener handle navigation automatically
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
          <NetworkErrorBanner />
          <View style={styles.form}>
            <View style={styles.header}>
              <ThemedText style={styles.title} type="title">{t('auth.login.title')}</ThemedText>
              <ThemedText style={styles.subtitle}>
                {t('auth.login.subtitle')}
              </ThemedText>
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                {t('auth.login.emailLabel')}
              </ThemedText>
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: validationErrors.email ? colors.error : colors.border 
                }
              ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={colors.placeholder} 
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={emailRef}
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('auth.login.emailPlaceholder')}
                  placeholderTextColor={colors.placeholder}
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
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{validationErrors.email}</ThemedText>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                {t('auth.login.passwordLabel')}
              </ThemedText>
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: validationErrors.password ? colors.error : colors.border 
                }
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={colors.placeholder} 
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  placeholderTextColor={colors.placeholder}
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
                    color={colors.placeholder} 
                  />
                </TouchableOpacity>
              </View>
              {validationErrors.password && (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{validationErrors.password}</ThemedText>
              )}
            </View>

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                <ThemedText style={[styles.forgotPassword, { color: colors.tint }]}>{t('auth.login.forgotPassword')}</ThemedText>
              </TouchableOpacity>
            </View>
            
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: colors.errorBackground, borderColor: colors.errorBorder }]}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                <ThemedText style={[styles.error, { color: colors.error }]}>{error}</ThemedText>
              </View>
            ) : null}
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.tint }, isLoading && styles.buttonDisabled]} 
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
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <ThemedText style={[styles.dividerText, { color: colors.placeholder }]}>
                {t('common.or')}
              </ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
            
            <TouchableOpacity 
              style={[styles.googleButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }, isLoading && styles.buttonDisabled]} 
              onPress={handleGoogleLogin} 
              disabled={isLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <ThemedText style={[styles.googleButtonText, { color: colors.text }]}>
                    {t('auth.login.googleLogin')}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: colors.placeholder }]}>
                {t('auth.login.noAccount')}
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <ThemedText style={[styles.link, { color: colors.tint }]}>{t('auth.login.registerNow')}</ThemedText>
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
    fontSize: 14,
    marginTop: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  error: {
    fontSize: 14,
    flex: 1,
  },
  button: {
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
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    gap: 12,
  },
  googleButtonText: {
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
    fontWeight: '600',
    fontSize: 14,
  },
}); 