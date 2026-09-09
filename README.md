# Eventos — Greek Event Management SaaS

Production-ready event management platform for the Greek market with full Greek/English support.

## Features (Phase 1)

- Authentication (register, login, email verification, password reset)
- Multi-tenant organizations with RBAC
- 6-step event creation wizard
- Event dashboard with real-time stats and guidance
- Marketing website (Greek-first, bilingual)
- Guest list (read-only from seed data)
- Public event pages
- Provider abstractions: Storage (Openinary CDN), Messaging (Email/SMS/WhatsApp), Jobs (BullMQ), Stripe webhooks

## Quick Start

### Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL and Redis)

### Setup

```bash
# Start infrastructure
docker compose up -d

# Install dependencies
npm install

# Generate Prisma client & push schema
npm run db:generate
npx prisma db push

# Seed demo data
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000/el](http://localhost:3000/el)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Planner (OWNER) | planner@eventos.gr | demo123456 |
| Manager | manager@eventos.gr | demo123456 |
| Platform Admin | admin@eventos.gr | demo123456 |

Demo event: **Γάμος Γιώργος & Μαρία** — 120 guests, tables, vendors, budget, tasks.

## Project Structure

```
src/
├── app/[locale]/     # Localized routes (el/en)
├── components/       # UI components
├── i18n/             # Translations
├── lib/              # Utilities & formatters
└── server/           # Auth, services, repositories, providers
prisma/               # Schema & seed
workers/              # Background job workers
tests/                # Vitest tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run worker` | Start BullMQ workers |
| `npm test` | Run tests |

## Environment

Copy `.env.example` to `.env`. Key variables:

- `DATABASE_URL` — PostgreSQL connection
- `NEXT_PUBLIC_API_URL` — Meindesk Auth API base (e.g. `http://localhost:4000`)
- `NEXT_PUBLIC_MEINDESK_PUBLISHABLE_KEY` — Meindesk publishable key from the portal
- `MEINDESK_SECRET_KEY` — Meindesk secret key from the portal
- `REDIS_URL` — Redis for jobs/rate limiting
- `OPENINARY_API_URL` — Openinary API base (e.g. `https://evento-cdn.efindly.gr/api`)
- `OPENINARY_PUBLIC_URL` — CDN delivery base (e.g. `https://evento-cdn.efindly.gr`)
- `OPENINARY_API_KEY` — API key from the Openinary dashboard (required for uploads)
- `S3_*` — Optional MinIO/S3 fallback when `STORAGE_PROVIDER=s3`
- `RESEND_API_KEY` — Email (optional, console fallback in dev)
- `STRIPE_*` — Payments (Phase 7)

Create an API key at your Openinary instance before uploading media. When `OPENINARY_API_KEY` is set, Eventos uses Openinary for all storage; otherwise it falls back to S3/MinIO.

## Architecture

- **Next.js 16** App Router with Server Components
- **Prisma + PostgreSQL** with UUID IDs and soft deletes
- **Meindesk Auth** for identity/sessions (local User synced for orgs/RBAC)
- **next-intl** for Greek/English i18n
- **BullMQ + Redis** for background jobs
- **Openinary CDN** for media storage and delivery

## License

Private — All rights reserved.
