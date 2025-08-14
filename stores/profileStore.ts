import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/errorHandler';

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  dob: string | null;
  created_at: string;
  updated_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  uploadAvatar: (uri: string) => Promise<string | null>;
  deleteAvatar: () => Promise<boolean>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  updateEmail: (newEmail: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  clearProfile: () => void;
  
  // Optimized for Google auth
  upsertGoogleProfile: (userId: string, googleData: any) => Promise<boolean>;
  checkProfileCompleteness: (userId: string) => Promise<{ complete: boolean; missing: string[] }>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  loadProfile: async (userId: string) => {
    set({ loading: true, error: null });
    
    try {
      // First check if profile exists, if not create it
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking profile existence:', checkError);
        set({ error: checkError.message, loading: false });
        return;
      }

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const fullName = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || null;
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              username: fullName, // Set username same as full_name
              full_name: fullName,
              avatar_url: userData.user.user_metadata?.avatar_url || userData.user.user_metadata?.picture || null,
            });
          
          if (insertError) {
            console.error('Error creating profile:', insertError);
            set({ error: insertError.message, loading: false });
            return;
          }
        }
      }

      // Now get the profile with user data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        set({ error: profileError.message, loading: false });
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error loading user data:', userError);
        set({ error: userError.message, loading: false });
        return;
      }

      if (profileData && userData.user) {
        const fullProfile: UserProfile = {
          id: profileData.id,
          email: userData.user.email || '',
          username: profileData.username,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          phone: profileData.phone,
          location: profileData.location,
          dob: profileData.dob,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
          email_confirmed_at: userData.user.email_confirmed_at || null,
          last_sign_in_at: userData.user.last_sign_in_at || null,
        };
        set({ profile: fullProfile, loading: false });
      } else {
        set({ error: 'Profil nem található', loading: false });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      set({ error: 'Hiba történt a profil betöltése közben', loading: false });
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { profile } = get();
    if (!profile) return false;

    set({ loading: true, error: null });

    try {
      // Update profile directly without using RPC to avoid bio column issue  
      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
          phone: updates.phone,
          location: updates.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        set({ error: error.message, loading: false });
        return false;
      }

      if (data) {
        // Update local state with new data
        set({ 
          profile: { ...profile, ...data },
          loading: false 
        });
        return true;
      } else {
        set({ error: 'Ismeretlen hiba', loading: false });
        return false;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      set({ error: 'Hiba történt a profil frissítése közben', loading: false });
      return false;
    }
  },

  uploadAvatar: async (uri: string) => {
    const { profile } = get();
    if (!profile) return null;

    set({ loading: true, error: null });

    try {
      // Get file extension
      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${profile.id}/avatar.${fileExtension}`;

      console.log('Uploading file:', fileName, 'from URI:', uri);

      // Create FormData for React Native file upload
      const formData = new FormData();
      
      // React Native specific file object
      const fileObject = {
        uri: uri,
        type: `image/${fileExtension}`,
        name: `avatar.${fileExtension}`
      };

      formData.append('file', fileObject as any);

      // Upload to Supabase Storage using fetch directly
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      
      const uploadResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/avatars/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-upsert': 'true',
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      console.log('Upload successful');

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = publicData.publicUrl;

      // Update profile with new avatar URL
      await get().updateProfile({ avatar_url: avatarUrl });

      set({ loading: false });
      return avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      set({ error: 'Hiba történt a kép feltöltése közben', loading: false });
      return null;
    }
  },

  deleteAvatar: async () => {
    const { profile } = get();
    if (!profile || !profile.avatar_url) return false;

    set({ loading: true, error: null });

    try {
      // Extract filename from URL
      const urlParts = profile.avatar_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${profile.id}/${fileName}`;

      // Delete from storage
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting avatar:', error);
        set({ error: error.message, loading: false });
        return false;
      }

      // Update profile to remove avatar URL
      await get().updateProfile({ avatar_url: null });

      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Error deleting avatar:', error);
      set({ error: 'Hiba történt a kép törlése közben', loading: false });
      return false;
    }
  },

  checkUsernameAvailability: async (username: string) => {
    try {
      const { data, error } = await supabase
        .rpc('is_username_available', { check_username: username });

      if (error) {
        console.error('Error checking username:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  },

  updateEmail: async (newEmail: string) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) {
        console.error('Error updating email:', error);
        set({ error: error.message, loading: false });
        return false;
      }

      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Error updating email:', error);
      set({ error: 'Hiba történt az email frissítése közben', loading: false });
      return false;
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.error('Error updating password:', error);
        set({ error: error.message, loading: false });
        return false;
      }

      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      set({ error: 'Hiba történt a jelszó frissítése közben', loading: false });
      return false;
    }
  },

  deleteAccount: async () => {
    const { profile } = get();
    if (!profile) return false;

    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .rpc('delete_user_account', { user_id: profile.id });

      if (error) {
        console.error('Error deleting account:', error);
        set({ error: error.message, loading: false });
        return false;
      }

      if (data && data.error) {
        set({ error: data.error, loading: false });
        return false;
      }

      // Clear local state
      set({ profile: null, loading: false });
      
      // Force sign out from Supabase auth after successful account deletion
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error signing out after account deletion:', signOutError);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      set({ error: 'Hiba történt a fiók törlése közben', loading: false });
      return false;
    }
  },

  clearProfile: () => {
    set({ profile: null, loading: false, error: null });
  },

  upsertGoogleProfile: async (userId: string, googleData: any) => {
    set({ loading: true, error: null });
    
    try {
      const profileUpdate = {
        username: googleData.name, // Set username same as full_name
        full_name: googleData.name,
        avatar_url: googleData.picture,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profileUpdate
        });

      if (error) {
        console.error('Error upserting Google profile:', error);
        set({ error: error.message, loading: false });
        return false;
      }

      // Reload the profile to get complete data
      await get().loadProfile(userId);
      return true;
    } catch (error) {
      console.error('Error upserting Google profile:', error);
      set({ error: 'Hiba történt a profil mentése közben', loading: false });
      return false;
    }
  },

  checkProfileCompleteness: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, phone, dob')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking profile completeness:', error);
        return { complete: false, missing: ['username', 'phone'] };
      }

      const missing: string[] = [];
      if (!data.username) missing.push('username');
      if (!data.phone) missing.push('phone');
      // DOB is optional for now
      
      return {
        complete: missing.length === 0,
        missing
      };
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      return { complete: false, missing: ['username', 'phone'] };
    }
  },
}));