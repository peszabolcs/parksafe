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
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import CountryFlag from 'react-native-country-flag';
import { useProfileStore } from '@/stores/profileStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const COUNTRY_CODES = [
  { code: '+36', country: 'HU' },
  { code: '+1', country: 'US' },
  { code: '+44', country: 'GB' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
];

interface ValidationErrors {
  username?: string;
  phone?: string;
  dob?: string;
}

function getCountryFromPhone(phone: string) {
  for (const entry of COUNTRY_CODES) {
    if (phone.startsWith(entry.code)) return entry.country;
  }
  return null;
}

export default function CompleteProfileScreen() {
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('+36 ');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(null);
  
  const { user } = useAuthStore();
  const { updateProfile, checkUsernameAvailability } = useProfileStore();

  const usernameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const inputBg = useThemeColor({ light: '#F8FAFC', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E2E8F0', dark: '#374151' }, 'background');
  const errorBorderColor = '#EF4444';
  const textColor = useThemeColor({}, 'text');
  const labelColor = useThemeColor({ light: '#374151', dark: '#D1D5DB' }, 'text');
  const placeholderColor = useThemeColor({ light: '#9CA3AF', dark: '#6B7280' }, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  const country = getCountryFromPhone(phone);

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  };

  const clearValidationError = (field: keyof ValidationErrors) => {
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const validateForm = async (): Promise<boolean> => {
    const errors: ValidationErrors = {};

    if (!username.trim()) {
      errors.username = 'Felhasználónév megadása kötelező';
    } else if (username.length < 3) {
      errors.username = 'A felhasználónévnek legalább 3 karakter hosszúnak kell lennie';
    } else {
      // Check username availability
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        errors.username = 'Ez a felhasználónév már foglalt';
      }
    }

    if (!phone) {
      errors.phone = 'Telefonszám megadása kötelező';
    } else if (!validatePhone(phone)) {
      errors.phone = 'Érvénytelen telefonszám formátum';
    }

    if (!dob) {
      errors.dob = 'Születési dátum megadása kötelező';
    } else {
      const selectedDate = new Date(dob);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120);
      const maxDate = new Date();
      maxDate.setFullYear(today.getFullYear() - 13);

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

  const handleCompleteProfile = async () => {
    if (!await validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // First update the profile with basic info
      const success = await updateProfile({
        username,
        phone,
        full_name: user?.user_metadata?.full_name || null,
        avatar_url: user?.user_metadata?.avatar_url || null,
      });

      if (success && dob) {
        // Also update the dob field directly in the database
        const { error: dobError } = await supabase
          .from('profiles')
          .update({ dob })
          .eq('id', user?.id);
        
        if (dobError) {
          console.error('Error updating DOB:', dobError);
          // Continue anyway, as basic profile is saved
        }
      }

      if (success) {
        // Also store additional fields if your schema supports them
        // For now, we'll just proceed to the main app
        router.replace('/(tabs)');
      } else {
        Alert.alert('Hiba', 'Hiba történt a profil frissítése során. Kérjük, próbálja újra.');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      Alert.alert('Hiba', 'Váratlan hiba történt. Kérjük, próbálja újra.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDobDate(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setDob(formattedDate);
      clearValidationError('dob');
    }
  };

  const handleDateConfirm = () => {
    if (dobDate) {
      const year = dobDate.getFullYear();
      const month = String(dobDate.getMonth() + 1).padStart(2, '0');
      const day = String(dobDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setDob(formattedDate);
      clearValidationError('dob');
    }
    setShowDatePicker(false);
  };

  const getDateForPicker = (): Date => {
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
              <ThemedText style={styles.title} type="title">
                Profil kiegészítése
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                A Google bejelentkezés sikeres volt! Kérjük, egészítse ki profilját a következő adatokkal.
              </ThemedText>
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                Felhasználónév *
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
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
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
                <ThemedText style={styles.errorText}>{validationErrors.username}</ThemedText>
              )}
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                Telefonszám *
              </ThemedText>
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: inputBg, 
                  borderColor: validationErrors.phone ? errorBorderColor : borderColor 
                }
              ]}> 
                <View style={styles.phoneIconContainer}>
                  {country ? (
                    <CountryFlag isoCode={country} size={20} />
                  ) : (
                    <Ionicons 
                      name="call-outline" 
                      size={20} 
                      color={placeholderColor} 
                    />
                  )}
                </View>
                <TextInput
                  ref={phoneRef}
                  style={[styles.input, { color: textColor }]}
                  placeholder="+36 20 123 4567"
                  placeholderTextColor={placeholderColor}
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

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                Születési dátum *
              </ThemedText>
              <Pressable 
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: inputBg,
                    borderColor: validationErrors.dob ? errorBorderColor : borderColor 
                  }
                ]}
                disabled={loading}
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
                    value={getDateForPicker()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(new Date().getFullYear() - 120, 0, 1)}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.dateConfirmButton}
                      onPress={handleDateConfirm}
                    >
                      <ThemedText style={styles.dateConfirmText}>Megerősítés</ThemedText>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleCompleteProfile} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.buttonText}>Profil kiegészítése</ThemedText>
              )}
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
    gap: 20,
  },
  header: {
    alignItems: 'center',
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
  phoneIconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#34aa56',
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
  dateConfirmButton: {
    backgroundColor: '#34aa56',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  dateConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});