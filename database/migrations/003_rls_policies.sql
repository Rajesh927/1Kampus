-- ============================================================================
-- CAMPUSCONNECT: 003_RLS_POLICIES.SQL
-- Row Level Security (RLS) policies for Supabase PostgreSQL
-- ============================================================================

-- Enable RLS on all core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
-- Everyone can read basic public profile info
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated, anon
USING (true);

-- Users can update only their own profile, but cannot elevate role
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND 
    -- Role cannot be modified directly by standard user update
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- ----------------------------------------------------------------------------
-- EVENTS POLICIES
-- ----------------------------------------------------------------------------
-- Published events are readable by anyone (public & anonymous)
CREATE POLICY "Published events are viewable by everyone"
ON public.events FOR SELECT
USING (status = 'published' OR auth.uid() = organizer_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Organizers and Admins can create events
CREATE POLICY "Organizers and admins can insert events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'organizer' OR role = 'admin')
    ) AND organizer_id = auth.uid()
);

-- Organizers can update only their own events; Admins can update any event
CREATE POLICY "Organizers can update own events and admins can update all"
ON public.events FOR UPDATE
TO authenticated
USING (
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ----------------------------------------------------------------------------
-- REGISTRATIONS POLICIES
-- ----------------------------------------------------------------------------
-- Students can view only their own registrations; Organizers can view registrations for their events
CREATE POLICY "Users can view own registrations or organizers can view their events"
ON public.registrations FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = registrations.event_id AND (events.organizer_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ))
    )
);

-- Users can cancel only their own registrations
CREATE POLICY "Users can update (cancel) own registrations"
ON public.registrations FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.events WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid()
));
