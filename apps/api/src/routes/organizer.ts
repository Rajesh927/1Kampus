import { Router, Request, Response } from 'express';
import { db } from '../services/store.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateRequest, OrganizerApplicationSchema } from '../middleware/validation.js';

const router = Router();

// POST /api/v1/organizer/apply - Submit organizer registration application
router.post(
  '/organizer/apply',
  validateRequest({ body: OrganizerApplicationSchema }),
  async (req: Request, res: Response) => {
    try {
      const result = await db.submitOrganizerApplication({
        full_name: req.body.full_name,
        email: req.body.email,
        employee_id: req.body.employee_id,
        club_name: req.body.club_name,
        position: req.body.position,
        reason: req.body.reason,
        password: req.body.password,
      });

      res.status(201).json({
        success: true,
        data: {
          application: result.application,
          user: result.user,
          token: result.token,
        },
        message: 'Your organizer application is pending admin approval.',
      });
    } catch (err: any) {
      const isDuplicate = err.message && (err.message.includes('DUPLICATE_APPLICATION') || err.message.includes('ALREADY_APPROVED'));
      const isForbidden = err.message && err.message.includes('INVALID_ACCOUNT');
      res.status(isDuplicate ? 409 : isForbidden ? 403 : 400).json({
        success: false,
        error: {
          code: isDuplicate ? 'DUPLICATE_APPLICATION' : isForbidden ? 'FORBIDDEN' : 'APPLICATION_FAILED',
          message: err.message.replace(/^[A-Z_]+:\s*/, ''),
        },
      });
    }
  }
);

// GET /api/v1/organizer/application-status - Check current applicant's review status
router.get('/organizer/application-status', requireAuth, async (req: Request, res: Response) => {
  const application = await db.getOrganizerApplicationByUserId(req.user!.id);
  res.status(200).json({
    success: true,
    data: {
      status: application ? application.status : (req.user!.approval_status || 'none'),
      application,
      user: req.user,
    },
  });
});

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
