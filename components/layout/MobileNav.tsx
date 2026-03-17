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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <item.icon size={19} strokeWidth={active ? 2 : 1.5} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
