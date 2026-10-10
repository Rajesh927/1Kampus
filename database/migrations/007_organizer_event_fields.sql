-- ============================================================================
-- CAMPUSCONNECT: 007_ORGANIZER_EVENT_FIELDS.SQL
-- Migration for comprehensive event fields & centralized organization registry
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CENTRAL APPROVED ORGANIZATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approved_organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('institution', 'department', 'club', 'other')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed approved organizations for SRMIST campus
INSERT INTO public.approved_organizations (id, name, category) VALUES
('srmist', 'SRMIST', 'institution'),
('acm-student-chapter', 'ACM Student Chapter', 'club'),
('dsa-coding-club', 'DSA/Coding Club', 'club'),
('dept-cse', 'CSE', 'department'),
('dept-aiml', 'AI & ML', 'department'),
('dept-it', 'IT', 'department'),
('dept-eee', 'EEE', 'department'),
('dept-ece', 'ECE', 'department'),
('dept-mech', 'Mechanical Engineering', 'department'),
('dept-civil', 'Civil Engineering', 'department'),
('club-robotics-iot', 'Robotics/IoT Club', 'club'),
('club-ecell', 'Entrepreneurship/E-Cell', 'club'),
('club-cultural', 'Cultural Club', 'club'),
('club-sports', 'Sports Club', 'club'),
('other-approved', 'Other Approved Organization', 'other')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    category = EXCLUDED.category,
    active = EXCLUDED.active;

-- ----------------------------------------------------------------------------
-- 2. EXTEND PUBLIC.EVENTS WITH STRUCTURED EVENT TYPE & ORGANIZATION COLUMNS
-- ----------------------------------------------------------------------------
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'workshop',
ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT 'SRMIST',
ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES public.approved_organizations(id) ON DELETE SET NULL DEFAULT 'srmist';

-- Populate existing rows where NULL
UPDATE public.events
SET event_type = CASE
    WHEN LOWER(category) = 'hackathons' THEN 'hackathon'
    WHEN LOWER(category) = 'workshops' THEN 'workshop'
    WHEN LOWER(category) = 'cultural' THEN 'cultural event'
    WHEN LOWER(category) = 'sports' THEN 'sports'
    ELSE 'workshop'
END
WHERE event_type IS NULL;

UPDATE public.events
SET organization = COALESCE(organizer_name, 'SRMIST'),
    organization_id = 'srmist'
WHERE organization IS NULL;

-- ----------------------------------------------------------------------------
-- 3. VALIDATE EVENT TYPE CONSTRAINT
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_event_type'
    ) THEN
        ALTER TABLE public.events
        ADD CONSTRAINT valid_event_type CHECK (
            event_type IN (
                'hackathon',
                'workshop',
                'competition',
                'seminar',
                'technical fest',
                'cultural event',
                'sports',
                'other'
            )
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. VALIDATE REGISTRATION DEADLINE CONSTRAINT (Must precede event start time)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- Drop old loose constraint if it only checked end_time
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_deadline'
    ) THEN
        ALTER TABLE public.events DROP CONSTRAINT valid_deadline;
    END IF;

    -- Add strict check: registration deadline precedes or equals start time
    ALTER TABLE public.events
    ADD CONSTRAINT valid_deadline CHECK (registration_deadline <= start_time);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping constraint recreation if already satisfied: %', SQLERRM;
END $$;

-- ----------------------------------------------------------------------------
-- 5. RLS POLICIES FOR APPROVED ORGANIZATIONS
-- ----------------------------------------------------------------------------
ALTER TABLE public.approved_organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active approved organizations" ON public.approved_organizations;
CREATE POLICY "Public can view active approved organizations"
ON public.approved_organizations FOR SELECT
TO authenticated, anon
USING (active = TRUE);

DROP POLICY IF EXISTS "Admins can manage approved organizations" ON public.approved_organizations;
CREATE POLICY "Admins can manage approved organizations"
ON public.approved_organizations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
