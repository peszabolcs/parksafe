import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthResult {
  success: boolean;
  error?: string;
}

export async function handleGoogleAuth(authType: 'login' | 'register' = 'login'): Promise<GoogleAuthResult> {
  try {
    const redirectTo = 'parksafe://auth/callback';
    
    console.log(`Starting Google OAuth for ${authType}...`);
    console.log('Redirect URI:', redirectTo);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: authType === 'register' ? 'consent select_account' : 'consent',
        },
        // Force mobile flow
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      console.error('Supabase OAuth error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    if (data.url) {
      console.log('Opening Google OAuth URL:', data.url);
      console.log('Redirect URL:', redirectTo);
      
      const result = await WebBrowser.openAuthSessionAsync(
        data.url, 
        redirectTo,
        {
          // Automatically dismiss when redirected to scheme
          dismissButtonStyle: 'cancel',
          preferEphemeralSession: true,
          // Force new session to avoid cache issues
          createTask: false,
        }
      );
      
      console.log('WebBrowser result:', result);
      
      if (result.type === 'success' && result.url) {
        console.log('WebBrowser success, processing URL:', result.url);
        
        // Parse the URL to extract tokens
        const url = new URL(result.url);
        const accessToken = url.hash.match(/access_token=([^&]+)/)?.[1];
        const refreshToken = url.hash.match(/refresh_token=([^&]+)/)?.[1];
        const expiresIn = url.hash.match(/expires_in=([^&]+)/)?.[1];
        
        console.log('Extracted tokens:', { 
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          expiresIn 
        });
        
        if (accessToken && refreshToken) {
          try {
            // Set the session manually with the tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) {
              console.error('Error setting session:', sessionError);
              return { success: false, error: 'Hiba a session beállításakor: ' + sessionError.message };
            } else if (sessionData.session) {
              console.log('Session set successfully:', sessionData.session.user.email);
              return { success: true };
            } else {
              console.error('No session returned from setSession');
              return { success: false, error: 'Session nem jött létre.' };
            }
          } catch (err) {
            console.error('Error processing tokens:', err);
            return { success: false, error: 'Token feldolgozási hiba.' };
          }
        } else {
          console.error('Missing tokens in URL');
          return { success: false, error: 'Hiányzó tokenek az OAuth válaszban.' };
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled Google OAuth');
        return { success: false, error: 'Bejelentkezés megszakítva.' };
      } else {
        console.log('Google OAuth failed:', result);
        return { success: false, error: 'Google bejelentkezés sikertelen.' };
      }
    } else {
      return { success: false, error: 'OAuth URL nem érhető el.' };
    }
  } catch (err) {
    console.error('Google auth error:', err);
    return { success: false, error: 'Váratlan hiba történt a Google bejelentkezés során.' };
  }
}