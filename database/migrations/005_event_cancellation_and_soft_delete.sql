-- ============================================================================
-- CAMPUSCONNECT: 005_EVENT_CANCELLATION_AND_SOFT_DELETE.SQL
-- Database Migration for Safe Event Cancellation, Soft-Deletion & RLS Security
-- ============================================================================

-- 1. ADD CANCELLATION AND SOFT-DELETE COLUMNS TO PUBLIC.EVENTS
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT DEFAULT NULL;

-- 2. CREATE INDEXES FOR FAST FILTERING
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON public.events(deleted_at);
CREATE INDEX IF NOT EXISTS idx_events_status_deleted ON public.events(status, deleted_at);

-- 3. IN-APP NOTIFICATIONS TABLE FOR ORGANIZERS AND STUDENTS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('event_cancelled', 'info', 'system', 'registration')),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update read status on their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. UPDATE RLS POLICIES ON PUBLIC.EVENTS
-- Drop old SELECT policy if exists to replace with soft-delete filter
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;

-- New SELECT policy: Public can only see non-deleted events.
-- Organizers can view their own non-deleted events.
-- Admins can view all events (including soft-deleted for audit).
CREATE POLICY "Public and organizers view non-deleted events; admins view all"
ON public.events FOR SELECT
USING (
    (
        deleted_at IS NULL AND (
            status = 'published' OR 
            status = 'cancelled' OR
            organizer_id = auth.uid()
        )
    ) OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Organizers can soft-delete or update only their own events; Admins can update any
DROP POLICY IF EXISTS "Organizers can update own events and admins can update all" ON public.events;

CREATE POLICY "Organizers update own events and admins update all"
ON public.events FOR UPDATE
TO authenticated
USING (
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. ATOMIC REGISTRATION CONSTRAINT FOR CANCELLED & DELETED EVENTS
-- Ensure registrations cannot be created for cancelled or deleted events
CREATE OR REPLACE FUNCTION public.check_event_registration_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    event_rec RECORD;
BEGIN
    SELECT status, deleted_at, capacity INTO event_rec
    FROM public.events
    WHERE id = NEW.event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EVENT_NOT_FOUND: The requested event does not exist.';
    END IF;

    IF event_rec.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'EVENT_DELETED: This event has been deleted and cannot accept registrations.';
    END IF;

    IF event_rec.status = 'cancelled' THEN
        RAISE EXCEPTION 'EVENT_CANCELLED: This event has been cancelled and cannot accept new registrations.';
    END IF;

    IF event_rec.status <> 'published' THEN
        RAISE EXCEPTION 'EVENT_NOT_ACTIVE: Only published events can accept registrations.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_event_registration_eligibility ON public.registrations;
CREATE TRIGGER trigger_check_event_registration_eligibility
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.check_event_registration_eligibility();
