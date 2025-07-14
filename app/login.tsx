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
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import * as AuthSession from 'expo-auth-session';

interface ValidationErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { refreshSession } = useAuthStore();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const inputBg = useThemeColor({ light: '#F8FAFC', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E2E8F0', dark: '#374151' }, 'background');
  const errorBorderColor = '#EF4444';
  const textColor = useThemeColor({}, 'text');
  const labelColor = useThemeColor({ light: '#374151', dark: '#D1D5DB' }, 'text');
  const placeholderColor = useThemeColor({ light: '#9CA3AF', dark: '#6B7280' }, 'text');
  const successColor = '#10B981';
  const backgroundColor = useThemeColor({}, 'background');

  // Google OAuth configuration
  const redirectUri = 'https://qxaglwwcaqovyyuopkxi.supabase.co/auth/v1/callback';

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const [, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: '945343903925-q87c6knt6aid2idm8v0500gflogikm3l.apps.googleusercontent.com',
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        access_type: 'offline',
      },
    },
    discovery
  );

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!email) {
      errors.email = 'Email cím megadása kötelező';
    } else if (!validateEmail(email)) {
      errors.email = 'Érvénytelen email cím formátum';
    }

    if (!password) {
      errors.password = 'Jelszó megadása kötelező';
    } else if (password.length < 6) {
      errors.password = 'A jelszónak legalább 6 karakter hosszúnak kell lennie';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAuthSuccess = async () => {
    await refreshSession();
  };

  const handleAuthError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Hiba', 'Kérjük, adja meg az email címét a jelszó visszaállításához.');
      return;
    }
    
    Alert.alert(
      'Jelszó visszaállítás',
      'Jelszó visszaállítási linket küldünk a megadott email címre.',
      [
        { text: 'Mégse', style: 'cancel' },
        { 
          text: 'Küldés', 
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'parksafe://reset-password',
              });
              
              if (error) {
                Alert.alert('Hiba', error.message);
              } else {
                Alert.alert('Siker', 'Jelszó visszaállítási link elküldve!');
              }
            } catch (err) {
              Alert.alert('Hiba', 'Váratlan hiba történt.');
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
      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { code } = result.params;
        
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: code,
        });
        
        if (error) {
          handleAuthError(error.message);
        } else {
          await handleAuthSuccess();
        }
      } else if (result.type === 'cancel') {
        // User cancelled the auth flow - no need to show error
      } else {
        handleAuthError('Google bejelentkezés sikertelen. Kérjük, próbálja újra.');
      }
    } catch (err) {
      handleAuthError('Váratlan hiba történt a Google bejelentkezés során.');
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
        handleAuthError(error.message);
      } else {
        await handleAuthSuccess();
      }
    } catch (err) {
      handleAuthError('Váratlan hiba történt. Kérjük, próbálja újra.');
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
          <View style={styles.form}>
            <View style={styles.header}>
              <ThemedText style={styles.title} type="title">Bejelentkezés</ThemedText>
              <ThemedText style={styles.subtitle}>
                Üdvözöljük újra! Jelentkezzen be fiókjába
              </ThemedText>
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                Email cím
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
                  placeholder="pelda@email.com"
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
                Jelszó
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
                  placeholder="Jelszó"
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
                <ThemedText style={styles.forgotPassword}>Elfelejtett jelszó?</ThemedText>
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
                <ThemedText style={styles.buttonText}>Bejelentkezés</ThemedText>
              )}
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <ThemedText style={[styles.dividerText, { color: placeholderColor }]}>
                vagy
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
                    Bejelentkezés Google-lel
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: placeholderColor }]}>
                Nincs fiókja?
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <ThemedText style={styles.link}>Regisztráljon most!</ThemedText>
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