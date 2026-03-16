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

const PAGE_TITLES: Record<string, string> = {
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

export function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const getPageTitle = (path: string): string => {
    if (PAGE_TITLES[path]) return PAGE_TITLES[path]
    if (path.startsWith('/cases/') && path.includes('/edit')) return 'Edit Case'
    if (path.startsWith('/cases/new')) return 'New Case'
    if (path.startsWith('/cases/')) return 'Case Details'
    if (path.startsWith('/clients/')) return 'Client Details'
    return 'Advocase'
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 gap-4 shrink-0">
      {/* Page title (mobile only) */}
      <h1 className="text-lg font-semibold text-slate-900 md:hidden">
        {getPageTitle(pathname)}
      </h1>

      {/* Quick search (desktop only) */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search cases, clients..."
            className="pl-9 h-9 bg-slate-50 border-slate-200 cursor-pointer"
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

      {/* Notifications placeholder */}
      <button className="relative p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-colors">
        <Bell size={18} />
      </button>
    </header>
  )
}
