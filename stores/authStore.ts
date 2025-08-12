import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useProfileStore } from '@/stores/profileStore';
import { ErrorHandler, handleError } from '@/lib/errorHandler';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  forceSessionUpdate: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  let authSubscription: any = null;
  let isInitialized = false;

  return {
    session: null,
    user: null,
    loading: true,
    error: null,

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
        if (sessionError) {
          const errorResult = handleError(sessionError);
          
          if (ErrorHandler.shouldSignOut(sessionError)) {
            console.log('Invalid refresh token detected, clearing stored session');
            await supabase.auth.signOut();
            set({ 
              session: null, 
              user: null,
              loading: false,
              error: null
            });
            return;
          }
          
          // Log non-critical session errors but don't block initialization
          console.warn('Session error during initialization:', errorResult.userMessage);
        }
        
        console.log('Initial session check:', initialSession ? 'Session found' : 'No session');
        
        set({ 
          session: initialSession, 
          user: initialSession?.user ?? null,
          loading: false,
          error: null
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
              loading: false,
              error: null
            });

            // Load profile data when user signs in
            if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
              // Use a small delay to ensure database is ready
              setTimeout(() => {
                useProfileStore.getState().loadProfile(newSession.user.id);
              }, 100);
              
              // Set user-specific onboarding flag if global onboarding was completed
              if (event === 'SIGNED_IN') {
                try {
                  const globalOnboarding = await AsyncStorage.getItem('hasSeenOnboarding_global');
                  if (globalOnboarding === 'true') {
                    const userOnboardingKey = `hasSeenOnboarding_${newSession.user.id}`;
                    await AsyncStorage.setItem(userOnboardingKey, 'true');
                  }
                } catch (error) {
                  const errorResult = handleError(error);
                  console.error('Error setting user onboarding flag:', errorResult.userMessage);
                }
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
                    const errorResult = handleError(error);
                    console.error('Error refreshing token:', errorResult.userMessage);
                    
                    // If should sign out based on error type, sign out the user
                    if (ErrorHandler.shouldSignOut(error)) {
                      console.log('Critical auth error during auto-refresh, signing out');
                      await get().signOut();
                    }
                  } else {
                    console.log('Token refreshed automatically');
                  }
                }
              } catch (error) {
                const errorResult = handleError(error);
                console.error('Error in token refresh interval:', errorResult.userMessage);
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
        const errorResult = handleError(error);
        console.error('Error initializing auth:', errorResult.userMessage);
        set({ 
          loading: false,
          error: errorResult.isNetworkError ? errorResult.userMessage : null
        });
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
          loading: false,
          error: null
        });
        
        isInitialized = false;
      } catch (error) {
        const errorResult = handleError(error);
        console.error('Error signing out:', errorResult.userMessage);
        
        // Even if sign out fails, clear the local state
        set({ 
          session: null, 
          user: null, 
          loading: false,
          error: null
        });
      }
    },

    refreshSession: async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          const errorResult = handleError(error);
          console.error('Error refreshing session:', errorResult.userMessage);
          
          // If should sign out based on error type, sign out the user
          if (ErrorHandler.shouldSignOut(error)) {
            console.log('Critical auth error in refreshSession, signing out');
            await get().signOut();
          }
          
          throw errorResult;
        }
      } catch (error) {
        const errorResult = handleError(error);
        console.error('Error refreshing session:', errorResult.userMessage);
        throw errorResult;
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
            loading: false,
            error: null
          });

          // Load profile data
          useProfileStore.getState().loadProfile(currentSession.user.id);
        } else {
          console.log('Force update: No session found');
          set({ 
            session: null, 
            user: null,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        const errorResult = handleError(error);
        console.error('Error forcing session update:', errorResult.userMessage);
        set({ 
          loading: false,
          error: errorResult.isNetworkError ? errorResult.userMessage : null
        });
      }
    },

    clearError: () => {
      set({ error: null });
    },
  };
}); 