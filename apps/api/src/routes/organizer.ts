import { Router, Request, Response } from 'express';
import { db } from '../services/store.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/organizer/overview - Organizer metrics summary
router.get('/organizer/overview', requireAuth, requireRole(['organizer', 'admin']), async (req: Request, res: Response) => {
  const overview = await db.getOrganizerOverview(req.user!.id);
  res.status(200).json({
    success: true,
    data: overview,
  });
});

// GET /api/v1/organizer/events - Organizer's hosted events (Supports status filter: active | cancelled | completed | all)
router.get('/organizer/events', requireAuth, requireRole(['organizer', 'admin']), async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };
  const result = await db.listEvents({
    organizerId: req.user!.id,
    status: status || undefined,
    timeFilter: 'all',
    limit: 100,
  });

  res.status(200).json({
    success: true,
    data: result.events,
    total: result.total,
  });
});

// GET /api/v1/me/notifications - In-app notifications for authenticated user
router.get('/me/notifications', requireAuth, async (req: Request, res: Response) => {
  const notifications = await db.getUserNotifications(req.user!.id);
  res.status(200).json({
    success: true,
    data: notifications,
  });
});

// PATCH /api/v1/me/notifications/:id/read - Mark notification as read
router.patch('/me/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const marked = await db.markNotificationRead(id, req.user!.id);
  res.status(200).json({
    success: true,
    data: { id, read: marked },
  });
});

export default router;
