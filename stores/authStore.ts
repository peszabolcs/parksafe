import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  let authSubscription: any = null;
  let isInitialized = false;

  return {
    session: null,
    user: null,
    loading: true,

    initializeAuth: async () => {
      // Prevent multiple initializations
      if (isInitialized) {
        return;
      }
      isInitialized = true;

      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        console.log('Initial session check:', initialSession ? 'Session found' : 'No session');
        
        set({ 
          session: initialSession, 
          user: initialSession?.user ?? null,
          loading: false 
        });

        // Clean up any existing subscription
        if (authSubscription) {
          authSubscription.unsubscribe();
        }

        // Listen for auth changes - but prevent spam
        let lastSessionId: string | null = initialSession?.access_token ?? null;
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            // Prevent duplicate events for the same session
            const currentSessionId = newSession?.access_token ?? null;
            
            if (currentSessionId === lastSessionId && event === 'INITIAL_SESSION') {
              return; // Skip duplicate initial session events
            }
            
            lastSessionId = currentSessionId;
            
            // Only log meaningful events
            if (event !== 'INITIAL_SESSION' || newSession) {
              console.log('Auth state changed:', event, newSession?.user?.email ?? 'No user');
            }
            
            set({ 
              session: newSession, 
              user: newSession?.user ?? null,
              loading: false 
            });

            // Handle token refresh
            if (event === 'TOKEN_REFRESHED' && newSession) {
              console.log('Token refreshed successfully');
            }
          }
        );

        authSubscription = subscription;

        // Set up automatic token refresh (only if we have a session)
        if (initialSession) {
          const setupTokenRefresh = () => {
            // Refresh token every 23 hours (before the 24-hour expiry)
            const refreshInterval = setInterval(async () => {
              try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                if (currentSession) {
                  const { data, error } = await supabase.auth.refreshSession();
                  if (error) {
                    console.error('Error refreshing token:', error);
                  } else {
                    console.log('Token refreshed automatically');
                  }
                }
              } catch (error) {
                console.error('Error in token refresh interval:', error);
              }
            }, 23 * 60 * 60 * 1000); // 23 hours

            return refreshInterval;
          };

          const refreshInterval = setupTokenRefresh();

          // Store the cleanup function
          (get() as any).cleanupAuth = () => {
            if (authSubscription) {
              authSubscription.unsubscribe();
              authSubscription = null;
            }
            clearInterval(refreshInterval);
            isInitialized = false;
          };
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        set({ loading: false });
      }
    },

    signOut: async () => {
      try {
        // Clean up before signing out
        if ((get() as any).cleanupAuth) {
          (get() as any).cleanupAuth();
        }
        
        await supabase.auth.signOut();
        
        // Reset state immediately
        set({ 
          session: null, 
          user: null, 
          loading: false 
        });
        
        isInitialized = false;
      } catch (error) {
        console.error('Error signing out:', error);
      }
    },

    refreshSession: async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Error refreshing session:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error refreshing session:', error);
        throw error;
      }
    },
  };
}); 