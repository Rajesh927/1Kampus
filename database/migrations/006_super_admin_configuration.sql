-- ============================================================================
-- CAMPUSCONNECT: 006_SUPER_ADMIN_CONFIGURATION.SQL
-- Designated Initial Super Admin Account Provisioning & Role Protection
-- ============================================================================

-- 1. PRE-CHECK: Inspect existing administrator accounts
DO $$
DECLARE
    admin_count INTEGER;
    existing_admin RECORD;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    RAISE NOTICE 'Current administrator accounts found: %', admin_count;

    FOR existing_admin IN 
        SELECT id, email, full_name FROM public.profiles WHERE role = 'admin'
    LOOP
        RAISE NOTICE 'Existing Administrator: ID %, Email %, Name %', 
            existing_admin.id, existing_admin.email, existing_admin.full_name;
    END LOOP;
END $$;

-- 2. SAFELY PROVISION OR UPDATE THE DESIGNATED INITIAL SUPER ADMIN PROFILE
-- Display name: SRMIST
-- Login email: admin@srmist.edu.in
-- Role: admin (Super Admin)
DO $$
DECLARE
    target_auth_id UUID;
    existing_srmist_profile RECORD;
BEGIN
    -- Check if admin@srmist.edu.in already exists in auth.users (if Supabase Auth is present)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        SELECT id INTO target_auth_id FROM auth.users WHERE LOWER(email) = 'admin@srmist.edu.in' LIMIT 1;
    END IF;

    -- If no Supabase Auth user exists yet, use standard deterministic initial UUID
    IF target_auth_id IS NULL THEN
        target_auth_id := '00000000-0000-0000-0000-000000000001'::uuid;
    END IF;

    -- If a legacy placeholder admin (admin@campusconnect.edu) exists at target_auth_id, update it safely
    UPDATE public.profiles
    SET full_name = 'SRMIST',
        email = 'admin@srmist.edu.in',
        role = 'admin',
        registration_number = COALESCE(registration_number, 'ADM-SRMIST-001'),
        section = COALESCE(section, 'Administration'),
        updated_at = NOW()
    WHERE id = target_auth_id OR LOWER(email) = 'admin@campusconnect.edu';

    -- If no profile exists for admin@srmist.edu.in, insert it
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(email) = 'admin@srmist.edu.in') THEN
        INSERT INTO public.profiles (
            id,
            full_name,
            email,
            role,
            registration_number,
            section,
            avatar_url,
            created_at,
            updated_at
        ) VALUES (
            target_auth_id,
            'SRMIST',
            'admin@srmist.edu.in',
            'admin',
            'ADM-SRMIST-001',
            'Administration',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = 'SRMIST',
            email = 'admin@srmist.edu.in',
            role = 'admin',
            updated_at = NOW();
    END IF;

    RAISE NOTICE 'Super Admin successfully configured: SRMIST (admin@srmist.edu.in)';
END $$;

-- 3. ENSURE STRICT ROLE INTEGRITY VIA DATABASE POLICIES
-- Verify that standard users cannot elevate themselves to admin or assign admin role
DROP POLICY IF EXISTS "Prevent unauthorized admin role assignment" ON public.profiles;

-- Create constraint trigger or rule if needed to enforce that only verified admins can modify roles
CREATE OR REPLACE FUNCTION public.check_admin_role_elevation()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is being changed to 'admin'
    IF NEW.role = 'admin' AND (OLD.role IS NULL OR OLD.role <> 'admin') THEN
        -- Must be executed by an existing admin or service role
        IF current_user <> 'service_role' AND current_user <> 'postgres' THEN
            IF auth.uid() IS NULL OR NOT EXISTS (
                SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
            ) THEN
                RAISE EXCEPTION 'UNAUTHORIZED_ROLE_ELEVATION: Only an authorized administrator can assign the admin role.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_admin_role_elevation ON public.profiles;
CREATE TRIGGER trigger_check_admin_role_elevation
BEFORE UPDATE OF role OR INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_admin_role_elevation();
