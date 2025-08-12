import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';

// Global flag to prevent multiple navigation attempts
let hasNavigatedGlobally = false;

export default function AuthCallback() {
  const router = useRouter();
  const { initializeAuth } = useAuthStore();
  const { loadProfile } = useProfileStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Prevent multiple navigations globally
      if (hasNavigatedGlobally) {
        return;
      }
      
      try {
        // Wait for Supabase to process OAuth
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session?.user) {
          hasNavigatedGlobally = true;
          router.replace('/login');
          return;
        }
        
        // Initialize auth and load profile
        await initializeAuth();
        await loadProfile(session.user.id);
        
        // Check profile completeness
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, phone')
          .eq('id', session.user.id)
          .single();
        
        // Set global flag before navigation
        hasNavigatedGlobally = true;
        
        if (!profileData?.username || !profileData?.phone) {
          router.replace('/complete-profile');
        } else {
          router.replace('/(tabs)');
        }
        
      } catch (error) {
        console.error('Auth callback error:', error);
        if (!hasNavigatedGlobally) {
          hasNavigatedGlobally = true;
          router.replace('/complete-profile');
        }
      }
    };

    // Single timeout to run handler
    const timeoutId = setTimeout(handleAuthCallback, 200);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []); // Empty deps - run only once

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