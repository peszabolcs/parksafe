-- ParkSafe Feedback System Setup
-- This table stores user feedback, bug reports, feature requests, and improvement suggestions

-- Create feedback table
CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "type" text NOT NULL CHECK (type IN ('bug', 'feature', 'general', 'improvement')),
    "category" text NOT NULL CHECK (category IN ('ui_ux', 'performance', 'feature', 'bug', 'content', 'other')),
    "title" text NOT NULL,
    "description" text NOT NULL,
    "priority" text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    "status" text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'duplicate')),
    "contact_email" text,
    "admin_notes" text,
    "resolved_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feedback_title_length" CHECK (length(title) >= 5 AND length(title) <= 100),
    CONSTRAINT "feedback_description_length" CHECK (length(description) >= 10 AND length(description) <= 2000),
    CONSTRAINT "feedback_email_format" CHECK (contact_email IS NULL OR contact_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS "feedback_user_id_idx" ON "public"."feedback" ("user_id");
CREATE INDEX IF NOT EXISTS "feedback_type_idx" ON "public"."feedback" ("type");
CREATE INDEX IF NOT EXISTS "feedback_category_idx" ON "public"."feedback" ("category");
CREATE INDEX IF NOT EXISTS "feedback_status_idx" ON "public"."feedback" ("status");
CREATE INDEX IF NOT EXISTS "feedback_priority_idx" ON "public"."feedback" ("priority");
CREATE INDEX IF NOT EXISTS "feedback_created_at_idx" ON "public"."feedback" ("created_at" DESC);

-- Enable Row Level Security (RLS) for feedback table
ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback table
-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON "public"."feedback"
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON "public"."feedback"
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Admin users can view all feedback (this would require admin role implementation)
-- For now, we'll allow authenticated users to view all feedback for transparency
CREATE POLICY "Authenticated users can view all feedback" ON "public"."feedback"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only the feedback owner can update their own feedback (limited to certain fields)
CREATE POLICY "Users can update their own feedback" ON "public"."feedback"
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp trigger for feedback
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON "public"."feedback" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get feedback statistics
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS TABLE(
    total_feedback integer,
    open_feedback integer,
    resolved_feedback integer,
    by_type json,
    by_category json,
    by_priority json
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'open') as open_count,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count
        FROM public.feedback
    ),
    type_stats AS (
        SELECT json_object_agg(type, count) as types
        FROM (
            SELECT type, COUNT(*) as count
            FROM public.feedback
            GROUP BY type
        ) t
    ),
    category_stats AS (
        SELECT json_object_agg(category, count) as categories
        FROM (
            SELECT category, COUNT(*) as count
            FROM public.feedback
            GROUP BY category
        ) c
    ),
    priority_stats AS (
        SELECT json_object_agg(priority, count) as priorities
        FROM (
            SELECT priority, COUNT(*) as count
            FROM public.feedback
            GROUP BY priority
        ) p
    )
    SELECT 
        stats.total::integer,
        stats.open_count::integer,
        stats.resolved_count::integer,
        COALESCE(type_stats.types, '{}'::json),
        COALESCE(category_stats.categories, '{}'::json),
        COALESCE(priority_stats.priorities, '{}'::json)
    FROM stats, type_stats, category_stats, priority_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit feedback (with validation)
CREATE OR REPLACE FUNCTION submit_feedback(
    feedback_type text,
    feedback_category text,
    feedback_title text,
    feedback_description text,
    feedback_priority text DEFAULT 'medium',
    contact_email text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    new_feedback_id uuid;
    result json;
BEGIN
    -- Validate input parameters
    IF feedback_type NOT IN ('bug', 'feature', 'general', 'improvement') THEN
        RETURN json_build_object('error', 'Invalid feedback type');
    END IF;
    
    IF feedback_category NOT IN ('ui_ux', 'performance', 'feature', 'bug', 'content', 'other') THEN
        RETURN json_build_object('error', 'Invalid feedback category');
    END IF;
    
    IF feedback_priority NOT IN ('low', 'medium', 'high') THEN
        RETURN json_build_object('error', 'Invalid priority level');
    END IF;
    
    IF length(feedback_title) < 5 OR length(feedback_title) > 100 THEN
        RETURN json_build_object('error', 'Title must be between 5 and 100 characters');
    END IF;
    
    IF length(feedback_description) < 10 OR length(feedback_description) > 2000 THEN
        RETURN json_build_object('error', 'Description must be between 10 and 2000 characters');
    END IF;
    
    IF contact_email IS NOT NULL AND contact_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN json_build_object('error', 'Invalid email format');
    END IF;

    -- Insert the feedback
    INSERT INTO public.feedback (
        user_id,
        type,
        category,
        title,
        description,
        priority,
        contact_email,
        status,
        created_at
    ) VALUES (
        auth.uid(),
        feedback_type,
        feedback_category,
        feedback_title,
        feedback_description,
        feedback_priority,
        contact_email,
        'open',
        now()
    ) RETURNING id INTO new_feedback_id;

    -- Return success response
    SELECT json_build_object(
        'success', true,
        'feedback_id', new_feedback_id,
        'message', 'Feedback submitted successfully'
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's feedback history
CREATE OR REPLACE FUNCTION get_user_feedback_history(user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
    id uuid,
    type text,
    category text,
    title text,
    description text,
    priority text,
    status text,
    created_at timestamptz,
    updated_at timestamptz,
    resolved_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.type,
        f.category,
        f.title,
        f.description,
        f.priority,
        f.status,
        f.created_at,
        f.updated_at,
        f.resolved_at
    FROM public.feedback f
    WHERE f.user_id = user_id
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admins to update feedback status (requires admin role)
CREATE OR REPLACE FUNCTION admin_update_feedback_status(
    feedback_id uuid,
    new_status text,
    admin_note text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    -- Check if user is admin (this would need to be implemented based on your auth system)
    -- For now, we'll allow any authenticated user to update status
    IF auth.uid() IS NULL THEN
        RETURN json_build_object('error', 'Unauthorized - authentication required');
    END IF;
    
    -- Validate status
    IF new_status NOT IN ('open', 'in_progress', 'resolved', 'closed', 'duplicate') THEN
        RETURN json_build_object('error', 'Invalid status');
    END IF;

    -- Update feedback
    UPDATE public.feedback 
    SET 
        status = new_status,
        admin_notes = COALESCE(admin_note, admin_notes),
        resolved_at = CASE WHEN new_status = 'resolved' THEN now() ELSE resolved_at END,
        updated_at = now()
    WHERE id = feedback_id;

    -- Check if update was successful
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Feedback not found');
    END IF;

    RETURN json_build_object('success', true, 'message', 'Feedback status updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for public feedback summary (for transparency)
CREATE OR REPLACE VIEW public_feedback_summary AS
SELECT 
    type,
    category,
    title,
    priority,
    status,
    created_at::date as submitted_date,
    CASE 
        WHEN resolved_at IS NOT NULL THEN resolved_at::date
        ELSE NULL 
    END as resolved_date
FROM public.feedback
WHERE status != 'duplicate'
ORDER BY created_at DESC;

-- Grant appropriate permissions
GRANT SELECT ON public_feedback_summary TO authenticated;
GRANT SELECT ON public_feedback_summary TO anon;