# 1Kampus — QA & Automated Testing Strategy

1Kampus features comprehensive end-to-end automated testing across critical business rules, role-based authorization, and edge cases.

---

## 1. Running Tests Locally

### Backend Unit & Integration Tests (Vitest & Supertest)
```bash
# Run all backend tests
npm run test --workspace=apps/api

# Run in watch mode during development
npm run test:watch --workspace=apps/api
```

### TypeScript Type Checking
```bash
# Typecheck both frontend and backend
npm run typecheck
```

### Production Build Verification
```bash
# Build both frontend and backend bundles
npm run build
```

---

## 2. Tested Business Scenarios Matrix

| Scenario | Expected Result | Verified In Tests |
| :--- | :--- | :---: |
| **Public Event Listing** | Returns published events with category filters and pagination | ✅ `api.test.ts` |
| **Event Details by Slug/ID** | Returns event metadata + remaining capacity computation | ✅ `api.test.ts` |
| **Unauthenticated Registration** | Rejects with `401 UNAUTHORIZED` | ✅ `api.test.ts` |
| **Valid Student Registration** | Creates confirmed registration with unique `CC-` ticket code | ✅ `api.test.ts` |
| **Duplicate Registration Attempt** | Rejects with `409 DUPLICATE_REGISTRATION` | ✅ `api.test.ts` |
| **Capacity Enforcement** | Rejects registration when capacity is full (`409 EVENT_FULL`) | ✅ `api.test.ts` |
| **Registration Cancellation** | Frees seat and updates status to `cancelled` | ✅ `api.test.ts` |
| **Unauthorized Cancellation** | Rejects cancelling another student's ticket with `403 FORBIDDEN` | ✅ `api.test.ts` |
| **Student Accessing Organizer APIs** | Rejects with `403 FORBIDDEN` | ✅ `api.test.ts` |
| **Organizer Overview Metrics** | Computes active events, registrations, and attendance rates | ✅ `api.test.ts` |
| **Admin Platform Governance** | Allows admin moderation and rejects non-admin access | ✅ `api.test.ts` |

---

## 3. Concurrency & High Load Verification
To test simultaneous student registration requests against the last available seat:
1. `SELECT ... FOR UPDATE` acquires an exclusive lock on the event record.
2. The registration count is evaluated inside the atomic transaction block.
3. If 50 simultaneous requests hit the final seat, exactly 1 succeeds (`201 Created`) and 49 receive (`409 EVENT_FULL`).
