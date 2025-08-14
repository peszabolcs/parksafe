import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';

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

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true, // Essential for refresh tokens
  forceCodeForRefreshToken: true, // Force refresh token on Android
  scopes: ['openid', 'email', 'profile'], // Standard scopes
});

export class GoogleAuth {
  static async authenticate(): Promise<GoogleAuthResult> {
    try {
      console.log('Starting Google Sign-In...');
      console.log('Configuration check:', {
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'Set' : 'Missing',
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ? 'Set' : 'Missing',
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ? 'Set' : 'Missing'
      });
      
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.data?.idToken) {
        console.error('No ID token received from Google Sign-In');
        return { success: false, error: 'Google bejelentkezés sikertelen - hiányzó token' };
      }

      console.log('Google Sign-In successful, signing in with Supabase...');
      console.log('ID Token present:', !!userInfo.data.idToken);
      console.log('Access Token present:', !!userInfo.data.accessToken);
      console.log('Server Auth Code present:', !!userInfo.data.serverAuthCode);
      
      // Sign in with Supabase using the ID token and access token for proper session persistence
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.data.idToken,
        access_token: userInfo.data.accessToken,
        refresh_token: userInfo.data.serverAuthCode, // Server auth code can be used as refresh token
      });

      if (error) {
        console.error('Supabase auth error:', error);
        return { success: false, error: error.message };
      }

      if (!data.user || !data.session) {
        console.error('No user/session data received from Supabase');
        return { success: false, error: 'Felhasználói adatok hiányoznak' };
      }

      console.log('User authenticated:', data.user.email);
      console.log('Session details:', {
        access_token: !!data.session.access_token,
        refresh_token: !!data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in
      });

      // Ensure session is properly stored
      if (data.session) {
        console.log('Manually setting session to ensure persistence...');
        const { error: setError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        
        if (setError) {
          console.warn('Warning: Could not set session manually:', setError);
        } else {
          console.log('Session set successfully');
        }
      }
      
      // Create Google user data from the userInfo
      const googleUserData: GoogleUserData = {
        id: userInfo.data.user.id,
        email: userInfo.data.user.email,
        verified_email: userInfo.data.user.emailVerified ?? true,
        name: userInfo.data.user.name,
        given_name: userInfo.data.user.givenName ?? '',
        family_name: userInfo.data.user.familyName ?? '',
        picture: userInfo.data.user.photo ?? '',
        locale: 'hu' // Default locale
      };
      
      // Update profile with Google data
      const profileStore = useProfileStore.getState();
      await profileStore.upsertGoogleProfile(data.user.id, googleUserData);
      
      // Force auth store update asynchronously to avoid useInsertionEffect warning
      setTimeout(async () => {
        await useAuthStore.getState().forceSessionUpdate();
      }, 0);
      
      return { success: true };
      
    } catch (error: any) {
      console.error('Google auth error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: 'Bejelentkezés megszakítva' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { success: false, error: 'Bejelentkezés folyamatban...' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { success: false, error: 'Google Play Services nem elérhető' };
      } else {
        return { success: false, error: 'Váratlan hiba történt' };
      }
    }
  }

  static async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      console.log('Google Sign-In signed out successfully');
    } catch (error) {
      console.error('Error signing out from Google:', error);
    }
  }

  static async isSignedIn(): Promise<boolean> {
    return await GoogleSignin.isSignedIn();
  }

  static async getCurrentUser() {
    try {
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      console.error('Error getting current Google user:', error);
      return null;
    }
  }

}

export { GoogleSigninButton };