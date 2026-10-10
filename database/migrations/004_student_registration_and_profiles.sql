-- ============================================================================
-- CAMPUSCONNECT: 004_STUDENT_REGISTRATION_AND_PROFILES.SQL
-- Student Registration, Section Tracking, Uniqueness Constraints & RLS Security
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ALTER PROFILES TABLE SCHEMA (NON-DESTRUCTIVE)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- Add registration_number column if not present
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'registration_number'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN registration_number TEXT;
    END IF;

    -- Add section column if not present
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'section'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN section TEXT;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. SAFELY POPULATE PRE-EXISTING RECORDS BEFORE ENFORCING CONSTRAINTS
-- ----------------------------------------------------------------------------
-- Ensure existing profiles have non-null, unique registration numbers
UPDATE public.profiles
SET registration_number = 'REG-' || UPPER(SUBSTRING(id::text, 1, 8))
WHERE registration_number IS NULL OR TRIM(registration_number) = '';

UPDATE public.profiles
SET section = 'CSE-A'
WHERE section IS NULL OR TRIM(section) = '';

-- Apply NOT NULL constraints now that data is clean
ALTER TABLE public.profiles ALTER COLUMN registration_number SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN section SET NOT NULL;

-- ----------------------------------------------------------------------------
-- 3. UNIQUE INDEX ON REGISTRATION NUMBER (CASE-INSENSITIVE)
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_registration_number_unique 
ON public.profiles (LOWER(TRIM(registration_number)));

CREATE INDEX IF NOT EXISTS idx_profiles_section 
ON public.profiles (section);

-- ----------------------------------------------------------------------------
-- 4. FOREIGN KEY TO AUTH.USERS (IF RUNNING INSIDE SUPABASE ENVIRONMENT)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping auth.users FK creation: not in Supabase hosted auth context.';
END $$;

-- ----------------------------------------------------------------------------
-- 5. KEEP EMAIL SYNCHRONIZED WITH AUTH.USERS VIA TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_auth_user_email_sync()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conditionally bind trigger on auth.users if available
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        DROP TRIGGER IF EXISTS on_auth_user_updated_sync_email ON auth.users;
        CREATE TRIGGER on_auth_user_updated_sync_email
        AFTER UPDATE OF email ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_auth_user_email_sync();
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping on_auth_user_updated_sync_email trigger creation.';
END $$;

-- ----------------------------------------------------------------------------
-- 6. AUTOMATIC SECURE PROFILE CREATION ON SUPABASE AUTH SIGNUP
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_student_signup()
RETURNS TRIGGER AS $$
DECLARE
    raw_name TEXT;
    raw_reg TEXT;
    raw_sec TEXT;
BEGIN
    raw_name := TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student User'));
    raw_reg  := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'registration_number', 'REG-' || SUBSTRING(NEW.id::text, 1, 8))));
    raw_sec  := TRIM(COALESCE(NEW.raw_user_meta_data->>'section', 'General'));

    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        registration_number,
        section,
        role,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        raw_name,
        NEW.email,
        raw_reg,
        raw_sec,
        'student', -- Always lock down public signups to student role
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        registration_number = EXCLUDED.registration_number,
        section = EXCLUDED.section,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
        CREATE TRIGGER on_auth_user_created_profile
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_auth_student_signup();
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping on_auth_user_created_profile trigger creation.';
END $$;

-- ----------------------------------------------------------------------------
-- 7. REFINED ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
-- Ensure RLS is active
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop older broad read policy if present
DROP POLICY IF EXISTS "Public profiles are readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;

-- 1. Users can always read their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Administrators can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 3. Organizers can view profiles of students registered for events they host
CREATE POLICY "Organizers can view registered attendee student profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.registrations r
        JOIN public.events e ON e.id = r.event_id
        WHERE r.user_id = public.profiles.id
        AND e.organizer_id = auth.uid()
    )
);

-- 4. Students can update permitted fields on their own profile (cannot change role or ID)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Students can update own permitted profile fields"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Role cannot be changed by user
);

-- 5. Administrators can update permitted student profile fields
CREATE POLICY "Admins can update student profile details"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
