import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
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
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  loadProfile: async (userId: string) => {
    set({ loading: true, error: null });
    
    try {
      // First check if profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase
            .from('profiles')
            .insert({
              id: userId,
              username: userData.user.user_metadata?.username || null,
              full_name: userData.user.user_metadata?.full_name || null,
              avatar_url: userData.user.user_metadata?.avatar_url || null,
            });
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
          bio: profileData.bio,
          website: profileData.website,
          location: profileData.location,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
          email_confirmed_at: userData.user.email_confirmed_at,
          last_sign_in_at: userData.user.last_sign_in_at,
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
      const { data, error } = await supabase
        .rpc('update_user_profile', {
          user_id: profile.id,
          new_username: updates.username || null,
          new_full_name: updates.full_name || null,
          new_avatar_url: updates.avatar_url || null,
          new_phone: updates.phone || null,
          new_bio: null,
          new_website: null,
          new_location: updates.location || null
        });

      if (error) {
        console.error('Error updating profile:', error);
        set({ error: error.message, loading: false });
        return false;
      }

      if (data && !data.error) {
        // Update local state with new data
        set({ 
          profile: { ...profile, ...data, updated_at: new Date().toISOString() },
          loading: false 
        });
        return true;
      } else {
        set({ error: data?.error || 'Ismeretlen hiba', loading: false });
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
      const data = { path: fileName };

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
}));