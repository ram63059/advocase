# Stage 1: Foundation

## Goal
Scaffold the Next.js project with all dependencies, configure Prisma with Supabase PostgreSQL, set up environment variables, and establish the folder structure ready for all future stages.

---

## Step 1: Create Next.js App

```bash
npx create-next-app@latest advocase \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
cd advocase
```

---

## Step 2: Install All Dependencies

```bash
# Supabase (storage only)
npm install @supabase/supabase-js

# Auth
npm install next-auth bcryptjs
npm install -D @types/bcryptjs

# Prisma
npm install prisma @prisma/client
npx prisma init

# UI Components (shadcn setup done in Step 5)
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Radix UI primitives (shadcn depends on these)
npm install @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-tabs \
  @radix-ui/react-popover \
  @radix-ui/react-tooltip \
  @radix-ui/react-switch \
  @radix-ui/react-avatar \
  @radix-ui/react-label \
  @radix-ui/react-checkbox \
  @radix-ui/react-radio-group \
  @radix-ui/react-separator \
  @radix-ui/react-scroll-area \
  @radix-ui/react-slot \
  @radix-ui/react-accordion \
  @radix-ui/react-collapsible \
  @radix-ui/react-toast

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Data fetching & state
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand

# Tables
npm install @tanstack/react-table

# Calendar
npm install react-big-calendar
npm install @types/react-big-calendar --save-dev

# Date handling
npm install date-fns react-day-picker

# Charts
npm install recharts

# PDF generation
npm install @react-pdf/renderer
npm install @types/react-pdf --save-dev

# Excel export
npm install xlsx

# Email
npm install resend

# Toast notifications
npm install sonner

# Theme (dark mode)
npm install next-themes

# Drag & drop (for tasks kanban + field reorder)
npm install @hello-pangea/dnd

# Moment (required by react-big-calendar)
npm install moment
```

---

## Step 3: Configure Prisma

Edit `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

> **Note:** `DATABASE_URL` uses Supabase's **Transaction Pooler** URL (port 6543).
> `DIRECT_URL` uses Supabase's **Direct Connection** URL (port 5432) — used for migrations only.

---

## Step 4: Environment Variables

Create `.env.local`:

```env
# Supabase (storage only)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000

# Database (Prisma)
# Pooled connection - for runtime queries
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection - for migrations
DIRECT_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

# Email (Resend)
RESEND_API_KEY=re_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron security
CRON_SECRET=your-random-secret-here
```

Create `.env.example` (same keys, empty values) for version control.
Add `.env.local` to `.gitignore`.

---

## Step 5: Setup shadcn/ui

```bash
npx shadcn@latest init
```

Select:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Then add all components used throughout the app:

```bash
npx shadcn@latest add button input label card badge \
  dialog sheet tabs select dropdown-menu \
  popover tooltip switch checkbox radio-group \
  avatar separator scroll-area accordion \
  table form textarea skeleton toast \
  command alert-dialog progress slider \
  calendar
```

---

## Step 6: Configure Tailwind

Edit `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom brand colors (see plan/19_design_system.md)
        brand: {
          navy: '#1A1A2E',
          indigo: '#4F46E5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
```

Add Inter and JetBrains Mono to `app/layout.tsx` via `next/font/google`.

---

## Step 7: Create Folder Structure

```
advocase/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── cases/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── tasks/page.tsx
│   │   ├── reminders/page.tsx
│   │   ├── search/page.tsx
│   │   ├── settings/page.tsx
│   │   └── admin/
│   │       ├── team/page.tsx
│   │       └── fields/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── courts/
│   │   │   ├── states/route.ts
│   │   │   ├── districts/route.ts
│   │   │   ├── complexes/route.ts
│   │   │   ├── sync/route.ts
│   │   │   ├── fetch-by-cnr/route.ts
│   │   │   └── causelist/route.ts
│   │   ├── export/
│   │   │   ├── daily-board/route.ts
│   │   │   ├── cases-pdf/route.ts
│   │   │   ├── cases-excel/route.ts
│   │   │   ├── invoice/route.ts
│   │   │   └── ledger/route.ts
│   │   ├── notify/
│   │   │   └── email/route.ts
│   │   └── sync/
│   │       └── cron/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                    ← shadcn generated
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── MobileNav.tsx
│   ├── cases/
│   │   ├── CaseCard.tsx
│   │   ├── CaseTable.tsx
│   │   ├── CaseForm.tsx
│   │   ├── CaseStatusBadge.tsx
│   │   ├── CaseTimeline.tsx
│   │   ├── CaseFilters.tsx
│   │   └── CourtTypeSelector.tsx
│   ├── clients/
│   │   ├── ClientCard.tsx
│   │   └── ClientForm.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── HearingTimeline.tsx
│   │   ├── SevenDayStrip.tsx
│   │   └── PurposeChart.tsx
│   ├── calendar/
│   │   ├── CalendarView.tsx
│   │   ├── DayPopover.tsx
│   │   └── ColorCodeManager.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskKanban.tsx
│   │   └── TaskForm.tsx
│   ├── shared/
│   │   ├── DatePicker.tsx
│   │   ├── CourtSelector.tsx
│   │   ├── ExportButton.tsx
│   │   ├── SearchInput.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── PageHeader.tsx
│   │   └── LoadingSkeleton.tsx
│   └── providers/
│       ├── QueryProvider.tsx
│       └── ThemeProvider.tsx
├── lib/
│   ├── prisma.ts              ← Prisma client singleton
│   ├── auth.ts                ← NextAuth config
│   ├── supabase/
│   │   └── storage.ts         ← Storage operations (service role)
│   ├── ecourts/
│   │   ├── district.ts
│   │   └── highcourt.ts
│   ├── pdf/
│   │   ├── daily-board.tsx
│   │   └── invoice.tsx
│   ├── validations/
│   │   ├── case.ts            ← Zod schemas for cases
│   │   ├── client.ts
│   │   ├── task.ts
│   │   └── reminder.ts
│   ├── constants.ts           ← All enum-like constants
│   └── utils.ts               ← cn(), formatDate(), etc.
├── hooks/
│   ├── useCases.ts
│   ├── useClients.ts
│   ├── useTasks.ts
│   ├── useReminders.ts
│   ├── useCalendar.ts
│   └── useProfile.ts
├── store/
│   └── ui.ts                  ← Zustand: sidebar open, filters, etc.
├── types/
│   └── index.ts               ← All TypeScript types (derived from Prisma)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── logo.svg
│   └── empty-state.svg
├── middleware.ts               ← Next.js route protection
├── .env.local
├── .env.example
└── next.config.js
```

---

## Step 8: Create Core Library Files

### `lib/prisma.ts` — Prisma singleton

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### `lib/auth.ts` — NextAuth config

```typescript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const profile = await prisma.profile.findUnique({
          where: { email: credentials.email as string },
          select: { id: true, email: true, fullName: true, passwordHash: true },
        })
        if (!profile?.passwordHash) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          profile.passwordHash
        )
        if (!valid) return null

        return { id: profile.id, email: profile.email, name: profile.fullName }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      return session
    },
  },
})
```

### `app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

### `lib/supabase/storage.ts` — Storage operations (server-side only)

```typescript
import { createClient } from '@supabase/supabase-js'

// Server-side only — uses service role to bypass RLS for storage
export function createStorageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Upload a file to Supabase Storage, returns public URL
export async function uploadFile(
  bucket: 'case-documents' | 'profile-assets',
  path: string,
  file: Buffer | Blob,
  contentType: string
): Promise<string> {
  const supabase = createStorageClient()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// Generate a signed URL for private file download (1 hour expiry)
export async function getSignedUrl(bucket: string, path: string): Promise<string> {
  const supabase = createStorageClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

// Delete a file from storage
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createStorageClient()
  await supabase.storage.from(bucket).remove([path])
}
```

### `lib/constants.ts`

```typescript
export const CASE_STATUS = {
  RUNNING: 'running',
  DECIDED: 'decided',
  ABANDONED: 'abandoned',
} as const

export const COURT_TYPES = [
  { value: 'district', label: 'District & Taluka' },
  { value: 'hc', label: 'High Court' },
  { value: 'sc', label: 'Supreme Court' },
  { value: 'drt', label: 'DRT' },
  { value: 'nclt', label: 'NCLT' },
  { value: 'consumer', label: 'Consumer Forum' },
  { value: 'other', label: 'Other' },
] as const

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export const REMINDER_FREQUENCY = {
  ONCE: 'once',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const

export const PAYMENT_MODE = [
  'Cash', 'UPI', 'Bank Transfer', 'Cheque'
] as const

export const ORDER_TYPE = {
  INTERIM: 'interim',
  FINAL: 'final',
} as const

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  DONE: 'done',
  ERROR: 'error',
} as const

export const DEFAULT_FIXED_FOR = [
  'For Arguments',
  'For Orders',
  'For Evidence',
  'For Filing Counter',
  'For Filing Affidavit',
  'For Framing Issues',
  'For Hearing',
  'For Filing',
  'Date Awaited',
  'Next Date',
] as const

export const PLAN_LIMITS = {
  free: { cases: 50, clients: 20, teamMembers: 0, storage: 100 },
  basic: { cases: 500, clients: 200, teamMembers: 2, storage: 1024 },
  pro: { cases: Infinity, clients: Infinity, teamMembers: 10, storage: 10240 },
} as const
```

### `lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null, fmt = 'dd MMM yyyy'): string {
  if (!date) return '—'
  return format(new Date(date), fmt)
}

export function getDateLabel(date: Date | null): string {
  if (!date) return 'Date Awaited'
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isPast(date)) return 'Overdue'
  return formatDate(date)
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.substring(0, n - 1) + '…' : str
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}
```

### `types/index.ts`

```typescript
// Re-export Prisma types and extend them as needed
export type {
  Profile, Case, Client, Task, Reminder,
  CaseHistory, CaseOrder, CaseNote, CaseDocument,
  CaseClient, OpposeCounsel, Fee, LinkedCase,
  TeamMember, CourtRegistered, CustomField, ColorCode
} from '@prisma/client'

// Extended types with relations
export type CaseWithRelations = Case & {
  clients: (CaseClient & { client: Client })[]
  history: CaseHistory[]
  notes: CaseNote[]
  documents: CaseDocument[]
  orders: CaseOrder[]
  fees: Fee[]
  oppositeCouns: OpposeCounsel[]
}

export type CaseListItem = Pick<Case,
  'id' | 'caseNumber' | 'cnrNumber' | 'firstParty' | 'oppositeParty'
  | 'courtName' | 'courtType' | 'nextDate' | 'fixedFor' | 'status'
  | 'isImportant' | 'caseType' | 'year'
>

export type DashboardStats = {
  total: number
  today: number
  tomorrow: number
  awaited: number
  decided: number
}

export type CaseFilters = {
  status?: string
  courtType?: string
  nextDateFrom?: Date
  nextDateTo?: Date
  search?: string
  fixedFor?: string
  clientId?: string
  isImportant?: boolean
  page?: number
  limit?: number
}
```

---

## Step 9: Run Initial Migration

After completing `plan/02_database_schema.md` (Prisma schema), run:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

---

## Step 10: Configure `middleware.ts`

At project root — protects all dashboard routes:

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isAuthRoute =
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/signup')

  if (!req.auth && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (req.auth && isAuthRoute) {
    return NextResponse.redirect(new URL('/', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Step 11: Root Layout (`app/layout.tsx`)

```typescript
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: 'Advocase — Legal Case Management',
  description: 'Manage your cases with clarity',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## Step 12: `components/providers/QueryProvider.tsx`

```typescript
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,  // 1 minute
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}
```

---

## Verification Checklist for Stage 1
- [ ] `npm run dev` starts without errors
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Prisma client generates successfully (`npx prisma generate`)
- [ ] All shadcn components are in `components/ui/`
- [ ] `.env.local` has all required variables
- [ ] NextAuth redirects unauthenticated users to `/login`
- [ ] Fonts load correctly (Inter, JetBrains Mono)
