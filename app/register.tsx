import React, { useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import CountryFlag from 'react-native-country-flag';
import { useAuthStore } from '@/stores/authStore';

const COUNTRY_CODES = [
  { code: '+36', country: 'HU' },
  { code: '+1', country: 'US' },
  { code: '+44', country: 'GB' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  // Add more as needed
];

interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  dob?: string;
}

function getCountryFromPhone(phone: string) {
  for (const entry of COUNTRY_CODES) {
    if (phone.startsWith(entry.code)) return entry.country;
  }
  return null;
}

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const { refreshSession } = useAuthStore();

  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const borderColor = useThemeColor({ light: '#E2E8F0', dark: '#374151' }, 'background');
  const errorBorderColor = '#EF4444';
  const inputBg = useThemeColor({ light: '#F8FAFC', dark: '#1F2937' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const labelColor = useThemeColor({ light: '#374151', dark: '#D1D5DB' }, 'text');
  const placeholderColor = useThemeColor({ light: '#9CA3AF', dark: '#6B7280' }, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  const country = getCountryFromPhone(phone);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!username.trim()) {
      errors.username = 'Felhasználónév megadása kötelező';
    } else if (username.length < 3) {
      errors.username = 'A felhasználónévnek legalább 3 karakter hosszúnak kell lennie';
    }

    if (!email) {
      errors.email = 'Email cím megadása kötelező';
    } else if (!validateEmail(email)) {
      errors.email = 'Érvénytelen email cím formátum';
    }

    if (!password) {
      errors.password = 'Jelszó megadása kötelező';
    } else if (password.length < 8) {
      errors.password = 'A jelszónak legalább 8 karakter hosszúnak kell lennie';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Jelszó megerősítése kötelező';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'A jelszavak nem egyeznek';
    }

    if (!phone) {
      errors.phone = 'Telefonszám megadása kötelező';
    } else if (!validatePhone(phone)) {
      errors.phone = 'Érvénytelen telefonszám formátum';
    }

    if (!dob) {
      errors.dob = 'Születési dátum megadása kötelező';
    } else {
      // Validate that the date is not in the future and user is at least 13 years old
      const selectedDate = new Date(dob);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120); // Maximum 120 years ago
      const maxDate = new Date();
      maxDate.setFullYear(today.getFullYear() - 13); // Minimum 13 years old
      
      if (selectedDate > today) {
        errors.dob = 'A születési dátum nem lehet a jövőben';
      } else if (selectedDate < minDate) {
        errors.dob = 'A születési dátum nem lehet 120 évnél régebbi';
      } else if (selectedDate > maxDate) {
        errors.dob = 'A felhasználónak legalább 13 évesnek kell lennie';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearValidationError = (field: keyof ValidationErrors) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  async function handleRegister() {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            dob,
            phone,
          },
        },
      });
      
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      
      // Registration successful, show success message and redirect
      Alert.alert(
        'Siker!',
        'Fiókja sikeresen létrejött! Kérjük, ellenőrizze email címét a megerősítéshez.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (err) {
      setError('Váratlan hiba történt. Kérjük, próbálja újra.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  }

  function onDateChange(event: any, selectedDate?: Date) {
    // Handle dismissal (user cancels)
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    
    // Handle set (user confirms on Android)
    if (event.type === 'set' && selectedDate) {
      setDobDate(selectedDate);
      // Fix timezone issue by using local date formatting instead of toISOString()
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Debug logging
      console.log('Date picker - Original date:', selectedDate);
      console.log('Date picker - Formatted date:', formattedDate);
      console.log('Date picker - Event type:', event.type);
      
      setDob(formattedDate);
      clearValidationError('dob');
      
      // On Android, close picker after selection
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
      // On iOS, keep picker open for further adjustments
    }
  }

  function handleDateConfirm() {
    if (dobDate) {
      // Ensure the date is properly formatted when user confirms
      const year = dobDate.getFullYear();
      const month = String(dobDate.getMonth() + 1).padStart(2, '0');
      const day = String(dobDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Debug logging
      console.log('Date confirm - Original date:', dobDate);
      console.log('Date confirm - Formatted date:', formattedDate);
      
      setDob(formattedDate);
      clearValidationError('dob');
    }
    setShowDatePicker(false);
  }

  // Calculate default date for picker (18 years ago)
  const getDefaultDate = () => {
    if (dobDate) return dobDate;
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 18);
    return defaultDate;
  };

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
              <ThemedText style={styles.title} type="title">Regisztráció</ThemedText>
              <ThemedText style={styles.subtitle}>
                Hozzon létre egy új fiókot a szolgáltatás használatához
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                Felhasználónév
              </ThemedText>
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: inputBg, 
                  borderColor: validationErrors.username ? errorBorderColor : borderColor 
                }
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={placeholderColor} 
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={usernameRef}
                  style={[styles.input, { color: textColor }]}
                  placeholder="Felhasználónév"
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="none"
                  autoComplete="username"
                  textContentType="username"
                  returnKeyType="next"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    clearValidationError('username');
                  }}
                  onSubmitEditing={() => emailRef.current?.focus()}
                  editable={!loading}
                />
              </View>
              {validationErrors.username && (
                <ThemedText style={styles.errorText}>{validationErrors.username}</ThemedText>
              )}
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
                    clearValidationError('email');
                  }}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!loading}
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
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="next"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearValidationError('password');
                  }}
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
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

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                Jelszó megerősítése
              </ThemedText>
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: inputBg, 
                  borderColor: validationErrors.confirmPassword ? errorBorderColor : borderColor 
                }
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={placeholderColor} 
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={confirmPasswordRef}
                  style={[styles.input, { color: textColor }]}
                  placeholder="Jelszó megerősítése"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="next"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearValidationError('confirmPassword');
                  }}
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={placeholderColor} 
                  />
                </TouchableOpacity>
              </View>
              {validationErrors.confirmPassword && (
                <ThemedText style={styles.errorText}>{validationErrors.confirmPassword}</ThemedText>
              )}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                Telefonszám
              </ThemedText>
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: inputBg, 
                  borderColor: validationErrors.phone ? errorBorderColor : borderColor 
                }
              ]}> 
                {country && (
                  <View style={styles.flagContainer}>
                    <CountryFlag isoCode={country} size={20} />
                  </View>
                )}
                <TextInput
                  ref={phoneRef}
                  style={[styles.input, { color: textColor }]}
                  placeholder="+36 20 123 4567"
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="none"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  returnKeyType="next"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    clearValidationError('phone');
                  }}
                  onSubmitEditing={() => setShowDatePicker(true)}
                  editable={!loading}
                />
              </View>
              {validationErrors.phone && (
                <ThemedText style={styles.errorText}>{validationErrors.phone}</ThemedText>
              )}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                Születési dátum
              </ThemedText>
              <Pressable 
                onPress={() => setShowDatePicker(true)} 
                disabled={loading}
                style={[
                  styles.inputContainer, 
                  { 
                    backgroundColor: inputBg, 
                    borderColor: validationErrors.dob ? errorBorderColor : borderColor 
                  }
                ]}
              > 
                <Ionicons 
                  name="calendar-outline" 
                  size={20} 
                  color={placeholderColor} 
                  style={styles.inputIcon}
                />
                <ThemedText style={{ color: dob ? textColor : placeholderColor, flex: 1 }}>
                  {dob ? dob : 'YYYY-MM-DD'}
                </ThemedText>
              </Pressable>
              {validationErrors.dob && (
                <ThemedText style={styles.errorText}>{validationErrors.dob}</ThemedText>
              )}
              {showDatePicker && (
                <>
                  <DateTimePicker
                    value={getDefaultDate()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={(() => {
                      const maxDate = new Date();
                      maxDate.setFullYear(maxDate.getFullYear() - 13);
                      return maxDate;
                    })()}
                    minimumDate={(() => {
                      const minDate = new Date();
                      minDate.setFullYear(minDate.getFullYear() - 120);
                      return minDate;
                    })()}
                  />
                  {Platform.OS === 'ios' && (
                    <View style={styles.datePickerButtons}>
                      <TouchableOpacity 
                        style={styles.datePickerButton} 
                        onPress={() => setShowDatePicker(false)}
                      >
                        <ThemedText style={styles.datePickerButtonText}>Mégse</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.datePickerButton, styles.datePickerButtonPrimary]} 
                        onPress={handleDateConfirm}
                      >
                        <ThemedText style={styles.datePickerButtonTextPrimary}>Kész</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                <ThemedText style={styles.error}>{error}</ThemedText>
              </View>
            ) : null}

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleRegister} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.buttonText}>Regisztráció</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: placeholderColor }]}>
                Van már fiókja?
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <ThemedText style={styles.link}>Jelentkezzen be!</ThemedText>
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
  flagContainer: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
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
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
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
    color: '#0a7ea4',
    fontWeight: '600',
    fontSize: 14,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  datePickerButtonPrimary: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  datePickerButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  datePickerButtonTextPrimary: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 