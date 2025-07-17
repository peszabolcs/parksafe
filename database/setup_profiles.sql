-- ParkSafe Profile Management Setup
-- This extends the default Supabase auth.users table with additional profile information

-- Create profiles table that extends auth.users
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "username" text UNIQUE,
    "full_name" text,
    "avatar_url" text,
    "phone" text,
    "bio" text,
    "website" text,
    "location" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profiles_username_check" CHECK (length(username) >= 3)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS "profiles_username_idx" ON "public"."profiles" ("username");

-- Enable Row Level Security (RLS) for profiles table
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
-- Users can view all profiles (for public profile pages)
CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles"
    FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON "public"."profiles"
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON "public"."profiles"
    FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile" ON "public"."profiles"
    FOR DELETE USING (auth.uid() = id);

-- Auto-update timestamp trigger for profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON "public"."profiles" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user profile with additional info
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS TABLE(
    id uuid,
    email text,
    username text,
    full_name text,
    avatar_url text,
    phone text,
    bio text,
    website text,
    location text,
    created_at timestamptz,
    updated_at timestamptz,
    email_confirmed_at timestamptz,
    last_sign_in_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        u.email,
        p.username,
        p.full_name,
        p.avatar_url,
        p.phone,
        p.bio,
        p.website,
        p.location,
        p.created_at,
        p.updated_at,
        u.email_confirmed_at,
        u.last_sign_in_at
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
    user_id uuid,
    new_username text DEFAULT NULL,
    new_full_name text DEFAULT NULL,
    new_avatar_url text DEFAULT NULL,
    new_phone text DEFAULT NULL,
    new_bio text DEFAULT NULL,
    new_website text DEFAULT NULL,
    new_location text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    -- Check if user exists and has permission
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND id = auth.uid()) THEN
        RETURN json_build_object('error', 'Unauthorized or user not found');
    END IF;

    -- Update profile with only non-null values
    UPDATE public.profiles 
    SET 
        username = COALESCE(new_username, username),
        full_name = COALESCE(new_full_name, full_name),
        avatar_url = COALESCE(new_avatar_url, avatar_url),
        phone = COALESCE(new_phone, phone),
        bio = COALESCE(new_bio, bio),
        website = COALESCE(new_website, website),
        location = COALESCE(new_location, location),
        updated_at = now()
    WHERE id = user_id;

    -- Return updated profile
    SELECT json_build_object(
        'id', p.id,
        'username', p.username,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'phone', p.phone,
        'bio', p.bio,
        'website', p.website,
        'location', p.location,
        'updated_at', p.updated_at
    ) INTO result
    FROM public.profiles p
    WHERE p.id = user_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check username availability
CREATE OR REPLACE FUNCTION is_username_available(check_username text)
RETURNS boolean AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE username = check_username
    );
END;
$$ LANGUAGE plpgsql;

-- Function to delete user profile and account
CREATE OR REPLACE FUNCTION delete_user_account(user_id uuid)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    -- Check if user exists and has permission
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id AND id = auth.uid()) THEN
        RETURN json_build_object('error', 'Unauthorized or user not found');
    END IF;

    -- Delete profile (will cascade to delete auth.users due to foreign key)
    DELETE FROM public.profiles WHERE id = user_id;
    
    -- Delete from auth.users (this will trigger cascade delete)
    DELETE FROM auth.users WHERE id = user_id;

    RETURN json_build_object('success', true, 'message', 'Account deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage policies for avatar uploads
-- Note: These policies need to be created in Supabase Dashboard -> Storage -> avatars bucket

-- Example Storage Policy SQL (to be run in Supabase Dashboard):
/*
-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Avatar images are publicly accessible
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
*/