import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

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

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
      }
      return { data, error };
    } catch (error) {
      console.error('Error refreshing session:', error);
      return { data: null, error };
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    signOut,
    refreshSession: async () => {
      const result = await refreshSession();
      if (result.error) {
        throw result.error;
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 