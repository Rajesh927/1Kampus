import { Router, Request, Response } from 'express';
import { db } from '../services/store.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { validateRequest, EventCreateSchema, EventUpdateSchema } from '../middleware/validation.js';
import { APPROVED_ORGANIZATIONS, EVENT_TYPES } from '../config/organizations.js';

const router = Router();

// GET /api/v1/events/meta/organizations - Retrieve centrally managed approved organizations
router.get('/events/meta/organizations', async (_req: Request, res: Response) => {
  const orgs = await db.getApprovedOrganizations();
  res.status(200).json({
    success: true,
    data: orgs,
  });
});

// GET /api/v1/events/meta/types - Retrieve supported event types
router.get('/events/meta/types', async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: EVENT_TYPES,
  });
});

// GET /api/v1/events - Browse and search published events
router.get('/events', optionalAuth, async (req: Request, res: Response) => {
  const {
    search,
    category,
    status,
    timeFilter,
    sortBy,
    page = '1',
    limit = '12',
    organizerId,
  } = req.query as Record<string, string>;

  const result = await db.listEvents({
    search,
    category,
    status,
    timeFilter: timeFilter as any,
    sortBy: sortBy as any,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 12,
    organizerId,
    userId: req.user?.id,
  });

  res.status(200).json({
    success: true,
    data: result.events,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      total_pages: result.total_pages,
    },
  });
});

// GET /api/v1/events/:id - Get event details by ID or Slug
router.get('/events/:id', optionalAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  let event = await db.getEventById(id, req.user?.id);
  
  if (!event) {
    // Try finding by slug
    event = await db.getEventBySlug(id, req.user?.id);
  }

  if (!event) {
    res.status(404).json({
      success: false,
      error: { code: 'EVENT_NOT_FOUND', message: 'The requested event could not be found.' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: event,
  });
});

// POST /api/v1/events - Create new event (Organizer or Admin)
router.post(
  '/events',
  requireAuth,
  requireRole(['organizer', 'admin']),
  validateRequest({ body: EventCreateSchema }),
  async (req: Request, res: Response) => {
    const organization = req.body.organization || req.user!.full_name;
    const organizationId = req.body.organization_id ||
      (APPROVED_ORGANIZATIONS.find(o => o.name.toLowerCase() === organization.toLowerCase())?.id || 'srmist');

    const eventData = {
      ...req.body,
      organizer_id: req.user!.id,
      organizer_name: organization,
      organization,
      organization_id: organizationId,
    };

    const created = await db.createEvent(eventData);
    res.status(201).json({
      success: true,
      data: created,
      message: 'Event created successfully.',
    });
  }
);

// PATCH /api/v1/events/:id - Update existing event (Owner organizer or Admin)
router.patch(
  '/events/:id',
  requireAuth,
  requireRole(['organizer', 'admin']),
  validateRequest({ body: EventUpdateSchema }),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const existing = await db.getEventById(id);

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' },
      });
      return;
    }

    // Check ownership: only event organizer owner or admin can edit
    if (req.user!.role !== 'admin' && existing.organizer_id !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to modify events published by another organizer.' },
      });
      return;
    }

    const updated = await db.updateEvent(id, req.body);
    res.status(200).json({
      success: true,
      data: updated,
      message: 'Event updated successfully.',
    });
  }
);

// PATCH /api/v1/events/:id/cancel - Cancel event (Owner organizer or Admin)
router.patch(
  '/events/:id/cancel',
  requireAuth,
  requireRole(['organizer', 'admin']),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { reason } = req.body || {};
    try {
      const cancelled = await db.cancelEvent(id, req.user!.id, req.user!.role, reason);
      res.status(200).json({
        success: true,
        data: cancelled,
        message: 'Event has been successfully cancelled.',
      });
    } catch (err: any) {
      const isNotFound = err.message && err.message.includes('EVENT_NOT_FOUND');
      const isForbidden = err.message && err.message.includes('FORBIDDEN');
      res.status(isNotFound ? 404 : isForbidden ? 403 : 400).json({
        success: false,
        error: {
          code: isNotFound ? 'EVENT_NOT_FOUND' : isForbidden ? 'FORBIDDEN' : 'CANCELLATION_FAILED',
          message: err.message.replace(/^[A-Z_]+:\s*/, ''),
        },
      });
    }
  }
);

// DELETE /api/v1/events/:id - Safe Soft-Delete event (Owner organizer or Admin)
router.delete(
  '/events/:id',
  requireAuth,
  requireRole(['organizer', 'admin']),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
      await db.deleteEventSafe(id, req.user!.id, req.user!.role);
      res.status(200).json({
        success: true,
        message: 'Event successfully removed from active listings. Historical registrations and records have been safely preserved.',
      });
    } catch (err: any) {
      const isNotFound = err.message && err.message.includes('EVENT_NOT_FOUND');
      const isForbidden = err.message && err.message.includes('FORBIDDEN');
      res.status(isNotFound ? 404 : isForbidden ? 403 : 400).json({
        success: false,
        error: {
          code: isNotFound ? 'EVENT_NOT_FOUND' : isForbidden ? 'FORBIDDEN' : 'DELETE_FAILED',
          message: err.message.replace(/^[A-Z_]+:\s*/, ''),
        },
      });
    }
  }
);

// POST /api/v1/events/:id/duplicate - Duplicate event as draft (Owner organizer or Admin)
router.post(
  '/events/:id/duplicate',
  requireAuth,
  requireRole(['organizer', 'admin']),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
      const duplicated = await db.duplicateEvent(id, req.user!.id, req.user!.role);
      res.status(201).json({
        success: true,
        data: duplicated,
        message: 'Event duplicated successfully as draft.',
      });
    } catch (err: any) {
      const isNotFound = err.message && err.message.includes('EVENT_NOT_FOUND');
      const isForbidden = err.message && err.message.includes('FORBIDDEN');
      res.status(isNotFound ? 404 : isForbidden ? 403 : 400).json({
        success: false,
        error: {
          code: isNotFound ? 'EVENT_NOT_FOUND' : isForbidden ? 'FORBIDDEN' : 'DUPLICATE_FAILED',
          message: err.message.replace(/^[A-Z_]+:\s*/, ''),
        },
      });
    }
  }
);

// POST /api/v1/events/:id/announcements - Broadcast announcement to registered students (Owner organizer or Admin)
router.post(
  '/events/:id/announcements',
  requireAuth,
  requireRole(['organizer', 'admin']),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, message } = req.body || {};
    if (!title?.trim() || !message?.trim()) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ANNOUNCEMENT', message: 'Announcement title and message are required.' },
      });
      return;
    }

    try {
      const result = await db.createEventAnnouncement(
        id,
        req.user!.id,
        req.user!.role,
        title.trim(),
        message.trim()
      );
      res.status(201).json({
        success: true,
        data: result,
        message: `Announcement broadcast successfully to ${result.sent_to} registered attendees.`,
      });
    } catch (err: any) {
      const isNotFound = err.message && err.message.includes('EVENT_NOT_FOUND');
      const isForbidden = err.message && err.message.includes('FORBIDDEN');
      res.status(isNotFound ? 404 : isForbidden ? 403 : 400).json({
        success: false,
        error: {
          code: isNotFound ? 'EVENT_NOT_FOUND' : isForbidden ? 'FORBIDDEN' : 'ANNOUNCEMENT_FAILED',
          message: err.message.replace(/^[A-Z_]+:\s*/, ''),
        },
      });
    }
  }
);

export default router;
