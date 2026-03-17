'use client'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'

interface DashboardShellProps {
  profile: {
    id: string
    email: string
    fullName: string | null
    officeName: string | null
    logoUrl: string | null
    plan: string
  }
  children: React.ReactNode
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar profile={profile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
