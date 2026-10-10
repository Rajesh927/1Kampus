import { Request, Response, NextFunction } from 'express';
import { db } from '../services/store.js';
import { UserProfile, UserRole } from '../types/index.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

/**
 * Optional authentication middleware:
 * Attaches user to req.user if a valid token or dev header is present, but doesn't block unauthenticated requests.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const devUserId = req.headers['x-user-id'] as string;
    let devUserRole = (req.headers['x-user-role'] as UserRole) || 'student';
    // Security: Only designated Super Admin account can claim admin role via dev headers
    if (devUserRole === 'admin') {
      const email = (req.headers['x-user-email'] as string || '').toLowerCase();
      if (email !== 'admin@srmist.edu.in' && devUserId !== '00000000-0000-0000-0000-000000000001') {
        devUserRole = 'student';
      }
    }
    const devUserEmail = (req.headers['x-user-email'] as string) || (devUserId ? `${devUserId}@student.srmist.edu.in` : '');
    const devUserName = (req.headers['x-user-name'] as string) || (devUserId ? `User ${devUserId}` : '');

    // 1. Check development / test headers
    if (devUserId) {
      let profile = await db.getProfileById(devUserId);
      if (!profile) {
        // Auto-provision mock profile for dev / test
        profile = await db.saveProfile({
          id: devUserId,
          email: devUserEmail,
          full_name: devUserName,
          role: devUserRole,
        });
      }
      if (profile) {
        req.user = profile;
        return next();
      }
    }

    // 2. Check Bearer token (Supabase Auth token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // If token is a test/demo token formatted as demo_<userId>
      if (token.startsWith('demo_')) {
        const userId = token.replace('demo_', '');
        const profile = await db.getProfileById(userId);
        if (profile) {
          req.user = profile;
          return next();
        }
      }

      // If token is a JWT, extract payload subject for fallback resolution
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (payload.sub) {
            let profile = await db.getProfileById(payload.sub);
            if (!profile && payload.email) {
              profile = await db.saveProfile({
                id: payload.sub,
                email: payload.email,
                full_name: payload.user_metadata?.full_name || payload.email.split('@')[0],
                role: payload.user_metadata?.role || 'student',
              });
            }
            if (profile) {
              req.user = profile;
              return next();
            }
          }
        }
      } catch (parseErr) {
        // Ignored, proceed to next
      }
    }

    return next();
  } catch (err) {
    return next();
  }
}

/**
 * Strict authentication middleware:
 * Rejects with 401 Unauthorized if no valid user is identified.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  await optionalAuth(req, res, () => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please sign in to access this resource.',
        },
      });
      return;
    }
    next();
  });
}

/**
 * Role-based authorization middleware:
 * Checks if req.user has one of the allowed roles.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please sign in first.',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: This resource requires one of [${allowedRoles.join(', ')}] privileges. Your role: ${req.user.role}.`,
        },
      });
      return;
    }

    next();
  };
}
