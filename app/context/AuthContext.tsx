import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase"; // Ellenőrizd az elérési utat!
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from "react-native";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // Itt adhatsz hozzá további auth specifikus függvényeket, pl. signIn, signUp
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export default at the top level to ensure it's recognized by Expo Router
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let didCancel = false;
    setLoading(true);
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!didCancel) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        if (!didCancel) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    };
    getSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!didCancel) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );
    return () => {
      didCancel = true;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Fontos: Loading közben is rendereljünk valamit, de ne null-t
  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Betöltés...</Text>
    </View>
  );

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
