'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { TeamMemberForm } from './TeamMemberForm'

function formatDate(date: Date | string | null) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const PERMISSIONS = [
  { key: 'canAddCase', label: 'Add Case' },
  { key: 'canEditCase', label: 'Edit Case' },
  { key: 'canViewCase', label: 'View Cases' },
  { key: 'canViewFees', label: 'View Fees' },
]

interface TeamPageClientProps {
  teamMembers: any[]
  ownerId: string
}

export function TeamPageClient({ teamMembers, ownerId }: TeamPageClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)

  const handleTogglePermission = async (memberId: string, permission: string, currentValue: boolean) => {
    await fetch(`/api/team/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [permission]: !currentValue }),
    })
    router.refresh()
  }

  const handleToggleActive = async (memberId: string, isActive: boolean) => {
    await fetch(`/api/team/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    toast.success(isActive ? 'Member deactivated' : 'Member activated')
    router.refresh()
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this team member? This cannot be undone.')) return
    await fetch(`/api/team/${memberId}`, { method: 'DELETE' })
    toast.success('Team member removed')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your associates and their permissions
          </p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={16} className="mr-1.5" /> Invite Member
        </Button>
      </div>

      {teamMembers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <p className="text-muted-foreground mb-4">No team members yet</p>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            Invite your first team member
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                {PERMISSIONS.map(p => (
                  <th
                    key={p.key}
                    className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase whitespace-nowrap"
                  >
                    {p.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Active</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {teamMembers.map(member => (
                <tr key={member.id} className="border-b border-border hover:bg-secondary/30 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{member.fullName}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                    {member.mobile && (
                      <p className="text-xs text-muted-foreground/60">{member.mobile}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {member.role}
                    </Badge>
                  </td>
                  {PERMISSIONS.map(perm => (
                    <td key={perm.key} className="px-4 py-3 text-center">
                      <Switch
                        checked={member[perm.key] as boolean}
                        onCheckedChange={() =>
                          handleTogglePermission(member.id, perm.key, member[perm.key])
                        }
                        className="mx-auto"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={member.isActive}
                      onCheckedChange={() => handleToggleActive(member.id, member.isActive)}
                      className="mx-auto"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {member.joinedAt ? (
                      <span className="flex items-center gap-1 text-xs text-foreground">
                        <CheckCircle size={12} />
                        Joined {formatDate(member.joinedAt)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail size={12} />
                        Invited {formatDate(member.invitedAt)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive text-xs h-7"
                      onClick={() => handleRemove(member.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet
        open={formOpen}
        onOpenChange={(open) => { if (!open) setFormOpen(false) }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Invite Team Member</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <TeamMemberForm
              onSuccess={() => { setFormOpen(false); router.refresh() }}
              onCancel={() => setFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
