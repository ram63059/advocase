# Stage 14: Admin Pages

## Goal
Build `/admin/team` (team management with RBAC) and `/admin/fields` (custom dropdown field management).

---

## Page 1: `/admin/team` — Team Management

### File: `app/(dashboard)/admin/team/page.tsx`

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TeamPageClient } from '@/components/admin/TeamPageClient'

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  const teamMembers = await prisma.teamMember.findMany({
    where: { ownerId: userId },
    orderBy: { invitedAt: 'desc' },
  })

  return <TeamPageClient teamMembers={teamMembers} ownerId={userId} />
}
```

### `components/admin/TeamPageClient.tsx`

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Mail, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { TeamMemberForm } from './TeamMemberForm'
import { formatDate } from '@/lib/utils'

const PERMISSIONS = [
  { key: 'canAddCase',  label: 'Add Case' },
  { key: 'canEditCase', label: 'Edit Case' },
  { key: 'canViewCase', label: 'View Cases' },
  { key: 'canViewFees', label: 'View Fees' },
]

export function TeamPageClient({ teamMembers, ownerId }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

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
    if (!confirm('Remove this team member?')) return
    await fetch(`/api/team/${memberId}`, { method: 'DELETE' })
    toast.success('Team member removed')
    router.refresh()
  }

  const handleSaved = () => {
    setFormOpen(false)
    setEditingMember(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500">Manage your associates and their permissions</p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={16} className="mr-1" />
          Invite Member
        </Button>
      </div>

      {teamMembers.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500 mb-3">No team members yet</p>
          <Button size="sm" onClick={() => setFormOpen(true)}>Invite your first team member</Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                {PERMISSIONS.map(p => (
                  <th key={p.key} className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                    {p.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Active</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {teamMembers.map(member => (
                <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{member.fullName}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                    {member.mobile && <p className="text-xs text-slate-400">{member.mobile}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                  </td>
                  {PERMISSIONS.map(perm => (
                    <td key={perm.key} className="px-4 py-3 text-center">
                      <Switch
                        checked={member[perm.key as keyof typeof member] as boolean}
                        onCheckedChange={() => handleTogglePermission(
                          member.id, perm.key, member[perm.key as keyof typeof member] as boolean
                        )}
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
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle size={12} />
                        Joined {formatDate(member.joinedAt)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Mail size={12} />
                        Invited {formatDate(member.invitedAt)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
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

      <Sheet open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditingMember(null) } }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Invite Team Member</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <TeamMemberForm onSuccess={handleSaved} onCancel={() => setFormOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

### Team Member Invite Form

```typescript
// components/admin/TeamMemberForm.tsx
// Fields: Full Name, Email, Mobile (optional), Role (associate/partner)
// Permissions: 4 checkboxes (Add Case, Edit Case, View Cases, View Fees)

// On submit:
// 1. POST /api/team → creates TeamMember record
// 2. Send invite email via Resend with link to signup
//    Email says: "You've been invited to join {officeName} on Advocase. Click to accept."
//    Link: https://app.advocase.com/signup?invite={teamMemberId}&email={email}
// 3. When user signs up via invite link:
//    - Signup with that email
//    - Set teamMember.userId = auth.userId, joinedAt = now()
```

### Team API Routes

```typescript
// app/api/team/route.ts
// POST: create team member + send invite email
// Body: { fullName, email, mobile, role, canAddCase, canEditCase, canViewCase, canViewFees }

// app/api/team/[id]/route.ts
// PATCH: update permissions or isActive
// DELETE: remove team member (soft delete: set isActive = false)
```

---

## Page 2: `/admin/fields` — Fields Management

### File: `app/(dashboard)/admin/fields/page.tsx`

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { FieldsPageClient } from '@/components/admin/FieldsPageClient'

export default async function FieldsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  const allFields = await prisma.customField.findMany({
    where: { profileId: userId },
    orderBy: [{ fieldType: 'asc' }, { sortOrder: 'asc' }],
  })

  // Group by field type
  const grouped = {
    casetype:    allFields.filter(f => f.fieldType === 'casetype'),
    ps:          allFields.filter(f => f.fieldType === 'ps'),
    court:       allFields.filter(f => f.fieldType === 'court'),
    us:          allFields.filter(f => f.fieldType === 'us'),
    empanelment: allFields.filter(f => f.fieldType === 'empanelment'),
  }

  return <FieldsPageClient grouped={grouped} profileId={userId} />
}
```

### `components/admin/FieldsPageClient.tsx`

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FieldTypeList } from './FieldTypeList'

const FIELD_TYPES = [
  { key: 'casetype',    label: 'Case Type' },
  { key: 'ps',         label: 'P.S. / Company' },
  { key: 'court',      label: 'Court' },
  { key: 'us',         label: 'Under Section' },
  { key: 'empanelment', label: 'Empanelment' },
]

export function FieldsPageClient({ grouped, profileId }) {
  const router = useRouter()

  const handleAdd = async (fieldType: string, value: string) => {
    await fetch('/api/fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldType, value }),
    })
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/fields/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  const handleEdit = async (id: string, value: string) => {
    await fetch(`/api/fields/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    router.refresh()
  }

  const handleReorder = async (fieldType: string, orderedIds: string[]) => {
    await fetch('/api/fields/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldType, orderedIds }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Field Management</h1>
        <p className="text-sm text-slate-500">
          Manage dropdown options used in case forms
        </p>
      </div>

      <Tabs defaultValue="casetype">
        <TabsList className="w-full">
          {FIELD_TYPES.map(ft => (
            <TabsTrigger key={ft.key} value={ft.key} className="flex-1 text-xs">
              {ft.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {FIELD_TYPES.map(ft => (
          <TabsContent key={ft.key} value={ft.key} className="mt-4">
            <FieldTypeList
              fieldType={ft.key}
              label={ft.label}
              items={grouped[ft.key as keyof typeof grouped] ?? []}
              onAdd={(value) => handleAdd(ft.key, value)}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onReorder={(ids) => handleReorder(ft.key, ids)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
```

### `components/admin/FieldTypeList.tsx`

```typescript
'use client'
import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical, Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FieldItem {
  id: string
  value: string
  sortOrder: number
}

export function FieldTypeList({ fieldType, label, items, onAdd, onDelete, onEdit, onReorder }) {
  const [newValue, setNewValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleAdd = () => {
    if (!newValue.trim()) return
    onAdd(newValue.trim())
    setNewValue('')
  }

  const handleEditStart = (item: FieldItem) => {
    setEditingId(item.id)
    setEditValue(item.value)
  }

  const handleEditSave = () => {
    if (!editValue.trim() || !editingId) return
    onEdit(editingId, editValue.trim())
    setEditingId(null)
    setEditValue('')
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    const newOrder = [...items]
    const [moved] = newOrder.splice(result.source.index, 1)
    newOrder.splice(result.destination.index, 0, moved)
    onReorder(newOrder.map(i => i.id))
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-medium text-slate-900">{label} Options</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {items.length} values • Drag to reorder
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={fieldType}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="divide-y divide-slate-100"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-3 px-5 py-3 ${snapshot.isDragging ? 'bg-indigo-50 shadow-sm' : 'hover:bg-slate-50'}`}
                    >
                      <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab">
                        <GripVertical size={16} />
                      </div>

                      {editingId === item.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleEditSave()
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                          />
                          <button onClick={handleEditSave} className="text-green-600 hover:text-green-700">
                            <Check size={15} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-700">
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-slate-800">{item.value}</span>
                          <button onClick={() => handleEditStart(item)} className="text-slate-400 hover:text-slate-700">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500">
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add new value */}
      <div className="px-5 py-4 border-t border-slate-100">
        <div className="flex gap-2">
          <Input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder={`Add new ${label.toLowerCase()} value…`}
            className="h-9 text-sm"
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
          <Button size="sm" onClick={handleAdd} disabled={!newValue.trim()}>
            <Plus size={14} className="mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Fields API Routes

```typescript
// app/api/fields/route.ts
// GET: list all custom fields for current user
// POST: create new custom field
//   Body: { fieldType, value }
//   Check unique constraint: profileId + fieldType + value

// app/api/fields/[id]/route.ts
// PATCH: update field value
// DELETE: delete custom field

// app/api/fields/reorder/route.ts
// POST: reorder fields
//   Body: { fieldType: string, orderedIds: string[] }
//   Updates sortOrder for each field based on position in array
```

---

## Verification Checklist
- [ ] Team table shows all invited/joined members
- [ ] Invite form sends email via Resend
- [ ] Permission toggles (Switch) update via API and reflect immediately
- [ ] Active toggle deactivates/activates member
- [ ] Remove button deletes member with confirmation
- [ ] Invited status shows pending email icon
- [ ] Joined status shows green check + join date
- [ ] Fields page shows 5 tabs (Case Type, P.S., Court, Under Section, Empanelment)
- [ ] Add value at bottom of each list
- [ ] Edit value inline with save/cancel
- [ ] Delete value removes from list
- [ ] Drag to reorder updates sortOrder in DB
- [ ] Changes reflect immediately in case form dropdowns
