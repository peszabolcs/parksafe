import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useProfileStore } from '@/stores/profileStore';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  forceSessionUpdate: () => Promise<void>;
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
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        // Handle invalid refresh token errors
        if (sessionError && sessionError.message.includes('Invalid Refresh Token')) {
          console.log('Invalid refresh token detected, clearing stored session');
          await supabase.auth.signOut();
          set({ 
            session: null, 
            user: null,
            loading: false 
          });
          return;
        }
        
        console.log('Initial session check:', initialSession ? 'Session found' : 'No session');
        
        set({ 
          session: initialSession, 
          user: initialSession?.user ?? null,
          loading: false 
        });

        // Load profile data if user is already signed in
        if (initialSession?.user) {
          useProfileStore.getState().loadProfile(initialSession.user.id);
        }

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

            // Load profile data when user signs in
            if (newSession?.user && event === 'SIGNED_IN') {
              useProfileStore.getState().loadProfile(newSession.user.id);
              
              // Set user-specific onboarding flag if global onboarding was completed
              try {
                const globalOnboarding = await AsyncStorage.getItem('hasSeenOnboarding_global');
                if (globalOnboarding === 'true') {
                  const userOnboardingKey = `hasSeenOnboarding_${newSession.user.id}`;
                  await AsyncStorage.setItem(userOnboardingKey, 'true');
                }
              } catch (error) {
                console.error('Error setting user onboarding flag:', error);
              }
            }
            
            // Clear profile data when user signs out
            if (event === 'SIGNED_OUT') {
              useProfileStore.getState().clearProfile();
            }

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
                    // If refresh token is invalid, sign out the user
                    if (error.message.includes('Invalid Refresh Token')) {
                      console.log('Invalid refresh token during auto-refresh, signing out');
                      await get().signOut();
                    }
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
        
        // Clear profile data
        useProfileStore.getState().clearProfile();
        
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
          // If refresh token is invalid, sign out the user
          if (error.message.includes('Invalid Refresh Token')) {
            console.log('Invalid refresh token in refreshSession, signing out');
            await get().signOut();
          }
          throw error;
        }
      } catch (error) {
        console.error('Error refreshing session:', error);
        throw error;
      }
    },

    forceSessionUpdate: async () => {
      try {
        console.log('Forcing session update...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          console.log('Force update: Session found, updating store');
          set({ 
            session: currentSession, 
            user: currentSession.user,
            loading: false 
          });

          // Load profile data
          useProfileStore.getState().loadProfile(currentSession.user.id);
        } else {
          console.log('Force update: No session found');
          set({ 
            session: null, 
            user: null,
            loading: false 
          });
        }
      } catch (error) {
        console.error('Error forcing session update:', error);
        set({ loading: false });
      }
    },
  };
}); 