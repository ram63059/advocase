# Stage 4: Layout & Navigation

## Goal
Build the dashboard shell: persistent sidebar (desktop), mobile bottom nav, top bar with search/profile, and the `(dashboard)/layout.tsx` wrapper.

---

## Files to Create
- `app/(dashboard)/layout.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/TopBar.tsx`
- `components/layout/MobileNav.tsx`
- `store/ui.ts` (Zustand store for sidebar state)

---

## Step 1: Zustand UI Store (`store/ui.ts`)

```typescript
'use client'
import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
```

---

## Step 2: Dashboard Layout (`app/(dashboard)/layout.tsx`)

```typescript
// Server component — gets user, passes to child layout
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      officeName: true,
      logoUrl: true,
      plan: true,
    }
  })
  if (!profile) redirect('/login')

  return <DashboardShell profile={profile}>{children}</DashboardShell>
}
```

### `components/layout/DashboardShell.tsx` (Client Component)

```typescript
'use client'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import { useUIStore } from '@/store/ui'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  profile: { id: string; email: string; fullName: string | null; officeName: string | null; logoUrl: string | null; plan: string }
  children: React.ReactNode
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar — desktop only */}
      <Sidebar profile={profile} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar profile={profile} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
```

---

## Step 3: Sidebar (`components/layout/Sidebar.tsx`)

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, CalendarDays,
  Users, CheckSquare, Search, Settings,
  Bell, Shield, Scale, LogOut, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

const navItems = [
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cases',     label: 'Cases',     icon: Briefcase },
  { href: '/calendar',  label: 'Calendar',  icon: CalendarDays },
  { href: '/clients',   label: 'Clients',   icon: Users },
  { href: '/tasks',     label: 'Tasks',     icon: CheckSquare },
  { href: '/search',    label: 'Search',    icon: Search },
]

const secondaryItems = [
  { href: '/reminders',    label: 'Reminders', icon: Bell },
  { href: '/admin/team',   label: 'Team',      icon: Shield },
  { href: '/admin/fields', label: 'Fields',    icon: Settings },
  { href: '/settings',     label: 'Settings',  icon: Settings },
]

interface SidebarProps {
  profile: {
    id: string
    fullName: string | null
    officeName: string | null
    logoUrl: string | null
    plan: string
  }
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex w-60 flex-col bg-white border-r border-slate-200 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-200 shrink-0">
        <Scale size={24} className="text-indigo-600" />
        <span className="font-semibold text-slate-900 text-lg">Advocase</span>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600 -ml-px pl-[calc(0.75rem-1px)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">More</p>
        </div>

        {secondaryItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section at bottom */}
      <div className="border-t border-slate-200 p-3">
        {/* Plan badge */}
        {profile.plan === 'free' && (
          <div className="mb-2 px-3 py-2 bg-amber-50 rounded-md">
            <p className="text-xs text-amber-700 font-medium">Free plan</p>
            <Link href="/settings#subscription" className="text-xs text-amber-600 hover:underline">
              Upgrade for more →
            </Link>
          </div>
        )}

        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.logoUrl ?? undefined} />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
              {getInitials(profile.fullName ?? profile.officeName ?? 'A')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {profile.fullName ?? 'Advocate'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {profile.officeName ?? 'My Office'}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-slate-400 hover:text-slate-700 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
```

---

## Step 4: TopBar (`components/layout/TopBar.tsx`)

```typescript
'use client'
import { Search, Bell, Plus } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface TopBarProps {
  profile: { fullName: string | null }
}

export function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const getPageTitle = (path: string): string => {
    const titles: Record<string, string> = {
      '/': 'Dashboard',
      '/cases': 'Cases',
      '/calendar': 'Calendar',
      '/clients': 'Clients',
      '/tasks': 'Tasks',
      '/reminders': 'Reminders',
      '/search': 'Search',
      '/settings': 'Settings',
      '/admin/team': 'Team',
      '/admin/fields': 'Field Management',
    }
    return titles[path] ?? 'Advocase'
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 gap-4 shrink-0">
      {/* Page title (mobile only — desktop shows in sidebar) */}
      <h1 className="text-lg font-semibold text-slate-900 md:hidden">
        {getPageTitle(pathname)}
      </h1>

      {/* Quick search (desktop only — mobile has /search page) */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search cases, clients…"
            className="pl-9 h-9 bg-slate-50 border-slate-200"
            onFocus={() => router.push('/search')}
            readOnly
          />
        </div>
      </div>

      <div className="flex-1 md:flex-none" />

      {/* Quick add dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-1">
            <Plus size={16} />
            <span className="hidden md:inline">Add</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push('/cases/new')}>
            New Case
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/clients?new=1')}>
            New Client
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/tasks?new=1')}>
            New Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications (future feature placeholder) */}
      <button className="relative p-2 rounded-md text-slate-500 hover:bg-slate-100">
        <Bell size={18} />
        {/* Badge when there are pending reminders */}
        {/* <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" /> */}
      </button>
    </header>
  )
}
```

---

## Step 5: Mobile Bottom Navigation (`components/layout/MobileNav.tsx`)

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, CalendarDays, Users, Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { href: '/',         label: 'Home',     icon: LayoutDashboard },
  { href: '/cases',    label: 'Cases',    icon: Briefcase },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/clients',  label: 'Clients',  icon: Users },
  { href: '/search',   label: 'Search',   icon: Search },
]

export function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors',
                active ? 'text-indigo-600' : 'text-slate-500'
              )}
            >
              <item.icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span className={cn('font-medium', active && 'font-semibold')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

---

## Step 6: Shared Page Components

### `components/shared/PageHeader.tsx`

```typescript
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Breadcrumb { label: string; href?: string }

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumb?: Breadcrumb[]
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-1">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={14} className="text-slate-400" />}
                {item.href ? (
                  <Link href={item.href} className="text-sm text-slate-500 hover:text-slate-700">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-sm text-slate-500">{item.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
```

### `components/shared/EmptyState.tsx`

```typescript
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href?: string; onClick?: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Button asChild size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button size="sm" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## Verification Checklist
- [ ] Sidebar renders on desktop (md+), hidden on mobile
- [ ] Bottom nav renders on mobile, hidden on desktop
- [ ] Active state highlights correct nav item for current page
- [ ] TopBar shows page title on mobile
- [ ] Quick add dropdown works (navigates to correct pages)
- [ ] Sign out button works
- [ ] Layout wraps all dashboard pages correctly
- [ ] No layout shift between pages (stable shell)
- [ ] Sidebar profile section shows user name + office name
