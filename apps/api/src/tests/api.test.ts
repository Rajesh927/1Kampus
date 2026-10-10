import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../services/store.js';

const app = createApp();

describe('1Kampus Backend API Tests', () => {
  const studentUser = {
    id: '00000000-0000-0000-0000-000000000010',
    role: 'student',
    email: 'alex.chen@student.srmist.edu.in',
    full_name: 'Alex Chen',
  };

  const organizerUser = {
    id: '00000000-0000-0000-0000-000000000002',
    role: 'organizer',
    email: 'acm@srmist.edu.in',
    full_name: 'ACM Student Chapter SRMIST',
  };

  const adminUser = {
    id: '00000000-0000-0000-0000-000000000001',
    role: 'admin',
    email: 'admin@srmist.edu.in',
    full_name: 'SRMIST',
  };

  // 1. Health Endpoint
  describe('GET /api/v1/health', () => {
    it('returns healthy status with system metadata', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.service).toBe('1Kampus API');
    });
  });

  // 2. Events Listing & Search
  describe('GET /api/v1/events', () => {
    it('returns list of published events with pagination', async () => {
      const res = await request(app).get('/api/v1/events?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    it('filters events accurately by category', async () => {
      const res = await request(app).get('/api/v1/events?category=Hackathons');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.forEach((e: any) => {
        expect(e.category).toBe('Hackathons');
      });
    });

    it('searches events by keyword query', async () => {
      const res = await request(app).get('/api/v1/events?search=Hack');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some((e: any) => e.title.toLowerCase().includes('hack'))).toBe(true);
    });
  });

  // 3. Single Event Details
  describe('GET /api/v1/events/:id', () => {
    it('retrieves event by valid ID with remaining capacity calculations', async () => {
      const res = await request(app).get('/api/v1/events/10000000-0000-0000-0000-000000000001');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('10000000-0000-0000-0000-000000000001');
      expect(typeof res.body.data.remaining_capacity).toBe('number');
      expect(typeof res.body.data.registered_count).toBe('number');
    });

    it('retrieves event by slug', async () => {
      const res = await request(app).get('/api/v1/events/hack-srm-2026');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('hack-srm-2026');
    });

    it('returns 404 for non-existent event ID', async () => {
      const res = await request(app).get('/api/v1/events/non-existent-id-999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EVENT_NOT_FOUND');
    });
  });

  // 4. Concurrency & Business Rules on Registrations
  describe('POST /api/v1/events/:id/register', () => {
    const testEventId = '10000000-0000-0000-0000-000000000003'; // Robotics Bootcamp
    const newStudentId = '00000000-0000-0000-0000-000000000099';

    it('rejects unauthenticated registration attempts with 401', async () => {
      const res = await request(app).post(`/api/v1/events/${testEventId}/register`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('successfully registers an authenticated student and issues a ticket code', async () => {
      const res = await request(app)
        .post(`/api/v1/events/${testEventId}/register`)
        .set('x-user-id', newStudentId)
        .set('x-user-role', 'student')
        .set('x-user-email', 'new.student@student.srmist.edu.in')
        .set('x-user-name', 'New Test Student');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticket_code).toBeDefined();
      expect(res.body.data.ticket_code.startsWith('CC-')).toBe(true);
      expect(res.body.data.registration_status).toBe('confirmed');
    });

    it('prevents duplicate active registrations for the same user and event (409 Conflict)', async () => {
      // Second attempt by the same student
      const res = await request(app)
        .post(`/api/v1/events/${testEventId}/register`)
        .set('x-user-id', newStudentId)
        .set('x-user-role', 'student')
        .set('x-user-email', 'new.student@student.srmist.edu.in');

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_REGISTRATION');
    });

    it('enforces event capacity limits safely', async () => {
      // Create a tiny event with capacity 1
      const tinyEvent = await db.createEvent({
        organizer_id: organizerUser.id,
        organizer_name: organizerUser.full_name,
        title: 'Tiny VIP Workshop',
        slug: 'tiny-vip-workshop-' + Date.now(),
        description: 'Exclusive 1-person workshop test.',
        category: 'Workshops',
        banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
        venue: 'Room 101',
        start_time: new Date(Date.now() + 86400000 * 5).toISOString(),
        end_time: new Date(Date.now() + 86400000 * 5 + 3600000).toISOString(),
        registration_deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
        capacity: 1,
        status: 'published',
      });

      // User 1 registers (takes 1/1 seat)
      const res1 = await request(app)
        .post(`/api/v1/events/${tinyEvent.id}/register`)
        .set('x-user-id', 'user-cap-1')
        .set('x-user-role', 'student')
        .set('x-user-email', 'cap1@srmist.edu');
      expect(res1.status).toBe(201);

      // User 2 attempts to register on full event (should reject)
      const res2 = await request(app)
        .post(`/api/v1/events/${tinyEvent.id}/register`)
        .set('x-user-id', 'user-cap-2')
        .set('x-user-role', 'student')
        .set('x-user-email', 'cap2@srmist.edu');

      expect(res2.status).toBe(409);
      expect(res2.body.error.code).toBe('EVENT_FULL');
    });
  });

  // 5. Cancellation & Ownership Validation
  describe('DELETE /api/v1/registrations/:id', () => {
    it('allows a student to cancel their own registration', async () => {
      // User registers first
      const regRes = await request(app)
        .post('/api/v1/events/10000000-0000-0000-0000-000000000004/register')
        .set('x-user-id', 'cancel-test-student')
        .set('x-user-role', 'student')
        .set('x-user-email', 'cancel.student@srmist.edu');

      expect(regRes.status).toBe(201);
      const regId = regRes.body.data.id;

      // Cancel own registration
      const cancelRes = await request(app)
        .delete(`/api/v1/registrations/${regId}`)
        .set('x-user-id', 'cancel-test-student')
        .set('x-user-role', 'student');

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.registration_status).toBe('cancelled');
    });

    it("rejects unauthorized attempts to cancel another student's registration (403)", async () => {
      // Initial registration by student 1
      const regRes = await request(app)
        .post('/api/v1/events/10000000-0000-0000-0000-000000000005/register')
        .set('x-user-id', 'student-alice')
        .set('x-user-role', 'student')
        .set('x-user-email', 'alice@srmist.edu');

      const regId = regRes.body.data.id;

      // Student 2 tries to cancel Alice's registration
      const cancelRes = await request(app)
        .delete(`/api/v1/registrations/${regId}`)
        .set('x-user-id', 'student-bob')
        .set('x-user-role', 'student');

      expect(cancelRes.status).toBe(403);
      expect(cancelRes.body.error.code).toBe('FORBIDDEN');
    });
  });

  // 6. Role-Based Access Control on Organizer & Admin Endpoints
  describe('RBAC & Dashboard Endpoints', () => {
    it('blocks regular students from accessing organizer overview (403)', async () => {
      const res = await request(app)
        .get('/api/v1/organizer/overview')
        .set('x-user-id', studentUser.id)
        .set('x-user-role', 'student');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('grants organizers access to organizer overview metrics', async () => {
      const res = await request(app)
        .get('/api/v1/organizer/overview')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.total_events).toBe('number');
      expect(typeof res.body.data.total_registrations).toBe('number');
    });

    it('grants admins access to admin overview platform statistics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('x-user-id', adminUser.id)
        .set('x-user-role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_users).toBeGreaterThan(0);
      expect(res.body.data.total_events).toBeGreaterThan(0);
    });

    it('blocks non-admins from admin overview (403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // 7. Student Registration with 5 Required Fields & Security
  describe('Student Registration & Security', () => {
    it('successfully registers a student with all 5 required fields', async () => {
      const uniqueSuffix = Date.now().toString(16).slice(-5);
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          full_name: 'Aditya Rao',
          registration_number: `RA231100301${uniqueSuffix}`,
          email: `aditya.${uniqueSuffix}@student.srmist.edu.in`,
          section: 'CSE-C',
          password: 'SecurePassword123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.full_name).toBe('Aditya Rao');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.section).toBe('CSE-C');
      expect(res.body.data.user.registration_number).toBe(`RA231100301${uniqueSuffix}`.toUpperCase());
      // Security: Password must NEVER be returned in response or stored in profile
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('rejects signup when any of the 5 required fields are missing or invalid (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          full_name: 'Aditya',
          // missing registration_number
          email: 'not-an-email',
          section: '',
          password: '123', // too short (< 6 chars)
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('prevents duplicate account creation using the same email (409)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          full_name: 'Alex Duplicate',
          registration_number: 'RA9999999999999',
          email: 'alex.chen@student.srmist.edu.in', // Existing email
          section: 'CSE-A',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_RECORD');
    });

    it('prevents duplicate account creation using the same registration number (409)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          full_name: 'Priya New Email',
          registration_number: 'RA2311003010123', // Alex Chen's existing reg number
          email: 'priya.new@student.srmist.edu.in',
          section: 'CSE-B',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_RECORD');
    });
  });

  // 8. Admin Student Management Protected Endpoints
  describe('Admin Student Management', () => {
    it('blocks non-admin students from accessing student management directory (403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/students')
        .set('x-user-id', studentUser.id)
        .set('x-user-role', 'student');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows admin to list students with total count and section metadata', async () => {
      const res = await request(app)
        .get('/api/v1/admin/students')
        .set('x-user-id', adminUser.id)
        .set('x-user-role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
      expect(Array.isArray(res.body.sections)).toBe(true);
    });

    it('allows admin to search and filter students by section', async () => {
      const res = await request(app)
        .get('/api/v1/admin/students?section=CSE-A')
        .set('x-user-id', adminUser.id)
        .set('x-user-role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.forEach((s: any) => {
        expect(s.section).toBe('CSE-A');
        expect(s.role).toBe('student');
      });
    });

    it('allows admin to edit student name and section, while preserving student role', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/students/00000000-0000-0000-0000-000000000010')
        .set('x-user-id', adminUser.id)
        .set('x-user-role', 'admin')
        .send({
          full_name: 'Alex Chen Updated',
          section: 'CSE-A (Honor Roll)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.full_name).toBe('Alex Chen Updated');
      expect(res.body.data.section).toBe('CSE-A (Honor Roll)');
      // Cannot elevate to admin:
      expect(res.body.data.role).toBe('student');
    });
  });

  // 9. Event Cancellation, Safe Deletion & Retention
  describe('Event Cancellation & Deletion Policies', () => {
    let testEventId: string;
    let otherOrganizerEventId: string;

    beforeEach(async () => {
      // Create a test event owned by organizerUser
      const created1 = await db.createEvent({
        organizer_id: organizerUser.id,
        organizer_name: organizerUser.full_name,
        title: 'ACM Cloud Architecture Summit',
        slug: `cloud-summit-${Date.now()}`,
        description: 'Deep dive into microservices and distributed storage patterns.',
        category: 'Technology',
        banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        venue: 'UB 301',
        start_time: new Date(Date.now() + 86400000 * 5).toISOString(),
        end_time: new Date(Date.now() + 86400000 * 5 + 14400000).toISOString(),
        registration_deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
        capacity: 40,
        status: 'published',
      });
      testEventId = created1.id;

      // Create an event owned by another organizer
      const created2 = await db.createEvent({
        organizer_id: '00000000-0000-0000-0000-000000000003', // Robotics Club
        organizer_name: 'SRM Robotics Club',
        title: 'Robotics Autonomous Quadcopter Race',
        slug: `quadcopter-race-${Date.now()}`,
        description: 'Drone dynamics and high-speed obstacle navigation.',
        category: 'Technology',
        banner_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
        venue: 'Indoor Arena',
        start_time: new Date(Date.now() + 86400000 * 6).toISOString(),
        end_time: new Date(Date.now() + 86400000 * 6 + 14400000).toISOString(),
        registration_deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
        capacity: 30,
        status: 'published',
      });
      otherOrganizerEventId = created2.id;
    });

    it('1. Admin cancels an event and records cancellation reason and timestamp', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/events/${testEventId}/cancel`)
        .set('x-user-id', adminUser.id)
        .set('x-user-role', 'admin')
        .send({ reason: 'Emergency maintenance in University Building' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('cancelled');
      expect(res.body.data.cancellation_reason).toBe('Emergency maintenance in University Building');
      expect(res.body.data.cancelled_at).toBeDefined();
    });

    it('2. The cancelled event disappears from organizer active list', async () => {
      // First cancel the event
      await db.cancelEvent(testEventId, adminUser.id, 'admin', 'Maintenance');

      // Query active organizer events
      const res = await request(app)
        .get('/api/v1/organizer/events?status=active')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const containsCancelled = res.body.data.some((e: any) => e.id === testEventId);
      expect(containsCancelled).toBe(false);
    });

    it('3. The event appears as cancelled in organizer cancelled history view', async () => {
      await db.cancelEvent(testEventId, adminUser.id, 'admin', 'Rescheduled');

      const res = await request(app)
        .get('/api/v1/organizer/events?status=cancelled')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.data.find((e: any) => e.id === testEventId);
      expect(found).toBeDefined();
      expect(found.status).toBe('cancelled');
    });

    it('4. Students cannot register for the cancelled event (400)', async () => {
      await db.cancelEvent(testEventId, adminUser.id, 'admin', 'Cancelled');

      const res = await request(app)
        .post(`/api/v1/events/${testEventId}/register`)
        .set('x-user-id', studentUser.id)
        .set('x-user-role', 'student');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EVENT_CANCELLED');
    });

    it('5. Organizer deletes their own eligible event via safe soft-delete', async () => {
      const res = await request(app)
        .delete(`/api/v1/events/${testEventId}`)
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbEvent = await db.getEventById(testEventId, organizerUser.id);
      expect(dbEvent?.deleted_at).toBeDefined();
    });

    it('6. The deleted event disappears from public active views', async () => {
      await db.deleteEventSafe(testEventId, organizerUser.id, 'organizer');

      // Public events list
      const res = await request(app).get('/api/v1/events');
      expect(res.status).toBe(200);
      const foundInPublic = res.body.data.some((e: any) => e.id === testEventId);
      expect(foundInPublic).toBe(false);

      // Single event lookup by public student returns 404
      const resSingle = await request(app)
        .get(`/api/v1/events/${testEventId}`)
        .set('x-user-id', studentUser.id)
        .set('x-user-role', 'student');
      expect(resSingle.status).toBe(404);
    });

    it('7. An organizer cannot delete another organizer event (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/events/${otherOrganizerEventId}`)
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('8. An unauthorized student cannot cancel or delete events (403)', async () => {
      // Student tries to cancel
      const cancelRes = await request(app)
        .patch(`/api/v1/events/${testEventId}/cancel`)
        .set('x-user-id', studentUser.id)
        .set('x-user-role', 'student');
      expect(cancelRes.status).toBe(403);

      // Student tries to delete
      const deleteRes = await request(app)
        .delete(`/api/v1/events/${testEventId}`)
        .set('x-user-id', studentUser.id)
        .set('x-user-role', 'student');
      expect(deleteRes.status).toBe(403);
    });

    it('9. Related registrations and ticket codes are preserved after safe deletion', async () => {
      // First, register student
      const regRes = await db.registerForEventAtomic(testEventId, studentUser.id);
      expect(regRes.registration.ticket_code).toBeDefined();
      const ticketCode = regRes.registration.ticket_code;

      // Soft-delete the event
      await db.deleteEventSafe(testEventId, organizerUser.id, 'organizer');

      // Verify that user's registration history still preserves the record
      const studentRegs = await db.getUserRegistrations(studentUser.id);
      const foundReg = studentRegs.find(r => r.event_id === testEventId);
      expect(foundReg).toBeDefined();
      expect(foundReg?.ticket_code).toBe(ticketCode);

      // Verify ticket verification remains valid for audit
      const verifyRes = await db.verifyTicket(ticketCode);
      expect(verifyRes.valid).toBe(true);
    });

    it('10. Failed database operations show an error and do not report false success (404)', async () => {
      const res = await request(app)
        .delete('/api/v1/events/invalid-event-id-9999')
        .set('x-user-id', adminUser.id)
        .set('x-user-role', 'admin');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EVENT_NOT_FOUND');
    });

    it('11. Organizer receives in-app notification when admin cancels event', async () => {
      await request(app)
        .patch(`/api/v1/admin/events/${testEventId}/cancel`)
        .set('x-user-id', adminUser.id)
        .set('x-user-role', 'admin')
        .send({ reason: 'Official hall conflict' });

      // Check organizer notifications
      const notifRes = await request(app)
        .get('/api/v1/me/notifications')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');

      expect(notifRes.status).toBe(200);
      expect(notifRes.body.success).toBe(true);
      const notif = notifRes.body.data.find((n: any) => n.event_id === testEventId);
      expect(notif).toBeDefined();
      expect(notif.type).toBe('event_cancelled');
      expect(notif.message).toContain('Official hall conflict');
    });

    it('12. Existing event editing and creation functionality still works', async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/events/${testEventId}`)
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer')
        .send({ venue: 'UB Main Auditorium Hall 101' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.venue).toBe('UB Main Auditorium Hall 101');
    });
  });

  // 10. Super Admin Configuration & Security Governance
  describe('Super Admin Governance & Authorization', () => {
    it('1. GET /api/v1/admin/super-admin returns designated SRMIST super admin status', async () => {
      const res = await request(app)
        .get('/api/v1/admin/super-admin')
        .set('x-user-id', adminUser.id)
        .set('x-user-role', 'admin')
        .set('x-user-email', adminUser.email);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.designated_email).toBe('admin@srmist.edu.in');
      expect(res.body.data.is_configured).toBe(true);
      expect(res.body.data.super_admin.full_name).toBe('SRMIST');
      expect(res.body.data.super_admin.email).toBe('admin@srmist.edu.in');
      expect(res.body.data.super_admin.role).toBe('admin');
      expect(res.body.data.admin_count).toBe(1);
      expect(res.body.data.has_conflict).toBe(false);
    });

    it('2. Blocks unauthorized student and organizer access to super-admin status (403)', async () => {
      const studentRes = await request(app)
        .get('/api/v1/admin/super-admin')
        .set('x-user-id', studentUser.id)
        .set('x-user-role', 'student');
      expect(studentRes.status).toBe(403);
      expect(studentRes.body.error.code).toBe('FORBIDDEN');

      const organizerRes = await request(app)
        .get('/api/v1/admin/super-admin')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');
      expect(organizerRes.status).toBe(403);
      expect(organizerRes.body.error.code).toBe('FORBIDDEN');
    });

    it('3. Prevents unauthorized role spoofing: non-admin cannot pass x-user-role: admin without designated credentials', async () => {
      const spoofRes = await request(app)
        .get('/api/v1/admin/super-admin')
        .set('x-user-id', studentUser.id)
        .set('x-user-role', 'admin')
        .set('x-user-email', 'spoofed@student.srmist.edu.in');

      expect(spoofRes.status).toBe(403);
      expect(spoofRes.body.error.code).toBe('FORBIDDEN');
    });

    it('4. Allows super admin to view campus organizers with event metrics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/organizers')
        .set('x-user-id', adminUser.id)
        .set('x-user-role', 'admin')
        .set('x-user-email', adminUser.email);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('event_count');
      expect(res.body.data[0]).toHaveProperty('role', 'organizer');
    });

    it('5. Allows super admin to update organizer details while preventing elevation to admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/organizers/${organizerUser.id}`)
        .set('x-user-id', adminUser.id)
        .set('x-user-role', 'admin')
        .set('x-user-email', adminUser.email)
        .send({
          full_name: 'ACM Student Chapter SRMIST - Verified',
          section: 'School of Computing',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.full_name).toBe('ACM Student Chapter SRMIST - Verified');
      expect(res.body.data.role).toBe('organizer');
    });

    it('6. Allows super admin to inspect event attendees and ticket codes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/events/10000000-0000-0000-0000-000000000001/attendees')
        .set('x-user-id', adminUser.id)
        .set('x-user-role', 'admin')
        .set('x-user-email', adminUser.email);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.summary).toBeDefined();
    });

    it('7. Ordinary student signup cannot assign role: admin', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          full_name: 'Elevated Rogue User',
          registration_number: 'RA2311003010999',
          email: 'rogue.elevation@student.srmist.edu.in',
          section: 'CSE-X',
          password: 'Password123!',
          role: 'admin',
        });

      // Even if role: admin is sent in payload, role must be 'student'
      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('student');
    });
  });

  // 11. Organizer Event Creation & 12 Required Fields Validation
  describe('Organizer Event Creation & 12 Required Fields', () => {
    it('1. GET /api/v1/events/meta/organizations returns centrally managed approved organizations', async () => {
      const res = await request(app).get('/api/v1/events/meta/organizations');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((o: any) => o.name === 'ACM Student Chapter')).toBe(true);
      expect(res.body.data.some((o: any) => o.name === 'SRMIST')).toBe(true);
      expect(res.body.data.some((o: any) => o.name === 'Robotics/IoT Club')).toBe(true);
    });

    it('2. GET /api/v1/events/meta/types returns supported event types', async () => {
      const res = await request(app).get('/api/v1/events/meta/types');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((t: any) => t.id === 'hackathon')).toBe(true);
      expect(res.body.data.some((t: any) => t.id === 'workshop')).toBe(true);
    });

    it('3. Successfully creates a campus event with all 12 required fields connected', async () => {
      const startTime = new Date(Date.now() + 86400000 * 7).toISOString();
      const endTime = new Date(Date.now() + 86400000 * 7 + 14400000).toISOString();
      const deadline = new Date(Date.now() + 86400000 * 6).toISOString();

      const payload = {
        title: 'SRMIST Quantum Computing Hackathon 2026',
        event_type: 'hackathon',
        category: 'Hackathons',
        capacity: 100,
        organization: 'ACM Student Chapter',
        organization_id: 'acm-student-chapter',
        venue: 'Tech Park Auditorium Hall 1',
        start_time: startTime,
        end_time: endTime,
        registration_deadline: deadline,
        banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        description: 'Explore quantum algorithms, Qiskit frameworks, and quantum circuit simulations with industry mentors.',
        instructions: 'Bring your laptop with Python 3.11 installed. Valid college ID card required at entry.',
      };

      const res = await request(app)
        .post('/api/v1/events')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.event_type).toBe('hackathon');
      expect(res.body.data.organization).toBe('ACM Student Chapter');
      expect(res.body.data.organization_id).toBe('acm-student-chapter');
      expect(res.body.data.organizer_id).toBe(organizerUser.id);
      expect(res.body.data.capacity).toBe(100);
      expect(res.body.data.remaining_capacity).toBe(100);
      expect(res.body.data.registered_count).toBe(0);
      expect(res.body.data.instructions).toBe(payload.instructions);

      // Verify immediately retrievable via public event listing
      const fetchRes = await request(app).get(`/api/v1/events/${res.body.data.id}`);
      expect(fetchRes.status).toBe(200);
      expect(fetchRes.body.data.title).toBe(payload.title);
    });

    it('4. Rejects event creation when attendee instructions are missing (400)', async () => {
      const startTime = new Date(Date.now() + 86400000 * 7).toISOString();
      const endTime = new Date(Date.now() + 86400000 * 7 + 14400000).toISOString();
      const deadline = new Date(Date.now() + 86400000 * 6).toISOString();

      const payload = {
        title: 'Missing Instructions Workshop',
        event_type: 'workshop',
        category: 'Workshops',
        capacity: 50,
        organization: 'CSE',
        organization_id: 'dept-cse',
        venue: 'UB 301',
        start_time: startTime,
        end_time: endTime,
        registration_deadline: deadline,
        banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        description: 'Hands-on code session without instructions provided.',
        // instructions missing
      };

      const res = await request(app)
        .post('/api/v1/events')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('5. Rejects event creation when end time is before or equal to start time (400)', async () => {
      const startTime = new Date(Date.now() + 86400000 * 5).toISOString();
      const invalidEndTime = new Date(Date.now() + 86400000 * 4).toISOString(); // Before start
      const deadline = new Date(Date.now() + 86400000 * 3).toISOString();

      const payload = {
        title: 'Invalid End Date Event',
        event_type: 'seminar',
        category: 'Talks',
        capacity: 40,
        organization: 'SRMIST',
        venue: 'Mini Hall 2',
        start_time: startTime,
        end_time: invalidEndTime,
        registration_deadline: deadline,
        banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        description: 'Testing invalid chronology validation on event end time.',
        instructions: 'Please bring your student ID.',
      };

      const res = await request(app)
        .post('/api/v1/events')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('6. Rejects event creation when registration deadline is after event start time (400)', async () => {
      const startTime = new Date(Date.now() + 86400000 * 5).toISOString();
      const endTime = new Date(Date.now() + 86400000 * 5 + 14400000).toISOString();
      const invalidDeadline = new Date(Date.now() + 86400000 * 6).toISOString(); // After start!

      const payload = {
        title: 'Invalid Deadline Event',
        event_type: 'workshop',
        category: 'Workshops',
        capacity: 40,
        organization: 'SRMIST',
        venue: 'Mini Hall 2',
        start_time: startTime,
        end_time: endTime,
        registration_deadline: invalidDeadline,
        banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        description: 'Testing invalid deadline chronology validation.',
        instructions: 'Please bring your student ID.',
      };

      const res = await request(app)
        .post('/api/v1/events')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('7. Rejects negative or zero seat capacity (400)', async () => {
      const startTime = new Date(Date.now() + 86400000 * 5).toISOString();
      const endTime = new Date(Date.now() + 86400000 * 5 + 14400000).toISOString();
      const deadline = new Date(Date.now() + 86400000 * 4).toISOString();

      const payload = {
        title: 'Zero Capacity Event',
        event_type: 'sports',
        category: 'Sports',
        capacity: 0, // Invalid!
        organization: 'Sports Club',
        venue: 'Court 1',
        start_time: startTime,
        end_time: endTime,
        registration_deadline: deadline,
        banner_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
        description: 'Testing zero capacity rejection rule on creation.',
        instructions: 'Please bring non-marking sneakers.',
      };

      const res = await request(app)
        .post('/api/v1/events')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('8. Rejects invalid banner URL (400)', async () => {
      const startTime = new Date(Date.now() + 86400000 * 5).toISOString();
      const endTime = new Date(Date.now() + 86400000 * 5 + 14400000).toISOString();
      const deadline = new Date(Date.now() + 86400000 * 4).toISOString();

      const payload = {
        title: 'Invalid Image Link Event',
        event_type: 'seminar',
        category: 'Talks',
        capacity: 50,
        organization: 'CSE',
        venue: 'Tech Park Auditorium',
        start_time: startTime,
        end_time: endTime,
        registration_deadline: deadline,
        banner_url: 'not-a-valid-http-url', // Invalid
        description: 'Testing invalid image url format rejection.',
        instructions: 'Please bring your notebooks.',
      };

      const res = await request(app)
        .post('/api/v1/events')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // 12. Organizer Professional Upgrade: Overview Velocity, Duplication & Announcements
  describe('12. Organizer Professional Upgrade & Workspace', () => {
    let duplicatedEventId: string;

    it('1. GET /api/v1/organizer/overview returns rich metrics, trends, and category distribution', async () => {
      const res = await request(app)
        .get('/api/v1/organizer/overview')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('total_events');
      expect(data).toHaveProperty('published_events');
      expect(data).toHaveProperty('upcoming_events');
      expect(data).toHaveProperty('draft_events');
      expect(data).toHaveProperty('completed_events');
      expect(data).toHaveProperty('cancelled_events');
      expect(data).toHaveProperty('total_registrations');
      expect(data).toHaveProperty('total_capacity');
      expect(data).toHaveProperty('total_remaining_seats');
      expect(data).toHaveProperty('overall_attendance_rate');
      expect(data).toHaveProperty('attended_count');
      expect(Array.isArray(data.registration_trends)).toBe(true);
      expect(data.registration_trends.length).toBe(7);
      expect(typeof data.category_distribution).toBe('object');
    });

    it('2. POST /api/v1/events/:id/duplicate duplicates an event as a draft', async () => {
      // Find an event owned by organizerUser
      const eventsRes = await request(app)
        .get('/api/v1/organizer/events')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');

      const targetEvent = eventsRes.body.data[0];
      expect(targetEvent).toBeDefined();

      const dupRes = await request(app)
        .post(`/api/v1/events/${targetEvent.id}/duplicate`)
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');

      expect(dupRes.status).toBe(201);
      expect(dupRes.body.success).toBe(true);
      expect(dupRes.body.data.title).toContain('(Copy)');
      expect(dupRes.body.data.status).toBe('draft');
      expect(dupRes.body.data.registered_count).toBe(0);
      duplicatedEventId = dupRes.body.data.id;
    });

    it('3. POST /api/v1/events/:id/duplicate rejects unauthorized duplication of another organizer event (403)', async () => {
      // Try to duplicate with a different user
      const otherOrganizerId = '00000000-0000-0000-0000-000000000003';
      const dupRes = await request(app)
        .post(`/api/v1/events/${duplicatedEventId}/duplicate`)
        .set('x-user-id', otherOrganizerId)
        .set('x-user-role', 'organizer');

      expect(dupRes.status).toBe(403);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.error.code).toBe('FORBIDDEN');
    });

    it('4. POST /api/v1/events/:id/announcements broadcasts message to registered attendees', async () => {
      // Find an event with registrations
      const eventsRes = await request(app)
        .get('/api/v1/organizer/events')
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer');

      const targetEvent = eventsRes.body.data.find((e: any) => e.status === 'published') || eventsRes.body.data[0];

      const announceRes = await request(app)
        .post(`/api/v1/events/${targetEvent.id}/announcements`)
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer')
        .send({
          title: 'Room Number Update',
          message: 'The session has been moved to TP-402 due to increased attendance quotas.',
        });

      expect(announceRes.status).toBe(201);
      expect(announceRes.body.success).toBe(true);
      expect(announceRes.body.data).toHaveProperty('sent_to');
      expect(announceRes.body.data.event_title).toBe(targetEvent.title);
    });

    it('5. POST /api/v1/events/:id/announcements validates required title and message (400)', async () => {
      const announceRes = await request(app)
        .post(`/api/v1/events/${duplicatedEventId}/announcements`)
        .set('x-user-id', organizerUser.id)
        .set('x-user-role', 'organizer')
        .send({
          title: '',
          message: '',
        });

      expect(announceRes.status).toBe(400);
      expect(announceRes.body.success).toBe(false);
      expect(announceRes.body.error.code).toBe('INVALID_ANNOUNCEMENT');
    });
  });

  // 14. 1Kampus Authentication, Password Verification & RBAC Enforcement
  describe('1Kampus Authentication, Password Verification & RBAC Enforcement', () => {
    const studentCredentials = {
      full_name: 'Harish Kalyan',
      registration_number: 'RA2311003010777',
      email: 'harish.k@student.srmist.edu.in',
      section: 'CSE-C',
      password: 'MySecretPassword#2026',
    };

    let studentSessionToken: string;

    it('1. Student registration with password hashes password, stores credentials, and returns signed session token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send(studentCredentials);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(studentCredentials.email);
      expect(res.body.data.user.role).toBe('student');
      // Critical security check: Password MUST NEVER be in profile or response
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.salt).toBeUndefined();
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.token.startsWith('CC_SESSION_')).toBe(true);
    });

    it('2. Prevents duplicate email registration (409 DUPLICATE_RECORD)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...studentCredentials,
          registration_number: 'RA2311003010888', // different reg, same email
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_RECORD');
    });

    it('3. Prevents duplicate registration number registration (409 DUPLICATE_RECORD)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...studentCredentials,
          email: 'unique.different@student.srmist.edu.in', // different email, same reg
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_RECORD');
    });

    it('4. Student login with correct password succeeds and returns cryptographically signed session token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: studentCredentials.email,
          password: studentCredentials.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(studentCredentials.email);
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.token.startsWith('CC_SESSION_')).toBe(true);
      // Save token for subsequent authorization tests
      studentSessionToken = res.body.data.token;
    });

    it('5. Student login with incorrect password is rejected (401 INVALID_CREDENTIALS)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: studentCredentials.email,
          password: 'IncorrectPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toContain('Invalid email or password');
    });

    it('6. Student login with non-existent email is rejected (401 INVALID_CREDENTIALS)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent.user@srmist.edu.in',
          password: 'AnyPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('7. Authenticated student is denied access to organizer dashboard (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .get('/api/v1/organizer/overview')
        .set('Authorization', `Bearer ${studentSessionToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('8. Authenticated student is denied access to Super Admin console (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${studentSessionToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('9. Client attempting to forge role via headers without authorization token is rejected (401/403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('x-user-id', 'rogue-attacker-id')
        .set('x-user-role', 'admin');

      // Middleware must not grant admin privileges to rogue headers
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('10. Pre-authorized organizer authenticates with password and accesses organizer features', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'acm@srmist.edu.in',
          password: 'Organizer@1Kampus2026!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.user.role).toBe('organizer');

      const orgToken = loginRes.body.data.token;

      // Access organizer overview with valid token
      const overviewRes = await request(app)
        .get('/api/v1/organizer/overview')
        .set('Authorization', `Bearer ${orgToken}`);

      expect(overviewRes.status).toBe(200);
      expect(overviewRes.body.success).toBe(true);
      expect(overviewRes.body.data).toHaveProperty('total_events');
    });

    it('11. Designated Super Admin (admin@srmist.edu.in) authenticates and accesses admin console', async () => {
      const adminPass = process.env.SUPER_ADMIN_PASSWORD || 'Admin@1Kampus2026!';
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@srmist.edu.in',
          password: adminPass,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.user.email).toBe('admin@srmist.edu.in');
      expect(loginRes.body.data.user.role).toBe('admin');
      expect(loginRes.body.data.user.full_name).toBe('SRMIST');

      const adminToken = loginRes.body.data.token;

      // Access Super Admin overview
      const adminRes = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.data).toHaveProperty('total_users');
    });

    it('12. Protected API routes reject unauthenticated requests without token (401 UNAUTHORIZED)', async () => {
      const res = await request(app).get('/api/v1/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('13. Authenticated session fetches verified profile via GET /api/v1/me', async () => {
      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${studentSessionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(studentCredentials.email);
      expect(res.body.data.full_name).toBe(studentCredentials.full_name);
    });

    it('14. POST /api/v1/auth/logout succeeds and confirms sign out', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Signed out successfully');
    });

    it('15. API returns JSON format with application/json header, never HTML', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body.data.service).toBe('1Kampus API');
    });
  });

  // ==========================================================================
  // ORGANIZER REGISTRATION & APPROVAL WORKFLOW TESTS
  // ==========================================================================
  describe('Organizer Registration & Approval Workflow (Super Admin RBAC)', () => {
    const testApplicant = {
      full_name: 'Aditya Rao',
      email: 'aditya.rao@srmist.edu.in',
      employee_id: 'ORG-EMP-9901',
      club_name: 'SRM Developer Student Club',
      position: 'Technical Lead',
      password: 'StrongOrganizerPass2026!',
      confirm_password: 'StrongOrganizerPass2026!',
      reason: 'We require organizer access to host developer hackathons and workshops for campus students.',
    };

    let createdApplicationId: string;
    let applicantToken: string;

    it('1. Successfully submits organizer application with PENDING status (POST /api/v1/organizer/apply)', async () => {
      const res = await request(app)
        .post('/api/v1/organizer/apply')
        .send(testApplicant);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Your organizer application is pending admin approval.');
      expect(res.body.data.application.status).toBe('pending');
      expect(res.body.data.application.club_name).toBe(testApplicant.club_name);
      expect(res.body.data.application.employee_id).toBe(testApplicant.employee_id);
      expect(res.body.data.user.approval_status).toBe('pending');
      expect(res.body.data.token).toBeDefined();

      createdApplicationId = res.body.data.application.id;
      applicantToken = res.body.data.token;
    });

    it('2. Prevents duplicate application submission for the same email or ID (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/organizer/apply')
        .send(testApplicant);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_APPLICATION');
    });

    it('3. Pending applicant can check application review status (GET /api/v1/organizer/application-status)', async () => {
      const res = await request(app)
        .get('/api/v1/organizer/application-status')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.application.id).toBe(createdApplicationId);
    });

    it('4. Pending applicant is denied event creation (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          title: 'Unauthorized Hackathon by Pending Organizer',
          event_type: 'hackathon',
          category: 'Hackathons',
          organization: 'SRM Developer Student Club',
          capacity: 100,
          venue: 'Tech Park Mini Hall',
          start_time: new Date(Date.now() + 5 * 86400000).toISOString(),
          end_time: new Date(Date.now() + 6 * 86400000).toISOString(),
          registration_deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
          banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
          description: 'A test event created by a pending applicant that should be rejected.',
          instructions: 'Bring your laptop.',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toMatch(/FORBIDDEN/);
    });

    it('5. Super Admin overview reports pending organizer applications count and creates in-app notification', async () => {
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@srmist.edu.in',
          password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@1Kampus2026!',
        });
      const superAdminToken = adminLogin.body.data.token;

      const ovRes = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(ovRes.status).toBe(200);
      expect(ovRes.body.data.pending_applications_count).toBeGreaterThanOrEqual(1);

      const notifRes = await request(app)
        .get('/api/v1/me/notifications')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(notifRes.status).toBe(200);
      const appNotif = notifRes.body.data.find((n: any) => n.type === 'organizer_application');
      expect(appNotif).toBeDefined();
      expect(appNotif.message).toContain(testApplicant.full_name);
    });

    it('6. Super Admin lists all organizer applications (GET /api/v1/admin/organizer-applications)', async () => {
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@srmist.edu.in',
          password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@1Kampus2026!',
        });
      const superAdminToken = adminLogin.body.data.token;

      const res = await request(app)
        .get('/api/v1/admin/organizer-applications')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pending_count).toBeGreaterThanOrEqual(1);
      const found = res.body.data.find((a: any) => a.id === createdApplicationId);
      expect(found).toBeDefined();
      expect(found.full_name).toBe(testApplicant.full_name);
    });

    it('7. Non-admin cannot approve applications (403 Forbidden)', async () => {
      const orgLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'acm@srmist.edu.in',
          password: 'Organizer@1Kampus2026!',
        });
      const orgToken = orgLogin.body.data.token;

      const res = await request(app)
        .post(`/api/v1/admin/organizer-applications/${createdApplicationId}/approve`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toMatch(/FORBIDDEN/);
    });

    it('8. Super Admin approves organizer application (POST /api/v1/admin/organizer-applications/:id/approve)', async () => {
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@srmist.edu.in',
          password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@1Kampus2026!',
        });
      const superAdminToken = adminLogin.body.data.token;

      const res = await request(app)
        .post(`/api/v1/admin/organizer-applications/${createdApplicationId}/approve`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application.status).toBe('approved');
      expect(res.body.data.application.reviewed_by).toBe('admin@srmist.edu.in');
      expect(res.body.data.user.role).toBe('organizer');
      expect(res.body.data.user.approval_status).toBe('approved');
    });

    it('9. Newly approved organizer can now create and publish events', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testApplicant.email,
          password: testApplicant.password,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.role).toBe('organizer');
      expect(loginRes.body.data.user.approval_status).toBe('approved');
      const approvedToken = loginRes.body.data.token;

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${approvedToken}`)
        .send({
          title: 'SRM Developer Club Flagship Sprint 2026',
          event_type: 'hackathon',
          category: 'Hackathons',
          organization: testApplicant.club_name,
          capacity: 80,
          venue: 'TP Ganesan Hall 2',
          start_time: new Date(Date.now() + 5 * 86400000).toISOString(),
          end_time: new Date(Date.now() + 6 * 86400000).toISOString(),
          registration_deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
          banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
          description: 'Official flagship hackathon hosted by approved organizer.',
          instructions: 'Bring student ID card and laptops.',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.title).toBe('SRM Developer Club Flagship Sprint 2026');
    });

    it('10. Super Admin can revoke organizer access later and applicant is again denied event creation', async () => {
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@srmist.edu.in',
          password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@1Kampus2026!',
        });
      const superAdminToken = adminLogin.body.data.token;

      const profile = await db.getProfileByEmail(testApplicant.email);
      expect(profile).toBeDefined();

      const revokeRes = await request(app)
        .post(`/api/v1/admin/organizers/${profile!.id}/revoke`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Club convenor tenure concluded.' });

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.success).toBe(true);
      expect(revokeRes.body.data.role).toBe('student');
      expect(revokeRes.body.data.approval_status).toBe('suspended');

      const loginAgain = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testApplicant.email,
          password: testApplicant.password,
        });
      const revokedToken = loginAgain.body.data.token;

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${revokedToken}`)
        .send({
          title: 'Denied Post-Revocation Event',
          event_type: 'workshop',
          category: 'Workshops',
          organization: testApplicant.club_name,
          capacity: 40,
          venue: 'UB 301',
          start_time: new Date(Date.now() + 5 * 86400000).toISOString(),
          end_time: new Date(Date.now() + 6 * 86400000).toISOString(),
          registration_deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
          banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
          description: 'Should be denied because permissions were suspended.',
          instructions: 'Bring your laptop.',
        });

      expect(createRes.status).toBe(403);
      expect(createRes.body.success).toBe(false);
    });

    it('11. Rejection workflow: Submits second application and Super Admin rejects with reason', async () => {
      const secondApplicant = {
        full_name: 'Varun K',
        email: 'varun.k@srmist.edu.in',
        employee_id: 'ORG-EMP-9902',
        club_name: 'Gaming Club',
        position: 'Coordinator',
        password: 'StrongOrganizerPass2026!',
        confirm_password: 'StrongOrganizerPass2026!',
        reason: 'We want to organize esports tournament.',
      };

      const applyRes = await request(app)
        .post('/api/v1/organizer/apply')
        .send(secondApplicant);

      expect(applyRes.status).toBe(201);
      const secondAppId = applyRes.body.data.application.id;

      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@srmist.edu.in',
          password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@1Kampus2026!',
        });
      const superAdminToken = adminLogin.body.data.token;

      const rejectRes = await request(app)
        .post(`/api/v1/admin/organizer-applications/${secondAppId}/reject`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Club is not recognized in current academic semester.' });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.success).toBe(true);
      expect(rejectRes.body.data.application.status).toBe('rejected');
      expect(rejectRes.body.data.application.rejection_reason).toBe('Club is not recognized in current academic semester.');
      expect(rejectRes.body.data.user.approval_status).toBe('rejected');
    });

    it('12. Student registration and event ticket registration continue to function flawlessly', async () => {
      const newStudentEmail = `student.test.${Date.now()}@student.srmist.edu.in`;
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          full_name: 'Workflow Verification Student',
          registration_number: `RA${Date.now().toString().slice(-10)}`,
          email: newStudentEmail,
          section: 'CSE-A',
          password: 'StudentPass123!',
        });

      expect(signupRes.status).toBe(201);
      expect(signupRes.body.success).toBe(true);
      const studentToken = signupRes.body.data.token;

      const regRes = await request(app)
        .post('/api/v1/events/10000000-0000-0000-0000-000000000001/register')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(regRes.status).toBe(201);
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.data.registration_status).toBe('confirmed');
      expect(regRes.body.data.ticket_code).toBeDefined();
    });
  });
});
