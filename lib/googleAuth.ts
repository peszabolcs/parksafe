import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';

WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthResult {
  success: boolean;
  error?: string;
}

interface GoogleUserData {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export class GoogleAuth {
  static async authenticate(): Promise<GoogleAuthResult> {
    try {
      const redirectTo = 'parksafe://auth/callback';
      
      console.log('Starting Google OAuth...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        return { success: false, error: error.message };
      }

      if (data.url) {
        console.log('Opening Google OAuth URL:', data.url);
        
        const result = await WebBrowser.openAuthSessionAsync(
          data.url, 
          redirectTo,
          {
            dismissButtonStyle: 'cancel',
            preferEphemeralSession: false, // Allow session persistence for faster subsequent logins
            createTask: false,
          }
        );
        
        console.log('WebBrowser result:', result);
        
        if (result.type === 'success' && result.url) {
          return await this.handleAuthSuccess(result.url);
        } else if (result.type === 'cancel') {
          return { success: false, error: 'Bejelentkezés megszakítva' };
        } else {
          return { success: false, error: 'Google bejelentkezés sikertelen' };
        }
      } else {
        return { success: false, error: 'OAuth URL nem érhető el' };
      }
    } catch (error) {
      console.error('Google auth error:', error);
      return { success: false, error: 'Váratlan hiba történt' };
    }
  }

  private static async handleAuthSuccess(callbackUrl: string): Promise<GoogleAuthResult> {
    try {
      // Parse the callback URL to extract tokens
      const url = new URL(callbackUrl);
      const accessToken = url.hash.match(/access_token=([^&]+)/)?.[1];
      const refreshToken = url.hash.match(/refresh_token=([^&]+)/)?.[1];
      
      console.log('Extracted tokens:', { 
        accessToken: accessToken ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing'
      });
      
      if (accessToken && refreshToken) {
        // Set the session with tokens
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (sessionError || !sessionData.session) {
          console.error('Session creation error:', sessionError);
          return { success: false, error: 'Session létrehozása sikertelen' };
        }

        const user = sessionData.session.user;
        console.log('User authenticated:', user.email);
        
        // Fetch user data from Google using the access token
        let googleUserData: GoogleUserData | null = null;
        try {
          googleUserData = await this.fetchGoogleUserData(accessToken);
        } catch (error) {
          console.warn('Failed to fetch Google user data:', error);
        }
        
        // Update profile with Google data (don't check completeness here)
        if (googleUserData) {
          const profileStore = useProfileStore.getState();
          await profileStore.upsertGoogleProfile(user.id, googleUserData);
        }
        
        // Force auth store update
        await useAuthStore.getState().forceSessionUpdate();
        
        return {
          success: true,
          // Let the callback handler determine profile completeness
        };
      } else {
        return { success: false, error: 'Hiányzó tokenek az OAuth válaszban' };
      }
    } catch (error) {
      console.error('Auth success handling error:', error);
      return { success: false, error: 'Profil adatok feldolgozása sikertelen' };
    }
  }

  private static async fetchGoogleUserData(accessToken: string): Promise<GoogleUserData> {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Google user data');
    }

    return response.json();
  }

}

// No auto-initialization needed with the simplified approach