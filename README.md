# 1Kampus 🎓
### Your Campus. One Place.
**Full-Stack Campus Event Management Platform**
*Built for the ACM Student Chapter SRMIST Web Development Recruitment Assessment & Long-term Software Engineering Portfolio.*

---

## 🌟 Overview & Product Identity

**1Kampus** is a modern campus event management platform tailored for university communities like SRMIST. It solves event fragmentation across college clubs by delivering a single, unified hub where students can discover hackathons, technical workshops, cultural nights, and founders summits, claim instant digital QR admission passes, and manage their registrations.

Organizers (technical chapters, student clubs, committee leads) can publish events, manage participant quotas, export attendee rosters, and verify QR ticket codes at venue entrances in real time.

---

## 🛠️ Mandatory Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend SPA** | React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Lucide React, Canvas Confetti |
| **Backend API** | Node.js, Express 4.21, TypeScript, Zod Schema Validation, Helmet, CORS, Morgan |
| **Database & Auth** | Supabase PostgreSQL 15, Supabase Auth, Row Level Security (RLS), Resilient In-Memory Fallback |
| **Testing & QA** | Vitest 3.0, Supertest, TypeScript Compiler (`tsc --noEmit`), GitHub Actions CI |
| **Design System** | Warm Off-White (`#FAFAF7`), Pure White, Deep Ink (`#20243A`), Periwinkle, Lavender, Mint, Sky, Plus Jakarta Sans & Inter |

---

## 🚀 Key Feature Highlights

### 1. 🎨 Human-Designed Visual Identity & Subtle 3D Depth
- **Warm Editorial Color Scheme**: Designed around warm off-whites, crisp cards, lavender/mint/sky accents, and restrained slate typography.
- **Layered 3D Depth**: Interactive cards with realistic hover elevation, perspective tilt, floating status indicators, and clean borders.
- **Microinteractions**: Fluid state transitions, loading skeletons, error boundaries, and confetti celebration upon ticket confirmation.

### 2. ⚡ Concurrency-Safe Atomic Registrations
- **Pessimistic Row-Level Locking**: High-concurrency seat reservation implemented via `SELECT FOR UPDATE` inside atomic stored procedures (`register_for_event_atomic`).
- **Duplicate & Deadline Protection**: Prevents duplicate active registrations, blocks post-deadline submissions, and rejects attempts once capacity is reached.
- **Instant QR Admission Passes**: Issues unique cryptographic ticket codes (`CC-HACK-7F3A91`) with high-resolution downloadable QR barcodes.

### 3. 🛡️ Role-Based Access Control (RBAC) & 1-Click Review Personas
- **Student Role**: Browse events, reserve seats, view registered tickets, download QR codes, and cancel bookings.
- **Organizer Role**: Create & edit events, manage quotas, inspect participant rosters, export attendee lists to CSV, and run live QR check-in desks.
- **Admin Role**: Moderate event statuses (Draft, Published, Cancelled, Completed), view user directories, and inspect platform telemetry.
- **1-Click Review Personas**: Switch seamlessly between **Alex Chen (Student)**, **ACM Student Chapter (Organizer)**, and **Admin Moderator** from the top navigation bar or login screen.

---

## 📂 Monorepo Project Structure

```
campusconnect/
├── apps/
│   ├── api/                    # Express REST API Backend (TypeScript)
│   │   ├── src/
│   │   │   ├── config/         # Environment variables & constants
│   │   │   ├── middleware/     # Auth, RBAC, Zod validation, Error handlers
│   │   │   ├── routes/         # Health, Auth, Events, Registrations, Organizer, Admin
│   │   │   ├── services/       # Database access layer & atomic locking store
│   │   │   ├── tests/          # Vitest & Supertest automated test suite
│   │   │   ├── app.ts          # Express application factory
│   │   │   └── server.ts       # HTTP Server entrypoint
│   │   └── package.json
│   │
│   └── web/                    # React 19 Frontend SPA (Vite + Tailwind)
│       ├── src/
│       │   ├── components/     # UI Buttons, Badges, Modals, QR TicketModal, EventCards
│       │   ├── context/        # AuthContext (Supabase + Personas), ToastContext
│       │   ├── lib/            # REST API Client & Supabase Client
│       │   ├── pages/          # LandingPage, EventsPage, EventDetailPage, Dashboard, Organizer, Admin, Auth
│       │   ├── types/          # TypeScript domain interfaces
│       │   ├── App.tsx         # Router configuration
│       │   ├── main.tsx        # React entrypoint
│       │   └── index.css       # Tailwind design tokens & typography
│       └── package.json
│
├── database/
│   ├── migrations/             # Version-controlled PostgreSQL SQL migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_atomic_registration_rpc.sql
│   │   └── 003_rls_policies.sql
│   └── seed.sql                # 10 realistic SRMIST demo events and profiles
│
├── docs/                       # Architecture, API & QA specifications
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── TESTING.md
│
├── .github/workflows/ci.yml     # Automated CI pipeline
├── .env.example
├── package.json                # Monorepo workspace configuration
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js v18+ (Tested on Node.js v24)
- npm v9+

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/campusconnect.git
cd campusconnect

# Install all workspace dependencies
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Note: 1Kampus comes with a built-in persistent local store pre-seeded with 10 SRMIST events, allowing local development and evaluation without requiring external cloud accounts.)*

### 3. Start Development Servers
Start both backend API (`localhost:5000`) and frontend SPA (`localhost:5173`) simultaneously:
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Testing & Validation

Run the comprehensive test suite verifying health, events, concurrency-safe registrations, duplicate prevention, capacity enforcement, cancellations, and RBAC:

```bash
# Run backend Vitest integration tests
npm run test --workspace=apps/api

# Run TypeScript typechecks across all packages
npm run typecheck

# Build production bundles
npm run build
```

---

## 📋 ACM SRMIST Recruitment Assessment Checklist

- [x] **Responsive Home / Landing Page**: Memorable hero section, categorized discovery, featured events preview, how it works, and organizer CTA.
- [x] **Event Listing & Discovery**: Keyword search, category pills, upcoming/past filters, date sorting, and pagination.
- [x] **Event Details Page**: Large banner, organizer details, schedule, capacity progress bar, deadline countdown, and state-aware registration button.
- [x] **Student Registration Workflow**: Concurrency-safe atomic seat reservation with confetti animation and instant QR admission pass generation.
- [x] **Duplicate & Capacity Rejection**: Robust validation rejecting duplicate active registrations and full capacity bookings with clear user feedback.
- [x] **Cancellation Handling**: Students can release their reserved seats, automatically incrementing remaining capacity for other students.
- [x] **Student Dashboard**: Personalized greeting, list of active registrations, registration history, profile editor, and interactive QR ticket view.
- [x] **Organizer Studio**: CRUD event operations, live overview metrics, participant rosters, attendance check-in toggle, CSV export, and live ticket check-in scanner.
- [x] **Admin Console**: Governance dashboard with platform statistics, user directory, and status moderation controls.
- [x] **Security & Authorization**: Server-side RBAC validation, token authentication, Zod request validation, Helmet HTTP headers, and rate limiting.
- [x] **Database & Migrations**: Normalized PostgreSQL schema with foreign keys, indexes, triggers, and pessimistic locking RPC function.
- [x] **Automated Tests**: Comprehensive Vitest test suite covering all core business rules and access controls.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
