# CareConnect — Home Services Booking & Operations Platform

A full MERN-stack marketplace for booking home services (appliance repair, cleaning,
electrical work, plumbing, general maintenance). Customers describe a job in plain
language, an AI classification & matching engine routes it to the right verified
providers, and admins/ops/support run the platform end-to-end.

Built for the capstone brief: JWT auth + RBAC, full CRUD across all entities, a
request-to-book workflow, a conflict-free availability engine, AI-assisted request
classification & provider ranking, job tracking with status/notes/attachments,
disputes, notifications, search & filters, analytics, and audit trails.

---

## Tech stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT auth, bcrypt
- **Frontend:** React (Vite), React Router, Tailwind CSS v4, Recharts, Lucide icons
- **AI:** a self-contained, explainable classification/ranking engine
  (`backend/services/aiService.js`) — no external API key required, so the app runs
  fully offline and deterministically for grading/demos.

## Project structure

```
careconnect/
├── backend/          Express API (MVC: models / controllers / routes / services)
│   ├── models/        Mongoose schemas (User, ServiceCategory, ProviderProfile,
│   │                  ServiceRequest, Quote, Booking, Invoice, Review, Dispute,
│   │                  Notification, AuditLog)
│   ├── controllers/    Business logic per resource
│   ├── routes/         Express routers, wired to role-based middleware
│   ├── middleware/     JWT auth, role authorization, centralized error handling
│   ├── services/       aiService.js (classification + ranking), notifications, audit
│   ├── utils/           availability engine, token/error helpers
│   └── seed/seed.js     Realistic demo data across every role & status
└── frontend/          React SPA (role-aware dashboards, live polling UI)
    └── src/
        ├── pages/customer, pages/provider, pages/admin, pages/support, pages/shared
        ├── components/  Layout, NotificationBell, StatusBadge, ui primitives
        ├── context/     Auth + Toast providers
        ├── hooks/       usePoll (live-refreshing data), useNotifications
        └── lib/         axios client + typed endpoint functions
```

## Roles

| Role | Description |
|---|---|
| **Platform Admin** | Manages categories & pricing policies, verifies providers, resolves disputes, manages staff accounts, views the audit log |
| **Operations Manager** | Same operational access as Admin minus staff account creation |
| **Service Provider** | Manages profile/skills/availability, receives AI-matched requests, submits quotes, tracks jobs |
| **Customer** | Submits service requests, reviews AI-classified category & quotes, books, tracks jobs, reviews providers, opens disputes |
| **Support Agent** | Works the dispute queue: investigates, messages both parties, resolves with refund/reschedule/warning/suspension actions |

## Getting started

### 1. Backend

```bash
cd backend
cp .env.example .env      # edit MONGODB_URI / JWT_SECRET as needed
npm install
npm run seed               # populates realistic demo data (see credentials below)
npm run dev                 # starts the API on http://localhost:5000
```

Requires a running MongoDB instance (local `mongod`, Docker, or MongoDB Atlas) —
point `MONGODB_URI` in `.env` at it.

### 2. Frontend

```bash
cd frontend
cp .env.example .env       # VITE_API_URL should point at the backend above
npm install
npm run dev                  # starts the app on http://localhost:5174
```

### Demo logins (after `npm run seed`, password `password123` for all)

| Role | Email |
|---|---|
| Admin | admin@careconnect.dev |
| Operations Manager | ops@careconnect.dev |
| Support Agent | support@careconnect.dev |
| Customer | liam@example.com / emma@example.com / olivia@example.com |
| Provider (verified) | james@pro.dev / sophia@pro.dev / ethan@pro.dev |
| Provider (pending verification) | ava@pro.dev / mason@pro.dev |

## How the AI features work

- **Classification** (`aiService.classifyRequest`): tokenizes the customer's free-text
  description and scores it against each category's name/keyword/skill vocabulary
  (with partial/substring credit), returning the best-fit category, a confidence
  score, and inferred required skills.
- **Matching / ranking** (`aiService.rankProviders`): scores each candidate provider
  0–100 using a weighted blend of skill/category match (40%), service-area match
  (20%), open availability (20%), historical rating (15%), and experience/verification
  (5% + bonuses/penalties) — with human-readable reasons returned alongside each score.

Both are exposed through the request lifecycle: submitting a request runs
classification immediately; calling `POST /api/requests/:id/match` runs ranking and
notifies the top-matched providers.

## Key workflows implemented

- **Request → Book:** create request → AI classifies → AI matches & ranks providers →
  providers quote → customer accepts a quote (availability-engine checked, no
  double-booking) → booking created → provider updates job status with
  notes/photos → completion → auto-generated invoice → customer review.
- **Availability engine:** `backend/utils/availability.js` prevents any two booked
  slots for the same provider from overlapping in time on the same date.
- **Disputes:** either party opens a dispute on a booking → support/ops/admin get
  notified, can assign themselves, message the thread, and resolve with an action
  (refund, partial refund, reschedule, warning, or provider suspension).
- **Live-feeling UI:** a notification bell polls every 8s for a live activity feed;
  list/detail pages poll on an interval so statuses (job in progress, new quotes,
  dispute updates) update without a manual refresh.
- **Analytics:** `/api/analytics/overview` powers the admin dashboard (totals, status
  breakdowns, 14-day request trend, bookings & revenue by category); providers get
  their own performance summary.

## Notes for grading / extension

- All server-side validation, authorization, and error handling goes through
  `asyncHandler` + a centralized `errorHandler` (handles Mongoose cast/validation/
  duplicate-key errors uniformly).
- Every mutating action that matters operationally (category changes, provider
  verification, dispute resolution, staff account creation) is written to
  `AuditLog`.
- The AI service is isolated behind a single module boundary so it could be swapped
  for a call to an LLM/embeddings API later without touching any controller.
