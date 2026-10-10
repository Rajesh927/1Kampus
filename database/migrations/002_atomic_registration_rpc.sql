-- ============================================================================
-- CAMPUSCONNECT: 002_ATOMIC_REGISTRATION_RPC.SQL
-- Concurrency-safe atomic registration with pessimistic locking & capacity check
-- ============================================================================

CREATE OR REPLACE FUNCTION public.register_for_event_atomic(
    p_event_id UUID,
    p_user_id UUID,
    p_ticket_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event RECORD;
    v_active_count INTEGER;
    v_existing_reg RECORD;
    v_new_reg RECORD;
BEGIN
    -- 1. Acquire pessimistic lock on the event row to serialize concurrent registration requests
    SELECT * INTO v_event
    FROM public.events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EVENT_NOT_FOUND: The requested event does not exist.';
    END IF;

    -- 2. Verify event status
    IF v_event.status <> 'published' THEN
        RAISE EXCEPTION 'EVENT_NOT_ACTIVE: Registrations are only allowed for published events. Current status: %', v_event.status;
    END IF;

    -- 3. Verify registration deadline
    IF v_event.registration_deadline < NOW() THEN
        RAISE EXCEPTION 'DEADLINE_PASSED: The registration deadline for this event has passed.';
    END IF;

    -- 4. Verify start time hasn't passed
    IF v_event.start_time < NOW() THEN
        RAISE EXCEPTION 'EVENT_ALREADY_STARTED: The event has already commenced.';
    END IF;

    -- 5. Check if the user already has an active confirmed registration
    SELECT * INTO v_existing_reg
    FROM public.registrations
    WHERE event_id = p_event_id
      AND user_id = p_user_id
      AND registration_status = 'confirmed'
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION 'DUPLICATE_REGISTRATION: You already hold an active confirmed registration for this event.';
    END IF;

    -- 6. Count current active registrations under lock
    SELECT COUNT(*) INTO v_active_count
    FROM public.registrations
    WHERE event_id = p_event_id
      AND registration_status = 'confirmed';

    -- 7. Verify capacity
    IF v_active_count >= v_event.capacity THEN
        RAISE EXCEPTION 'CAPACITY_EXCEEDED: This event is completely full (Capacity: %, Registered: %).', v_event.capacity, v_active_count;
    END IF;

    -- 8. Insert new registration record
    INSERT INTO public.registrations (
        user_id,
        event_id,
        registration_status,
        ticket_code,
        registered_at,
        attendance_status
    )
    VALUES (
        p_user_id,
        p_event_id,
        'confirmed',
        p_ticket_code,
        NOW(),
        'unmarked'
    )
    RETURNING * INTO v_new_reg;

    -- 9. Return structured JSON payload
    RETURN jsonb_build_object(
        'success', true,
        'registration_id', v_new_reg.id,
        'event_id', v_new_reg.event_id,
        'user_id', v_new_reg.user_id,
        'ticket_code', v_new_reg.ticket_code,
        'registration_status', v_new_reg.registration_status,
        'registered_at', v_new_reg.registered_at,
        'remaining_capacity', (v_event.capacity - (v_active_count + 1))
    );
END;
$$;
