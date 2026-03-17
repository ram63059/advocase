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
  { href: '/reminders',    label: 'Reminders',  icon: Bell },
  { href: '/causelist',    label: 'Cause List', icon: Scale },
  { href: '/admin/team',   label: 'Team',       icon: Shield },
  { href: '/admin/fields', label: 'Fields',     icon: Settings },
  { href: '/settings',     label: 'Settings',   icon: Settings },
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
    <aside className="hidden md:flex w-56 flex-col bg-card border-r border-border h-screen shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border shrink-0">
        <Scale size={20} className="text-foreground" />
        <span className="font-semibold text-foreground text-base tracking-tight">Advocase</span>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              )}
            >
              <item.icon size={16} strokeWidth={active ? 2 : 1.75} />
              {item.label}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="pt-3 pb-1.5">
          <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">More</p>
        </div>

        {secondaryItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              )}
            >
              <item.icon size={15} strokeWidth={active ? 2 : 1.75} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-2.5">
        {profile.plan === 'free' && (
          <div className="mb-2 px-3 py-2 bg-secondary rounded-md">
            <p className="text-xs text-foreground font-medium">Free plan</p>
            <Link href="/settings#subscription" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Upgrade for more
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar className="h-7 w-7">
            <AvatarImage src={profile.logoUrl ?? undefined} />
            <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
              {getInitials(profile.fullName ?? profile.officeName ?? 'A')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate leading-tight">
              {profile.fullName ?? 'Advocate'}
            </p>
            <p className="text-xs text-muted-foreground truncate leading-tight">
              {profile.officeName ?? 'My Office'}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm hover:bg-secondary"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
