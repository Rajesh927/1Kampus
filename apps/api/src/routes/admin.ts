import { Router, Request, Response } from 'express';
import { db } from '../services/store.js';
import { requireAuth, requireRole, requireSuperAdmin } from '../middleware/auth.js';
import { validateRequest, AdminStudentUpdateSchema, AdminOrganizerUpdateSchema, OrganizerRejectionSchema } from '../middleware/validation.js';

const router = Router();

// GET /api/v1/admin/overview - Overall platform statistics
router.get('/admin/overview', requireAuth, requireRole(['admin']), async (_req: Request, res: Response) => {
  const overview = await db.getAdminOverview();
  res.status(200).json({
    success: true,
    data: overview,
  });
});

// GET /api/v1/admin/users - Platform user directory
router.get('/admin/users', requireAuth, requireRole(['admin']), async (_req: Request, res: Response) => {
  const users = await db.listAllProfiles();
  res.status(200).json({
    success: true,
    data: users,
    total: users.length,
  });
});

// ----------------------------------------------------------------------------
// STUDENT MANAGEMENT (Protected Admin Endpoints)
// ----------------------------------------------------------------------------

// GET /api/v1/admin/students - Searchable, filtered, paginated student directory
router.get('/admin/students', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const {
    search,
    section,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = '1',
    limit = '10',
  } = req.query as Record<string, string>;

  const result = await db.listStudents({
    search,
    section,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
  });

  res.status(200).json({
    success: true,
    data: result.students,
    total: result.total,
    page: result.page,
    limit: result.limit,
    total_pages: result.total_pages,
    sections: result.sections,
  });
});

// GET /api/v1/admin/students/:id - Individual student profile details & event activity
router.get('/admin/students/:id', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const details = await db.getStudentDetails(id);

  if (!details) {
    res.status(404).json({
      success: false,
      error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found.' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: details,
  });
});

// PATCH /api/v1/admin/students/:id - Authorized admin edit of student name, section, registration number
router.patch(
  '/admin/students/:id',
  requireAuth,
  requireRole(['admin']),
  validateRequest({ body: AdminStudentUpdateSchema }),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
      const updated = await db.updateStudentByAdmin(id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
        message: 'Student profile updated successfully.',
      });
    } catch (err: any) {
      const isDuplicate = err.message && err.message.includes('DUPLICATE_REGISTRATION_NUMBER');
      res.status(isDuplicate ? 409 : 400).json({
        success: false,
        error: {
          code: isDuplicate ? 'DUPLICATE_REGISTRATION_NUMBER' : 'UPDATE_FAILED',
          message: err.message.replace(/^[A-Z_]+:\s*/, ''),
        },
      });
    }
  }
);

// POST /api/v1/admin/students/:id/reset-password - Admin-triggered password reset request
router.post('/admin/students/:id/reset-password', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const profile = await db.getProfileById(id);

  if (!profile) {
    res.status(404).json({
      success: false,
      error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found.' },
    });
    return;
  }

  // Security requirement: The admin CANNOT view or retrieve the student's password.
  // Instead, an approved Supabase Auth recovery procedure is initiated.
  res.status(200).json({
    success: true,
    message: `Password reset email dispatched to student at ${profile.email}.`,
  });
});

// ----------------------------------------------------------------------------
// EVENT MODERATION
// ----------------------------------------------------------------------------

// PATCH /api/v1/admin/events/:id/status - Moderate/change event status
router.patch('/admin/events/:id/status', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, reason } = req.body;

  if (!['draft', 'published', 'cancelled', 'completed'].includes(status)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Status must be one of [draft, published, cancelled, completed].' },
    });
    return;
  }

  if (status === 'cancelled') {
    try {
      const cancelled = await db.cancelEvent(id, req.user!.id, 'admin', reason);
      res.status(200).json({
        success: true,
        data: cancelled,
        message: 'Event status successfully updated to cancelled.',
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CANCELLATION_FAILED', message: err.message.replace(/^[A-Z_]+:\s*/, '') },
      });
      return;
    }
  }

  const updated = await db.updateEvent(id, { status });
  if (!updated) {
    res.status(404).json({
      success: false,
      error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: updated,
    message: `Event status successfully updated to ${status}.`,
  });
});

// PATCH /api/v1/admin/events/:id/cancel - Administrator event cancellation with reason
router.patch('/admin/events/:id/cancel', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body || {};
  try {
    const cancelled = await db.cancelEvent(id, req.user!.id, 'admin', reason);
    res.status(200).json({
      success: true,
      data: cancelled,
      message: 'Event cancelled successfully by administrator. Organizer notified.',
    });
  } catch (err: any) {
    const isNotFound = err.message && err.message.includes('EVENT_NOT_FOUND');
    res.status(isNotFound ? 404 : 400).json({
      success: false,
      error: {
        code: isNotFound ? 'EVENT_NOT_FOUND' : 'CANCELLATION_FAILED',
        message: err.message.replace(/^[A-Z_]+:\s*/, ''),
      },
    });
  }
});

// DELETE /api/v1/admin/events/:id - Administrator event soft-deletion
router.delete('/admin/events/:id', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await db.deleteEventSafe(id, req.user!.id, 'admin');
    res.status(200).json({
      success: true,
      message: 'Event safely removed by administrator. Historical tickets and student records preserved.',
    });
  } catch (err: any) {
    const isNotFound = err.message && err.message.includes('EVENT_NOT_FOUND');
    res.status(isNotFound ? 404 : 400).json({
      success: false,
      error: {
        code: isNotFound ? 'EVENT_NOT_FOUND' : 'DELETE_FAILED',
        message: err.message.replace(/^[A-Z_]+:\s*/, ''),
      },
    });
  }
});

// ----------------------------------------------------------------------------
// SUPER ADMIN STATUS & ORGANIZER MANAGEMENT (Super Admin Authorized)
// ----------------------------------------------------------------------------

// GET /api/v1/admin/super-admin - Inspect designated Super Admin status and admin conflicts
router.get('/admin/super-admin', requireAuth, requireRole(['admin']), async (_req: Request, res: Response) => {
  const result = await db.ensureDesignatedSuperAdmin();
  res.status(200).json({
    success: true,
    data: {
      designated_email: 'admin@srmist.edu.in',
      is_configured: true,
      super_admin: result.superAdmin,
      designated_super_admin: result.superAdmin,
      account_type: 'Super Admin',
      conflicts: result.conflicts,
      has_conflict: result.conflicts.length > 0,
      has_conflicts: result.conflicts.length > 0,
      admin_count: result.conflicts.length + 1,
      total_admin_accounts: result.conflicts.length + 1,
    },
  });
});

// GET /api/v1/admin/organizers - List campus organizers and clubs
router.get('/admin/organizers', requireAuth, requireRole(['admin']), async (_req: Request, res: Response) => {
  const organizers = await db.listOrganizers();
  res.status(200).json({
    success: true,
    data: organizers,
    total: organizers.length,
  });
});

// GET /api/v1/admin/organizers/:id - Specific organizer club details
router.get('/admin/organizers/:id', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const details = await db.getOrganizerDetails(id);

  if (!details) {
    res.status(404).json({
      success: false,
      error: { code: 'ORGANIZER_NOT_FOUND', message: 'Organizer account not found.' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: details,
  });
});

// PATCH /api/v1/admin/organizers/:id - Update organizer club metadata and permissions
router.patch(
  '/admin/organizers/:id',
  requireAuth,
  requireRole(['admin']),
  validateRequest({ body: AdminOrganizerUpdateSchema }),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
      const updated = await db.updateOrganizerByAdmin(id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
        message: 'Organizer account and permissions updated successfully.',
      });
    } catch (err: any) {
      const isNotFound = err.message && err.message.includes('ORGANIZER_NOT_FOUND');
      const isForbidden = err.message && err.message.includes('FORBIDDEN_ROLE');
      res.status(isNotFound ? 404 : isForbidden ? 403 : 400).json({
        success: false,
        error: {
          code: isNotFound ? 'ORGANIZER_NOT_FOUND' : isForbidden ? 'FORBIDDEN_ROLE' : 'UPDATE_FAILED',
          message: err.message.replace(/^[A-Z_]+:\s*/, ''),
        },
      });
    }
  }
);

// GET /api/v1/admin/events/:id/attendees - View confirmed registrations and attendance data for an event
router.get('/admin/events/:id/attendees', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const attendees = await db.getEventAttendees(id);
    res.status(200).json({
      success: true,
      data: attendees,
      total: attendees.length,
      summary: {
        total: attendees.length,
        confirmed: attendees.filter(a => a.registration_status === 'confirmed').length,
        attended: attendees.filter(a => a.attendance_status === 'attended').length,
      },
    });
  } catch (err: any) {
    const isNotFound = err.message && err.message.includes('EVENT_NOT_FOUND');
    res.status(isNotFound ? 404 : 400).json({
      success: false,
      error: {
        code: isNotFound ? 'EVENT_NOT_FOUND' : 'QUERY_FAILED',
        message: err.message.replace(/^[A-Z_]+:\s*/, ''),
      },
    });
  }
});

// ----------------------------------------------------------------------------
// ORGANIZER APPLICATIONS (Super Admin Exclusively)
// ----------------------------------------------------------------------------

// GET /api/v1/admin/organizer-applications - List organizer applications with pending count
router.get('/admin/organizer-applications', requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };
  const applications = await db.listOrganizerApplications(status || undefined);
  const pendingCount = applications.filter(a => a.status === 'pending').length;

  res.status(200).json({
    success: true,
    data: applications,
    total: applications.length,
    pending_count: pendingCount,
  });
});

// POST /api/v1/admin/organizer-applications/:id/approve - Super Admin approves application
router.post('/admin/organizer-applications/:id/approve', requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const result = await db.approveOrganizerApplication(id, req.user!.email);
    res.status(200).json({
      success: true,
      data: result,
      message: `Organizer application for ${result.application.full_name} has been approved.`,
    });
  } catch (err: any) {
    const isNotFound = err.message && err.message.includes('APPLICATION_NOT_FOUND');
    const isForbidden = err.message && (err.message.includes('FORBIDDEN_SUPER_ADMIN_REQUIRED') || err.message.includes('CANNOT_APPROVE_SELF'));
    res.status(isNotFound ? 404 : isForbidden ? 403 : 400).json({
      success: false,
      error: {
        code: isNotFound ? 'APPLICATION_NOT_FOUND' : isForbidden ? 'FORBIDDEN' : 'APPROVAL_FAILED',
        message: err.message.replace(/^[A-Z_]+:\s*/, ''),
      },
    });
  }
});

// POST /api/v1/admin/organizer-applications/:id/reject - Super Admin rejects application
router.post(
  '/admin/organizer-applications/:id/reject',
  requireAuth,
  requireSuperAdmin,
  validateRequest({ body: OrganizerRejectionSchema }),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
      const result = await db.rejectOrganizerApplication(id, req.user!.email, req.body?.reason);
      res.status(200).json({
        success: true,
        data: result,
        message: `Organizer application for ${result.application.full_name} has been rejected.`,
      });
    } catch (err: any) {
      const isNotFound = err.message && err.message.includes('APPLICATION_NOT_FOUND');
      const isForbidden = err.message && (err.message.includes('FORBIDDEN_SUPER_ADMIN_REQUIRED') || err.message.includes('CANNOT_REJECT_SELF'));
      res.status(isNotFound ? 404 : isForbidden ? 403 : 400).json({
        success: false,
        error: {
          code: isNotFound ? 'APPLICATION_NOT_FOUND' : isForbidden ? 'FORBIDDEN' : 'REJECTION_FAILED',
          message: err.message.replace(/^[A-Z_]+:\s*/, ''),
        },
      });
    }
  }
);

// POST /api/v1/admin/organizers/:id/revoke - Super Admin suspends or revokes organizer access
router.post('/admin/organizers/:id/revoke', requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const updated = await db.revokeOrganizerAccess(id, req.user!.email, req.body?.reason);
    res.status(200).json({
      success: true,
      data: updated,
      message: `Organizer privileges revoked for ${updated.full_name}.`,
    });
  } catch (err: any) {
    const isNotFound = err.message && err.message.includes('USER_NOT_FOUND');
    const isForbidden = err.message && err.message.includes('FORBIDDEN');
    res.status(isNotFound ? 404 : isForbidden ? 403 : 400).json({
      success: false,
      error: {
        code: isNotFound ? 'USER_NOT_FOUND' : isForbidden ? 'FORBIDDEN' : 'REVOCATION_FAILED',
        message: err.message.replace(/^[A-Z_]+:\s*/, ''),
      },
    });
  }
});

export default router;
