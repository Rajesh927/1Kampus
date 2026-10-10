# 1Kampus — REST API Specification (`/api/v1`)

The 1Kampus API is a versioned RESTful interface built with Express, TypeScript, and Zod.

## Base URL
- Development: `http://localhost:5000/api/v1`
- Production: `https://your-api-domain.com/api/v1`

---

## 1. System & Health
### `GET /health`
Returns runtime status and database engine metadata.

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-10-10T00:42:00.000Z",
    "service": "1Kampus API",
    "version": "1.0.0",
    "database": "Supabase PostgreSQL"
  }
}
```

---

## 2. Authentication & User Profile
### `GET /me`
Retrieves authenticated user's profile.
- **Headers**: `Authorization: Bearer <token>` or `x-user-id: <id>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-0000-0000-000000000010",
    "full_name": "Alex Chen",
    "email": "alex.chen@student.srmist.edu.in",
    "role": "student",
    "avatar_url": "https://images.unsplash.com/...",
    "created_at": "2026-09-10T00:00:00.000Z",
    "updated_at": "2026-10-10T00:00:00.000Z"
  }
}
```

### `PATCH /me`
Updates user's full name or avatar image URL.
- **Request Body**:
```json
{
  "full_name": "Alexander Chen",
  "avatar_url": "https://images.unsplash.com/new-avatar"
}
```

### `POST /auth/dev-login`
Quick persona login for instant reviewer testing.
- **Request Body**:
```json
{
  "role": "student",
  "email": "alex.chen@student.srmist.edu.in"
}
```

---

## 3. Events
### `GET /events`
Publicly search, filter, and paginate published campus events.
- **Query Parameters**:
  - `search`: Case-insensitive keyword filter (title, description, venue, organizer).
  - `category`: 'Technology' | 'Hackathons' | 'Workshops' | 'Cultural' | 'Entrepreneurship' | 'Sports' | 'Talks'.
  - `timeFilter`: 'upcoming' | 'past' | 'all'.
  - `sortBy`: 'date_asc' | 'date_desc' | 'created_desc'.
  - `page`: Page index (default: 1).
  - `limit`: Events per page (default: 12).
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "10000000-0000-0000-0000-000000000001",
      "title": "Hack SRM 2026: 36-Hour National Flagship Hackathon",
      "slug": "hack-srm-2026",
      "category": "Hackathons",
      "venue": "TP Ganesan Mini Hall 1",
      "start_time": "2026-10-22T09:00:00.000Z",
      "end_time": "2026-10-24T18:00:00.000Z",
      "registration_deadline": "2026-10-20T23:59:59.000Z",
      "capacity": 120,
      "registered_count": 48,
      "remaining_capacity": 72,
      "is_full": false,
      "is_registered_by_user": false,
      "status": "published"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 10,
    "total_pages": 1
  }
}
```

### `GET /events/:id`
Retrieves event details by UUID or human-readable slug.

### `POST /events`
Creates a new event (Requires `organizer` or `admin` role).

### `PATCH /events/:id`
Updates an existing event (Requires owner `organizer` or `admin` role).

### `DELETE /events/:id`
Deletes an event and cascades to registrations (Requires owner `organizer` or `admin`).

---

## 4. Registrations & Capacity Management
### `POST /events/:id/register`
Concurrency-safe atomic student seat reservation.
- **Headers**: `Authorization: Bearer <token>`
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "id": "20000000-0000-0000-0000-000000000001",
    "user_id": "00000000-0000-0000-0000-000000000010",
    "event_id": "10000000-0000-0000-0000-000000000001",
    "registration_status": "confirmed",
    "ticket_code": "CC-HACK-7F3A91",
    "registered_at": "2026-10-10T00:45:00.000Z",
    "attendance_status": "unmarked"
  },
  "message": "Successfully registered for event! Your ticket code has been generated.",
  "meta": {
    "remaining_capacity": 71
  }
}
```
- **Error Codes**:
  - `401 UNAUTHORIZED`: Student must be logged in.
  - `409 DUPLICATE_REGISTRATION`: Student already holds an active seat.
  - `409 EVENT_FULL`: Event has reached maximum capacity.
  - `400 DEADLINE_PASSED`: Registration deadline has passed.

### `DELETE /registrations/:id`
Cancels student's active registration and releases the seat.
- **Headers**: `Authorization: Bearer <token>`
- **Error Codes**:
  - `403 FORBIDDEN`: Attempting to cancel another student's ticket.

### `GET /me/registrations`
Lists all active and past registrations for the authenticated student.

### `GET /events/:id/registrations`
Fetches participant roster for a specific event (Organizer/Admin only).

### `PATCH /registrations/:id/attendance`
Updates attendance check-in status (`unmarked` | `attended` | `absent`).

### `POST /registrations/verify-ticket`
Check-in verification for ticket codes scanned at the venue entrance.
- **Request Body**: `{ "ticket_code": "CC-HACK-7F3A91" }`
- **Response `200 OK`**: Returns valid registration and attendee details.

---

## 5. Organizer & Admin Telemetry
### `GET /organizer/overview`
Metrics summary: Total events, upcoming events, total registrations, attendance rate.

### `GET /admin/overview`
Platform telemetry: Total users, total events, total registrations, category breakdown.
