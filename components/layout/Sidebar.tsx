'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, CalendarDays,
  Users, CheckSquare, Search, Settings,
  Bell, Shield, Scale, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

const navItems = [
  { href: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cases',    label: 'Cases',     icon: Briefcase },
  { href: '/calendar', label: 'Calendar',  icon: CalendarDays },
  { href: '/clients',  label: 'Clients',   icon: Users },
  { href: '/tasks',    label: 'Tasks',     icon: CheckSquare },
  { href: '/search',   label: 'Search',    icon: Search },
]

const secondaryItems = [
  { href: '/reminders',  label: 'Reminders',  icon: Bell },
  { href: '/causelist',  label: 'Cause List', icon: Scale },
  { href: '/admin/team', label: 'Team',       icon: Shield },
  { href: '/admin/fields', label: 'Fields',   icon: Settings },
  { href: '/settings',   label: 'Settings',   icon: Settings },
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
    <aside className="hidden md:flex w-60 flex-col bg-white border-r border-slate-200 h-screen shrink-0">
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
        {profile.plan === 'free' && (
          <div className="mb-2 px-3 py-2 bg-amber-50 rounded-md">
            <p className="text-xs text-amber-700 font-medium">Free plan</p>
            <Link href="/settings#subscription" className="text-xs text-amber-600 hover:underline">
              Upgrade for more
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
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
