import { Router, Request, Response } from 'express';
import { db } from '../services/store.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest, ProfileUpdateSchema, StudentSignupSchema } from '../middleware/validation.js';

const router = Router();

// GET /api/v1/me - Get authenticated user's profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const profile = await db.getProfileById(req.user!.id);
  if (!profile) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User profile not found.' },
    });
    return;
  }
  res.status(200).json({ success: true, data: profile });
});

// PATCH /api/v1/me - Update authenticated user's profile fields
router.patch('/me', requireAuth, validateRequest({ body: ProfileUpdateSchema }), async (req: Request, res: Response) => {
  const updated = await db.updateProfile(req.user!.id, {
    full_name: req.body.full_name,
    avatar_url: req.body.avatar_url,
    section: req.body.section,
  });

  if (!updated) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User profile not found.' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Profile updated successfully.',
  });
});

// POST /api/v1/auth/signup - Student signup with exactly 5 required fields
router.post('/auth/signup', validateRequest({ body: StudentSignupSchema }), async (req: Request, res: Response) => {
  const { full_name, registration_number, email, section, password: _password } = req.body;
  // Security requirement: _password is intentionally NOT stored or logged in database profile

  try {
    const student = await db.registerStudentProfile({
      email,
      full_name,
      registration_number,
      section,
    });

    res.status(201).json({
      success: true,
      data: {
        user: student,
        token: `demo_${student.id}`,
      },
      message: 'Student registration successful. Welcome to 1Kampus!',
    });
  } catch (err: any) {
    const message = err.message || 'Could not complete registration.';
    const isDuplicate = message.includes('DUPLICATE_EMAIL') || message.includes('DUPLICATE_REGISTRATION_NUMBER');
    
    res.status(isDuplicate ? 409 : 500).json({
      success: false,
      error: {
        code: isDuplicate ? 'DUPLICATE_RECORD' : 'REGISTRATION_FAILED',
        message: message.replace(/^[A-Z_]+:\s*/, ''),
      },
    });
  }
});

// POST /api/v1/auth/check-unique - Proactive validation for email or college registration number
router.post('/auth/check-unique', async (req: Request, res: Response) => {
  const { email, registration_number, excludeUserId } = req.body;

  const emailExists = email ? await db.checkEmailExists(email, excludeUserId) : false;
  const regExists = registration_number ? await db.checkRegistrationNumberExists(registration_number, excludeUserId) : false;

  res.status(200).json({
    success: true,
    data: {
      emailExists,
      registrationNumberExists: regExists,
    },
  });
});

// POST /api/v1/auth/recover-password - Initiate password reset flow (Supabase Auth compatible)
router.post('/auth/recover-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_EMAIL', message: 'A valid email address is required.' },
    });
    return;
  }

  // Security requirement: Never reveal if the email actually exists, to prevent account enumeration
  res.status(200).json({
    success: true,
    message: 'If an account exists with this email address, a password reset link has been dispatched.',
  });
});

// POST /api/v1/auth/dev-login - Quick reviewer / developer role selector for demonstration & review
router.post('/auth/dev-login', async (req: Request, res: Response) => {
  const { role, email } = req.body;
  const profiles = await db.listAllProfiles();
  
  let target: (typeof profiles)[0] | undefined;
  if (email) {
    target = profiles.find(p => p.email.toLowerCase() === email.trim().toLowerCase());
  }
  if (!target) {
    const effectiveRole = role || 'student';
    if (effectiveRole === 'admin') {
      target = profiles.find(p => p.email.toLowerCase() === 'admin@srmist.edu.in' && p.role === 'admin') || profiles.find(p => p.role === 'admin');
    } else {
      target = profiles.find(p => p.role === effectiveRole);
    }
  }

  if (!target) {
    // If no existing profile for this role, auto create one
    const id = `00000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`;
    target = await db.saveProfile({
      id,
      email: email || `${role}@campusconnect.edu`,
      full_name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      role: role as any,
      registration_number: role === 'student' ? `RA2311003010${Math.floor(100 + Math.random() * 900)}` : `STAFF-${Date.now().toString(16).slice(-4)}`,
      section: role === 'student' ? 'CSE-A' : 'Staff',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      user: target,
      token: `demo_${target.id}`,
    },
  });
});

export default router;
