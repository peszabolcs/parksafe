import { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshSession } = useAuth();

  const inputBg = useThemeColor({ light: '#F1F5F9', dark: '#232329' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#27272A' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const labelColor = useThemeColor({ light: '#334155', dark: '#CBD5E1' }, 'text');

  async function handleLogin() {
    if (!email || !password) {
      setError('Kérjük, töltse ki az összes mezőt');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setError(error.message);
      } else {
        // Refresh session to ensure we have the latest data
        await refreshSession();
        // The AuthGate will handle the navigation
      }
    } catch (err) {
      setError('Váratlan hiba történt. Kérjük, próbálja újra.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.form}>
        <ThemedText style={styles.title} type="title">Bejelentkezés</ThemedText>
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: labelColor }]}>Email</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="Email"
            placeholderTextColor={borderColor}
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
            placeholderTextColor={borderColor}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
        </View>
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin} 
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/register')} style={styles.linkRow}>
          <ThemedText style={styles.link}>Nincs fiókod? Regisztrálj!</ThemedText>
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
    gap: 16,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 10,
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
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
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