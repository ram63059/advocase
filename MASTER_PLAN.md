# Advocase — Master Implementation Plan

## What We're Building
A modern legal case management web app for Indian advocates.
Replaces CaseBench with a cleaner, faster, mobile-friendly alternative.

## Tech Stack (Final Decisions)
| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | Server Components + API Routes |
| Styling | Tailwind CSS v3 + shadcn/ui | Fast, consistent, accessible |
| ORM | Prisma | Type-safe DB access, migrations |
| Database | PostgreSQL via Supabase | Free tier, managed |
| Auth | NextAuth (Credentials + JWT) | Simple, no vendor lock-in |
| Storage | Supabase Storage | Free 1GB, for documents/logos |
| Realtime | Supabase Realtime | Live case updates |
| State | Zustand + TanStack Query | Local + server state |
| PDF | @react-pdf/renderer | Invoice + daily board |
| Excel | xlsx | Case list export |
| Email | Resend | Hearing reminders |
| Icons | Lucide React | Consistent icon set |
| Forms | React Hook Form + Zod | Validation |
| Tables | TanStack Table v8 | Sortable, filterable |
| Calendar | react-big-calendar | Month/week/day views |
| Deployment | Vercel | Free hobby plan |

## Architecture Decision: Prisma + NextAuth
- **NextAuth** (Credentials provider, JWT strategy) handles all authentication
- **Prisma** handles all data operations (CRUD on all tables)
- **Supabase Storage** handles file uploads (server-side via service role)
- **Supabase Realtime** handles live updates
- The `Profile` table stores email + bcrypt password hash directly — no external auth dependency
- Auth security enforced at API route / Server Component level via `auth()` from NextAuth
- Prisma connects via `DATABASE_URL` (pooled) and `DIRECT_URL` (direct, for migrations)

## Build Order (Strict — Each Stage is Usable)

### Stage 1: Foundation [plan/01_foundation.md]
Project init, dependencies, env vars, Prisma setup, folder structure

### Stage 2: Database Schema [plan/02_database_schema.md]
Complete Prisma schema with all 17 models, relations, indexes

### Stage 3: Auth Pages [plan/03_auth_pages.md]
Login, Signup, Forgot Password, middleware route protection

### Stage 4: Layout & Navigation [plan/04_layout_navigation.md]
Sidebar, TopBar, MobileNav, dashboard shell layout

### Stage 5: Dashboard Page [plan/05_dashboard.md]
Stats, today's hearings, 7-day strip, charts, quick actions

### Stage 6: Cases List Page [plan/06_cases_list.md]
Case cards, table view, tabs, filters, search, pagination

### Stage 7: Case Detail Page [plan/07_case_detail.md]
All 9 sections: overview, timeline, orders, docs, notes, fees, counsel, reminders, linked

### Stage 8: Add/Edit Case Form [plan/08_case_form.md]
Court selector, CNR auto-fill, all fields, client linking

### Stage 9: Clients [plan/09_clients.md]
Client list, client detail, case linking, fee history

### Stage 10: Calendar [plan/10_calendar.md]
react-big-calendar, color codes, day popup, print

### Stage 11: Tasks [plan/11_tasks.md]
Kanban board, task cards, add/edit slide-over

### Stage 12: Reminders [plan/12_reminders.md]
Reminder list, add/edit drawer, frequency logic

### Stage 13: Search / Report [plan/13_search.md]
Search page, advanced filters, export actions

### Stage 14: Admin Pages [plan/14_admin.md]
Team management (RBAC), Fields management

### Stage 15: Settings [plan/15_settings.md]
Profile, branding, bank details, password, courts, subscription

### Stage 16: API Routes [plan/16_api_routes.md]
All /api/* endpoints with request/response contracts

### Stage 17: eCourts Integration [plan/17_ecourts_integration.md]
District API, HC API, CNR lookup, cause list, sync logic

### Stage 18: Exports [plan/18_exports.md]
PDF (daily board, invoice, ledger, cases), Excel export

### Stage 19: Design System [plan/19_design_system.md]
Color palette, typography, component library, shadcn setup

### Stage 20: Deployment [plan/20_deployment.md]
Vercel setup, env vars, cron jobs, Supabase pg_cron

## Plan Files Index

| File | Stage | Description |
|------|-------|-------------|
| [plan/01_foundation.md](plan/01_foundation.md) | 1 | Project setup, packages, env vars, Prisma |
| [plan/02_database_schema.md](plan/02_database_schema.md) | 2 | Complete Prisma schema (all 17 models) |
| [plan/03_auth_pages.md](plan/03_auth_pages.md) | 3 | Login, signup, middleware |
| [plan/04_layout_navigation.md](plan/04_layout_navigation.md) | 4 | Sidebar, TopBar, shell layout |
| [plan/05_dashboard.md](plan/05_dashboard.md) | 5 | Dashboard page |
| [plan/06_cases_list.md](plan/06_cases_list.md) | 6 | Cases list page |
| [plan/07_case_detail.md](plan/07_case_detail.md) | 7 | Case detail page |
| [plan/08_case_form.md](plan/08_case_form.md) | 8 | Add/Edit case form |
| [plan/09_clients.md](plan/09_clients.md) | 9 | Clients pages |
| [plan/10_calendar.md](plan/10_calendar.md) | 10 | Calendar page |
| [plan/11_tasks.md](plan/11_tasks.md) | 11 | Tasks kanban |
| [plan/12_reminders.md](plan/12_reminders.md) | 12 | Reminders page |
| [plan/13_search.md](plan/13_search.md) | 13 | Search / Report page |
| [plan/14_admin.md](plan/14_admin.md) | 14 | Team + Fields management |
| [plan/15_settings.md](plan/15_settings.md) | 15 | Settings page |
| [plan/16_api_routes.md](plan/16_api_routes.md) | 16 | All API routes |
| [plan/17_ecourts_integration.md](plan/17_ecourts_integration.md) | 17 | eCourts API integration |
| [plan/18_exports.md](plan/18_exports.md) | 18 | PDF & Excel exports |
| [plan/19_design_system.md](plan/19_design_system.md) | 19 | Design system & components |
| [plan/20_deployment.md](plan/20_deployment.md) | 20 | Vercel + cron deployment |

## Global Rules for Every Agent Pass
1. **Never use `any` type** — all TypeScript must be fully typed
2. **Server Components by default** — only use `"use client"` when necessary (forms, hooks, interactivity)
3. **Prisma in Server Components and API Routes only** — never import Prisma in client components
4. **All API routes validate input with Zod** — never trust raw request body
5. **Error boundaries** on every page — never let a single error crash the whole app
6. **Loading states** on every async operation — skeleton loaders not spinners
7. **Mobile-first** — every component works at 375px width before desktop
8. **RLS enabled** at Supabase level for all tables — defense in depth
9. **No hardcoded strings** — all status values come from constants file
10. **Optimistic updates** for UX — update UI immediately, rollback on error

## Shared Constants File
`lib/constants.ts` must be created in Stage 1 with:
- CASE_STATUS: running | decided | abandoned
- COURT_TYPES: district | hc | sc | drt | nclt | consumer | more
- TASK_PRIORITY: low | medium | high
- TASK_STATUS: pending | in_progress | completed
- REMINDER_FREQUENCY: once | daily | weekly | monthly
- PAYMENT_MODE: Cash | UPI | Bank Transfer | Cheque
- ORDER_TYPE: interim | final
- TEAM_ROLE: associate | partner
- SYNC_STATUS: pending | syncing | done | error
- FIXED_FOR_OPTIONS: list of default "fixed for" values
