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

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,

  initializeAuth: async () => {
    try {
      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      set({ 
        session: initialSession, 
        user: initialSession?.user ?? null,
        loading: false 
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          console.log('Auth state changed:', event, newSession?.user?.email);
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

      // Set up automatic token refresh
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

      // Store the cleanup function for later use
      (get() as any).cleanupAuth = () => {
        subscription.unsubscribe();
        clearInterval(refreshInterval);
      };
    } catch (error) {
      console.error('Error getting initial session:', error);
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      // Cleanup will be handled by the auth state change listener
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
})); 