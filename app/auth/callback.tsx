import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/stores/authStore';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait a bit to ensure Supabase has processed the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the current session to check if OAuth succeeded
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/login');
          return;
        }

        if (session?.user) {
          console.log('OAuth success! User:', session.user.email);
          await initializeAuth();
          router.replace('/(tabs)');
        } else {
          console.log('No session found after OAuth, redirecting to login');
          // Give it one more chance after a short delay
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession?.user) {
              console.log('OAuth success on retry:', retrySession.user.email);
              await initializeAuth();
              router.replace('/(tabs)');
            } else {
              router.replace('/login');
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        router.replace('/login');
      }
    };

    handleAuthCallback();
  }, [params, router, initializeAuth]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#fff'
    }}>
      <ActivityIndicator size="large" color="#34aa56" />
      <ThemedText style={{ marginTop: 16, fontSize: 16 }}>
        Bejelentkezés folyamatban...
      </ThemedText>
    </View>
  );
}