import { Router, Request, Response } from 'express';
import { db } from '../services/store.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateRequest, AttendanceUpdateSchema } from '../middleware/validation.js';

const router = Router();

// POST /api/v1/events/:id/register - Concurrency-safe atomic student registration
router.post('/events/:id/register', requireAuth, async (req: Request, res: Response) => {
  const eventId = req.params.id as string;
  const userId = req.user!.id;

  try {
    const result = await db.registerForEventAtomic(eventId, userId);

    res.status(201).json({
      success: true,
      data: result.registration,
      message: 'Successfully registered for event! Your ticket code has been generated.',
      meta: {
        remaining_capacity: result.remaining_capacity,
      },
    });
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('DUPLICATE_REGISTRATION')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_REGISTRATION',
          message: 'You already hold an active confirmed registration for this event.',
        },
      });
      return;
    }

    if (msg.includes('CAPACITY_EXCEEDED')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EVENT_FULL',
          message: 'Sorry, this event has reached maximum capacity.',
        },
      });
      return;
    }

    if (msg.includes('DEADLINE_PASSED')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DEADLINE_PASSED',
          message: 'The registration deadline for this event has passed.',
        },
      });
      return;
    }

    if (msg.includes('EVENT_CANCELLED')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EVENT_CANCELLED',
          message: 'Registrations are closed because this event has been cancelled.',
        },
      });
      return;
    }

    if (msg.includes('EVENT_NOT_ACTIVE')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EVENT_NOT_ACTIVE',
          message: 'Registration is not open for this event.',
        },
      });
      return;
    }

    if (msg.includes('EVENT_NOT_FOUND')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'The requested event does not exist.',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: msg || 'An error occurred during registration.',
      },
    });
  }
});

// DELETE /api/v1/registrations/:id - Cancel a registration
router.delete('/registrations/:id', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;

  try {
    const cancelled = await db.cancelRegistration(id, userId);

    if (!cancelled) {
      res.status(404).json({
        success: false,
        error: { code: 'REGISTRATION_NOT_FOUND', message: 'Registration not found.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: cancelled,
      message: 'Registration successfully cancelled. The seat has been made available to others.',
    });
  } catch (err: any) {
    if (err.message?.includes('UNAUTHORIZED_CANCELLATION')) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: "You are not authorized to cancel another user's registration." },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'CANCELLATION_ERROR', message: err.message },
    });
  }
});

// GET /api/v1/me/registrations - Get current student's registered events
router.get('/me/registrations', requireAuth, async (req: Request, res: Response) => {
  const registrations = await db.getUserRegistrations(req.user!.id);
  res.status(200).json({
    success: true,
    data: registrations,
  });
});

// GET /api/v1/events/:id/registrations - Get event attendees (Organizer or Admin)
router.get('/events/:id/registrations', requireAuth, requireRole(['organizer', 'admin']), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const event = await db.getEventById(id);

  if (!event) {
    res.status(404).json({
      success: false,
      error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' },
    });
    return;
  }

  if (req.user!.role !== 'admin' && event.organizer_id !== req.user!.id) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only view attendee rosters for events you organize.' },
    });
    return;
  }

  const registrations = await db.getEventRegistrations(id);
  res.status(200).json({
    success: true,
    data: {
      event,
      registrations,
      total_registered: registrations.filter(r => r.registration_status === 'confirmed').length,
      capacity: event.capacity,
    },
  });
});

// PATCH /api/v1/registrations/:id/attendance - Mark attendance check-in (Organizer or Admin)
router.patch(
  '/registrations/:id/attendance',
  requireAuth,
  requireRole(['organizer', 'admin']),
  validateRequest({ body: AttendanceUpdateSchema }),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { attendance_status } = req.body;

    const updated = await db.markAttendance(id, attendance_status);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: 'REGISTRATION_NOT_FOUND', message: 'Registration record not found.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updated,
      message: `Attendance marked as ${attendance_status}.`,
    });
  }
);

// POST /api/v1/registrations/verify-ticket - Check-in ticket QR verification
router.post('/registrations/verify-ticket', requireAuth, requireRole(['organizer', 'admin']), async (req: Request, res: Response) => {
  const { ticket_code } = req.body;

  if (!ticket_code) {
    res.status(400).json({
      success: false,
      error: { code: 'TICKET_CODE_REQUIRED', message: 'Ticket code is required.' },
    });
    return;
  }

  const result = await db.verifyTicket(ticket_code);

  if (!result.valid) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_TICKET', message: result.error || 'Invalid ticket code.' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: result.registration,
    message: 'Ticket verified successfully.',
  });
});

export default router;
