-- ============================================================================
-- 1KAMPUS: 008_ORGANIZER_APPLICATIONS.SQL
-- Organizer Application Workflow, Status Tracking & Role Approval RBAC
-- ============================================================================

-- 1. Extend profiles table with organizer approval status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN approval_status TEXT DEFAULT 'none' CHECK (approval_status IN ('none', 'pending', 'approved', 'rejected', 'suspended'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'club_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN club_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'position'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN position TEXT;
    END IF;
END $$;

-- 2. Create organizer_applications table
CREATE TABLE IF NOT EXISTS public.organizer_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    club_name TEXT NOT NULL,
    position TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for fast lookup & status filtering
CREATE INDEX IF NOT EXISTS idx_organizer_apps_user ON public.organizer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_organizer_apps_status ON public.organizer_applications(status);
CREATE INDEX IF NOT EXISTS idx_organizer_apps_email ON public.organizer_applications(LOWER(TRIM(email)));

-- 3. Row Level Security Policies
ALTER TABLE public.organizer_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view their own application
DROP POLICY IF EXISTS "Applicants can view own organizer application" ON public.organizer_applications;
CREATE POLICY "Applicants can view own organizer application"
    ON public.organizer_applications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Anyone authenticated can submit an application
DROP POLICY IF EXISTS "Users can submit organizer application" ON public.organizer_applications;
CREATE POLICY "Users can submit organizer application"
    ON public.organizer_applications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Super Admin can view all and update
DROP POLICY IF EXISTS "Super Admin can view and review all organizer applications" ON public.organizer_applications;
CREATE POLICY "Super Admin can view and review all organizer applications"
    ON public.organizer_applications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin' AND email = 'admin@srmist.edu.in'
        )
    );
