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
