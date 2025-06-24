import { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform, Pressable } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import CountryFlag from 'react-native-country-flag';
import { useAuth } from '@/context/AuthContext';

const COUNTRY_CODES = [
  { code: '+36', country: 'HU' },
  { code: '+1', country: 'US' },
  { code: '+44', country: 'GB' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  // Add more as needed
];

function getCountryFromPhone(phone: string) {
  for (const entry of COUNTRY_CODES) {
    if (phone.startsWith(entry.code)) return entry.country;
  }
  return null;
}

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const { refreshSession } = useAuth();

  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#27272A' }, 'background');
  const inputBg = useThemeColor({ light: '#F1F5F9', dark: '#18181B' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const labelColor = useThemeColor({ light: '#334155', dark: '#CBD5E1' }, 'text');
  const placeholderColor = useThemeColor({ light: '#64748B', dark: '#A1A1AA' }, 'text');

  const country = getCountryFromPhone(phone);

  async function handleRegister() {
    // Validation
    if (!email || !password || !username || !dob || !phone) {
      setError('Kérjük, töltse ki az összes mezőt');
      return;
    }

    if (password.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie');
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
      
      // Registration successful, redirect to login
      router.replace('/login');
    } catch (err) {
      setError('Váratlan hiba történt. Kérjük, próbálja újra.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  }

  function onDateChange(event: any, selectedDate?: Date) {
    setShowDatePicker(false);
    if (selectedDate) {
      setDobDate(selectedDate);
      setDob(selectedDate.toISOString().slice(0, 10));
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.form}>
        <ThemedText style={styles.title} type="title">Regisztráció</ThemedText>
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: labelColor }]}>Felhasználónév</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="Felhasználónév"
            placeholderTextColor={placeholderColor}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            editable={!loading}
          />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: labelColor }]}>Születési dátum</ThemedText>
          <Pressable onPress={() => setShowDatePicker(true)} disabled={loading}>
            <View style={[styles.input, { backgroundColor: inputBg, borderColor, flexDirection: 'row', alignItems: 'center' }]}> 
              <ThemedText style={{ color: dob ? textColor : placeholderColor }}>
                {dob ? dob : 'YYYY-MM-DD'}
              </ThemedText>
            </View>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={dobDate || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: labelColor }]}>Telefonszám</ThemedText>
          <View style={[styles.input, { backgroundColor: inputBg, borderColor, flexDirection: 'row', alignItems: 'center' }]}> 
            {country && (
              <View style={{ marginRight: 8 }}>
                <CountryFlag isoCode={country} size={20} />
              </View>
            )}
            <TextInput
              style={{ flex: 1, color: textColor, fontSize: 16 }}
              placeholder="Telefonszám"
              placeholderTextColor={placeholderColor}
              autoCapitalize="none"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              editable={!loading}
            />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: labelColor }]}>Email</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="Email"
            placeholderTextColor={placeholderColor}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: labelColor }]}>Jelszó</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="Jelszó"
            placeholderTextColor={placeholderColor}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
        </View>
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister} 
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? 'Regisztráció...' : 'Regisztráció'}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.linkRow}>
          <ThemedText style={styles.link}>Van már fiókod? Jelentkezz be!</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    gap: 18,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 0,
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 4,
  },
  linkRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  link: {
    color: '#0a7ea4',
    fontWeight: '500',
  },
}); 