import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initializeAuth } = useAuthStore();
  const { loadProfile } = useProfileStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('Auth callback screen loaded, params:', params);
      
      try {
        // Wait a bit to ensure Supabase has processed the OAuth callback
        console.log('Waiting for Supabase to process OAuth...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the current session to check if OAuth succeeded
        console.log('Checking for session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/login');
          return;
        }

        if (session?.user) {
          console.log('OAuth success! User:', session.user.email);
          await initializeAuth();
          
          // Check if profile is complete
          try {
            await loadProfile(session.user.id);
            
            // Check if user has completed required profile fields
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, phone')
              .eq('id', session.user.id)
              .single();
            
            if (!profileData?.username || !profileData?.phone) {
              // Profile is incomplete, go to completion screen
              console.log('Profile incomplete, redirecting to complete-profile');
              router.replace('/complete-profile');
            } else {
              // Profile is complete, go to main app
              console.log('Profile complete, redirecting to main app');
              router.replace('/(tabs)');
            }
          } catch (error) {
            console.error('Error checking profile completion:', error);
            // If profile check fails, assume incomplete and go to completion
            router.replace('/complete-profile');
          }
        } else {
          console.log('No session found after OAuth, redirecting to login');
          // Give it one more chance after a short delay
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession?.user) {
              console.log('OAuth success on retry:', retrySession.user.email);
              await initializeAuth();
              
              // Check profile completion for retry session too
              try {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('username, phone')
                  .eq('id', retrySession.user.id)
                  .single();
                
                if (!profileData?.username || !profileData?.phone) {
                  router.replace('/complete-profile');
                } else {
                  router.replace('/(tabs)');
                }
              } catch (error) {
                router.replace('/complete-profile');
              }
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