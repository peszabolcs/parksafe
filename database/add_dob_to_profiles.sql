-- Add date of birth column to profiles table
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "dob" date;

-- Drop and recreate the update_user_profile function to include dob
DROP FUNCTION IF EXISTS update_user_profile(uuid, text, text, text, text, text, text, text);
CREATE FUNCTION update_user_profile(
    user_id uuid,
    new_username text DEFAULT NULL,
    new_full_name text DEFAULT NULL,
    new_avatar_url text DEFAULT NULL,
    new_phone text DEFAULT NULL,
    new_bio text DEFAULT NULL,
    new_website text DEFAULT NULL,
    new_location text DEFAULT NULL,
    new_dob date DEFAULT NULL
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
        dob = COALESCE(new_dob, dob),
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
        'dob', p.dob,
        'updated_at', p.updated_at
    ) INTO result
    FROM public.profiles p
    WHERE p.id = user_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the get_user_profile function to include dob
DROP FUNCTION IF EXISTS get_user_profile(uuid);
CREATE FUNCTION get_user_profile(user_id uuid)
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
    dob date,
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
        p.dob,
        p.created_at,
        p.updated_at,
        u.email_confirmed_at,
        u.last_sign_in_at
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;