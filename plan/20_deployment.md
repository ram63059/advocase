# Stage 20: Deployment

## Goal
Deploy the app to Vercel, configure environment variables, set up cron jobs for auto-sync, and configure Supabase pg_cron for reminder emails.

---

## Step 1: Vercel Deployment Setup

### 1.1 Connect Repository
```bash
# Push to GitHub first
git init
git add .
git commit -m "Initial commit — Advocase v1"
git remote add origin https://github.com/your-username/advocase.git
git push -u origin main

# Then connect to Vercel
vercel --prod
# Or via Vercel dashboard: Import from GitHub
```

### 1.2 `vercel.json`
```json
{
  "buildCommand": "prisma generate && next build",
  "crons": [
    {
      "path": "/api/sync/cron",
      "schedule": "0 */3 * * *"
    }
  ],
  "functions": {
    "app/api/export/**/*.ts": {
      "maxDuration": 30
    },
    "app/api/sync/**/*.ts": {
      "maxDuration": 60
    },
    "app/api/courts/**/*.ts": {
      "maxDuration": 15
    }
  }
}
```

### 1.3 `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
}

module.exports = nextConfig
```

---

## Step 2: Environment Variables on Vercel

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Supabase (storage only)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth
NEXTAUTH_SECRET=a-very-long-random-string-here-use-openssl-rand-hex-32
NEXTAUTH_URL=https://advocase.vercel.app

# Database (Supabase PostgreSQL)
# Use Transaction Pooler URL (port 6543) with ?pgbouncer=true
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15

# Direct URL for Prisma migrations (port 5432)
DIRECT_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

# App URL
NEXT_PUBLIC_APP_URL=https://advocase.vercel.app

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Security
CRON_SECRET=a-very-long-random-string-here-use-openssl-rand-hex-32
```

---

## Step 3: Cron Job (`app/api/sync/cron/route.ts`)

Called by Vercel Cron every 3 hours:

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { fetchAdvocateCases } from '@/lib/ecourts/district'
import { Resend } from 'resend'
import { format, isToday, getDay } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  // Verify cron secret
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { courtsSync: 0, casesUpdated: 0, emailsSent: 0, errors: [] as string[] }

  // ─── 1. Sync all registered courts ───
  const courts = await prisma.courtRegistered.findMany({
    where: {
      syncStatus: { not: 'syncing' },
      OR: [
        { lastSyncedAt: null },
        { lastSyncedAt: { lt: new Date(Date.now() - 3 * 60 * 60 * 1000) } }
      ]
    },
    include: { profile: { select: { id: true } } }
  })

  for (const court of courts) {
    try {
      await prisma.courtRegistered.update({
        where: { id: court.id },
        data: { syncStatus: 'syncing' }
      })

      const eCourtsCase = await fetchAdvocateCases({
        stateCode: court.stateCode ?? '',
        advocateName: court.advocateName ?? '',
        barCode: court.barCode ?? undefined,
        year: court.year ?? undefined,
      })

      let updatedCount = 0
      for (const ec of eCourtsCase) {
        if (!ec.cnrNumber) continue

        const existing = await prisma.case.findFirst({
          where: { profileId: court.profile.id, cnrNumber: ec.cnrNumber }
        })

        if (existing && ec.nextDate) {
          await prisma.case.update({
            where: { id: existing.id },
            data: {
              nextDate: ec.nextDate,
              fixedFor: ec.fixedFor ?? existing.fixedFor,
              previousDate: existing.nextDate ?? existing.previousDate,
              courtNo: ec.courtNo ?? existing.courtNo,
              judgeName: ec.judgeName ?? existing.judgeName,
              lastSyncedAt: new Date(),
              ecourtsData: ec as any,
            }
          })
          updatedCount++
        }
      }

      await prisma.courtRegistered.update({
        where: { id: court.id },
        data: { syncStatus: 'done', lastSyncedAt: new Date() }
      })

      results.courtsSync++
      results.casesUpdated += updatedCount
    } catch (error) {
      await prisma.courtRegistered.update({
        where: { id: court.id },
        data: { syncStatus: 'error' }
      })
      results.errors.push(`Court ${court.id}: ${error}`)
    }
  }

  // ─── 2. Send reminder emails ───
  const today = new Date()
  const dayOfWeek = format(today, 'EEEE').toLowerCase()

  const dueReminders = await prisma.reminder.findMany({
    where: {
      isActive: true,
      sendEmail: true,
      OR: [
        // Once: exact date match
        {
          frequency: 'once',
          startDate: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lte: new Date(today.setHours(23, 59, 59, 999)),
          }
        },
        // Daily: within date range
        {
          frequency: 'daily',
          startDate: { lte: today },
          endDate: { gte: today },
        },
        // Weekly: matching day + within date range
        {
          frequency: 'weekly',
          dayOfWeek: dayOfWeek,
          startDate: { lte: today },
          OR: [{ endDate: null }, { endDate: { gte: today } }],
        },
        // Monthly: same day of month + within date range
        {
          frequency: 'monthly',
          startDate: { lte: today },
          OR: [{ endDate: null }, { endDate: { gte: today } }],
        },
      ]
    },
    include: {
      case: { select: { caseNumber: true, firstParty: true, courtName: true, nextDate: true, fixedFor: true } },
      client: { select: { fullName: true } },
      profile: { select: { fullName: true, officeName: true } },
    }
  })

  for (const reminder of dueReminders) {
    if (!reminder.emailTo) continue

    // Additional check for monthly (same day of month)
    if (reminder.frequency === 'monthly' && reminder.startDate) {
      if (new Date(reminder.startDate).getDate() !== today.getDate()) continue
    }

    try {
      const caseInfo = reminder.case
        ? `\nCase: ${reminder.case.caseNumber}\nNext Hearing: ${reminder.case.nextDate ? format(reminder.case.nextDate, 'dd MMM yyyy') : 'Awaited'} (${reminder.case.fixedFor ?? ''})\nCourt: ${reminder.case.courtName}`
        : ''

      await resend.emails.send({
        from: 'Advocase Reminders <reminders@advocase.app>',
        to: reminder.emailTo,
        subject: `Reminder: ${reminder.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">${reminder.title}</h2>
            <p>This is a scheduled reminder from ${reminder.profile.officeName ?? reminder.profile.fullName ?? 'your advocate'}.</p>
            ${caseInfo ? `<div style="background: #F8FAFC; padding: 12px; border-radius: 6px; margin: 12px 0;">${caseInfo.replace(/\n/g, '<br/>')}</div>` : ''}
            <p style="color: #64748B; font-size: 12px; margin-top: 20px;">Sent by Advocase — Legal Case Management</p>
          </div>
        `,
      })
      results.emailsSent++
    } catch (error) {
      results.errors.push(`Reminder ${reminder.id}: ${error}`)
    }
  }

  console.log('[Cron] Sync results:', results)
  return NextResponse.json(results)
}
```

---

## Step 4: Supabase pg_cron (Alternative to Vercel Cron)

Run in Supabase SQL Editor as backup:

```sql
-- Enable pg_cron extension (in Supabase dashboard: Extensions → enable pg_cron)

-- Schedule cron to call our API every 3 hours
SELECT cron.schedule(
  'advocase-sync',
  '0 */3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/sync/cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'your-cron-secret-here'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify the cron is scheduled
SELECT * FROM cron.job;

-- To remove/update:
-- SELECT cron.unschedule('advocase-sync');
```

---

## Step 5: Prisma Migration in Production

After deploying, run the migration:

```bash
# Option 1: Via Vercel build command (recommended)
# In vercel.json buildCommand: "prisma generate && prisma migrate deploy && next build"

# Option 2: Manually from local machine (with DIRECT_URL set)
npx prisma migrate deploy

# Option 3: In package.json scripts:
# "build": "prisma generate && prisma migrate deploy && next build"
```

**Important:** Use `prisma migrate deploy` (not `dev`) in production.

---

## Step 6: Production Checklist

### Supabase Dashboard Setup
- [ ] Project created (free tier)
- [ ] Auth trigger created (creates Profile on signup)
- [ ] RLS policies applied on all tables
- [ ] Storage buckets created (`case-documents`, `profile-assets`)
- [ ] Storage RLS policies set
- [ ] pg_cron enabled (in Extensions section)
- [ ] Service role key noted (for admin operations)

### Vercel Setup
- [ ] Project connected to GitHub repo
- [ ] All environment variables added
- [ ] Build command: `prisma generate && prisma migrate deploy && next build`
- [ ] Output directory: `.next`
- [ ] Node.js version: 18.x
- [ ] Vercel Cron configured in `vercel.json`
- [ ] Domain configured (optional: custom domain)

### Application Setup
- [ ] Resend domain verified (for email sending)
- [ ] From email configured: `notifications@yourdomain.com`
- [ ] Test user signup creates Profile row
- [ ] Test case creation works
- [ ] Test eCourts CNR lookup works
- [ ] Test PDF generation works
- [ ] Test cron endpoint with CRON_SECRET

---

## Step 7: Custom Domain (Optional)

```bash
# In Vercel dashboard:
# Settings → Domains → Add domain: advocase.app or yourdomain.com

# DNS records:
# A record: @ → 76.76.21.21
# CNAME: www → cname.vercel-dns.com

# Update NEXT_PUBLIC_APP_URL in Vercel env vars
```

---

## Step 8: Monitoring & Logs

```bash
# View Vercel function logs
vercel logs --follow

# View Vercel cron job history
# Vercel Dashboard → Deployments → Functions tab

# Supabase logs
# Supabase Dashboard → Database → Logs
```

---

## Performance Optimization Notes

1. **Database connection pooling:** Always use Supabase's pooler URL (Transaction mode, port 6543) for server-side Prisma queries
2. **Static data:** States/districts data served as static JSON (no DB query)
3. **Image optimization:** Use Next.js `<Image>` component for all images
4. **Server Components:** All data fetching in Server Components (no client-side fetching except for interactive features)
5. **React Query cache:** Set `staleTime: 60 * 1000` (1 minute) for all queries
6. **ISR:** Not needed (all data is user-specific, so no shared cache)
7. **Edge Runtime:** Not compatible with Prisma — use Node.js runtime for all routes

---

## Verification Checklist
- [ ] `npm run build` succeeds locally before pushing
- [ ] Vercel build succeeds
- [ ] Prisma migrations apply successfully in production
- [ ] Login/signup works on production URL
- [ ] Case creation and retrieval works
- [ ] File upload to Supabase Storage works
- [ ] PDF generation works (check 30s timeout)
- [ ] Cron endpoint responds correctly with CRON_SECRET header
- [ ] Cron is scheduled in Vercel and fires every 3 hours
- [ ] Supabase pg_cron is also scheduled as backup
- [ ] Email sending via Resend works
- [ ] Custom domain resolves correctly (if configured)
