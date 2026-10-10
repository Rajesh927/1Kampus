import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Validates request data (body, query, params) against a Zod schema
 */
export function validateRequest(schemas: {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input parameters.',
            details: err.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(err);
    }
  };
}

// Base Object Schema with all 12 required fields
export const EventBaseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title cannot exceed 120 characters'),
  event_type: z.enum([
    'hackathon',
    'workshop',
    'competition',
    'seminar',
    'technical fest',
    'cultural event',
    'sports',
    'other',
  ], { required_error: 'Event type is required' }),
  category: z.enum([
    'Technology',
    'Hackathons',
    'Workshops',
    'Cultural',
    'Entrepreneurship',
    'Sports',
    'Talks',
  ], { required_error: 'Category is required' }),
  organization: z.string().trim().min(2, 'Organized by is required').max(100),
  organization_id: z.string().trim().optional(),
  capacity: z.number().int().positive('Total seat capacity must be a positive integer').max(10000, 'Capacity cannot exceed 10000'),
  venue: z.string().trim().min(2, 'Venue location is required').max(200),
  start_time: z.string().datetime('Start time must be a valid ISO 8601 datetime'),
  end_time: z.string().datetime('End time must be a valid ISO 8601 datetime'),
  registration_deadline: z.string().datetime('Registration deadline must be a valid ISO 8601 datetime'),
  banner_url: z.string().url('Banner URL must be a valid URL'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  instructions: z.string().trim().min(5, 'Attendee instructions are required (minimum 5 characters)'),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional().default('published'),
});

export const EventCreateSchema = EventBaseSchema.refine(
  data => new Date(data.end_time) > new Date(data.start_time),
  {
    message: 'End date and time must be later than start date and time',
    path: ['end_time'],
  }
).refine(
  data => new Date(data.registration_deadline) <= new Date(data.start_time),
  {
    message: 'Registration deadline must precede or equal the event start time',
    path: ['registration_deadline'],
  }
);

export const EventUpdateSchema = EventBaseSchema.partial().refine(
  data => {
    if (data.start_time && data.end_time) {
      return new Date(data.end_time) > new Date(data.start_time);
    }
    return true;
  },
  {
    message: 'End date and time must be later than start date and time',
    path: ['end_time'],
  }
).refine(
  data => {
    if (data.start_time && data.registration_deadline) {
      return new Date(data.registration_deadline) <= new Date(data.start_time);
    }
    return true;
  },
  {
    message: 'Registration deadline must precede or equal the event start time',
    path: ['registration_deadline'],
  }
);

export const ProfileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(60).optional(),
  avatar_url: z.string().url('Avatar URL must be a valid URL').optional(),
  section: z.string().trim().min(1).max(30).optional(),
});

export const AttendanceUpdateSchema = z.object({
  attendance_status: z.enum(['unmarked', 'attended', 'absent']),
});

export const StudentSignupSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(100, 'Full name is too long'),
  registration_number: z.string().trim().min(3, 'Registration number must be at least 3 characters').max(30, 'Registration number cannot exceed 30 characters'),
  email: z.string().trim().email('Valid email address is required'),
  section: z.string().trim().min(1, 'Section is required').max(30, 'Section cannot exceed 30 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password cannot exceed 128 characters'),
});

export const AdminStudentUpdateSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name cannot be empty').max(100).optional(),
  section: z.string().trim().min(1, 'Section cannot be empty').max(30).optional(),
  registration_number: z.string().trim().min(3, 'Registration number must be at least 3 characters').max(30).optional(),
});

export const AdminOrganizerUpdateSchema = z.object({
  full_name: z.string().trim().min(2, 'Club or organizer name must be at least 2 characters').max(100).optional(),
  section: z.string().trim().min(1, 'Section or department cannot be empty').max(50).optional(),
  registration_number: z.string().trim().min(3, 'Registration code must be at least 3 characters').max(30).optional(),
  role: z.enum(['organizer', 'student']).optional(),
});

