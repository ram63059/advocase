# Stage 11: Tasks Page

## Goal
Build `/tasks` with a Kanban board view (desktop: 3 columns, mobile: tabs) and a slide-over form for adding/editing tasks.

---

## Files to Create
- `app/(dashboard)/tasks/page.tsx`
- `components/tasks/TaskKanban.tsx`
- `components/tasks/TaskCard.tsx`
- `components/tasks/TaskForm.tsx`
- `app/api/tasks/route.ts`
- `app/api/tasks/[id]/route.ts`

---

## Step 1: Tasks Page (`app/(dashboard)/tasks/page.tsx`)

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TasksPageClient } from '@/components/tasks/TasksPageClient'

export default async function TasksPage({
  searchParams
}: {
  searchParams: { new?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  const profileId = userId

  const [tasks, teamMembers] = await Promise.all([
    prisma.task.findMany({
      where: { profileId },
      include: {
        case: { select: { id: true, caseNumber: true, firstParty: true } },
        client: { select: { id: true, fullName: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    }),
    prisma.teamMember.findMany({
      where: { ownerId: profileId, isActive: true },
      select: { id: true, fullName: true, userId: true }
    })
  ])

  // Group by status
  const grouped = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  }

  return (
    <TasksPageClient
      grouped={grouped}
      teamMembers={teamMembers}
      showNewForm={searchParams.new === '1'}
    />
  )
}
```

---

## Step 2: Tasks Page Client (`components/tasks/TasksPageClient.tsx`)

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TaskKanban } from './TaskKanban'
import { TaskForm } from './TaskForm'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function TasksPageClient({ grouped, teamMembers, showNewForm }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(showNewForm)
  const [editingTask, setEditingTask] = useState(null)

  const totalPending = grouped.pending.length

  const handleTaskSaved = () => {
    setFormOpen(false)
    setEditingTask(null)
    router.refresh()
  }

  const openEdit = (task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
          {totalPending > 0 && (
            <p className="text-sm text-amber-600">{totalPending} pending task{totalPending !== 1 ? 's' : ''}</p>
          )}
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={16} className="mr-1" />
          Add Task
        </Button>
      </div>

      {/* Desktop: Kanban / Mobile: Tabs */}
      <div className="hidden md:block">
        <TaskKanban
          grouped={grouped}
          onEdit={openEdit}
          onStatusChange={(taskId, status) => {
            fetch(`/api/tasks/${taskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
            }).then(() => router.refresh())
          }}
        />
      </div>

      <div className="md:hidden">
        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              Pending {grouped.pending.length > 0 && `(${grouped.pending.length})`}
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex-1">In Progress</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">Done</TabsTrigger>
          </TabsList>
          {(['pending', 'in_progress', 'completed'] as const).map(status => (
            <TabsContent key={status} value={status} className="mt-4 space-y-3">
              {grouped[status].map(task => (
                <TaskCard key={task.id} task={task} onEdit={openEdit} />
              ))}
              {grouped[status].length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No tasks here.</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Task form sheet */}
      <Sheet open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditingTask(null) } }}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingTask ? 'Edit Task' : 'New Task'}</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <TaskForm
              defaultValues={editingTask}
              teamMembers={teamMembers}
              onSuccess={handleTaskSaved}
              onCancel={() => { setFormOpen(false); setEditingTask(null) }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

---

## Step 3: TaskKanban (`components/tasks/TaskKanban.tsx`)

```typescript
'use client'
import { TaskCard } from './TaskCard'

const COLUMNS = [
  { id: 'pending',     label: 'Pending',     color: 'bg-amber-50 border-amber-200' },
  { id: 'in_progress', label: 'In Progress',  color: 'bg-blue-50 border-blue-200' },
  { id: 'completed',   label: 'Completed',    color: 'bg-green-50 border-green-200' },
]

export function TaskKanban({ grouped, onEdit, onStatusChange }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {COLUMNS.map(col => (
        <div key={col.id} className={`rounded-lg border ${col.color} p-4 min-h-64`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
            <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full border">
              {grouped[col.id as keyof typeof grouped]?.length ?? 0}
            </span>
          </div>

          <div className="space-y-3">
            {(grouped[col.id as keyof typeof grouped] ?? []).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onStatusChange={(newStatus) => onStatusChange(task.id, newStatus)}
              />
            ))}
          </div>

          {(grouped[col.id as keyof typeof grouped] ?? []).length === 0 && (
            <p className="text-xs text-slate-400 text-center mt-4">No tasks</p>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## Step 4: TaskCard (`components/tasks/TaskCard.tsx`)

```typescript
'use client'
import { format, isPast } from 'date-fns'
import { Pencil, Briefcase, User, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIORITY_CONFIG = {
  high:   { label: 'High',   className: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  low:    { label: 'Low',    className: 'bg-green-50 text-green-700 border-green-200' },
}

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
]

export function TaskCard({ task, onEdit, onStatusChange }) {
  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed'

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Priority + Edit */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', priority.className)}>
          {priority.label}
        </span>
        <button onClick={() => onEdit(task)} className="text-slate-400 hover:text-slate-700 p-0.5">
          <Pencil size={12} />
        </button>
      </div>

      {/* Title */}
      <h4 className={cn('text-sm font-medium text-slate-900', task.status === 'completed' && 'line-through text-slate-400')}>
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
      )}

      {/* Meta */}
      <div className="mt-2 space-y-1">
        {task.case && (
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Briefcase size={11} />
            <span className="truncate font-mono">{task.case.caseNumber ?? 'Case'}</span>
          </p>
        )}
        {task.client && (
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <User size={11} />
            {task.client.fullName}
          </p>
        )}
        {task.dueDate && (
          <p className={cn('text-xs flex items-center gap-1', isOverdue ? 'text-red-600 font-medium' : 'text-slate-500')}>
            <Calendar size={11} />
            {isOverdue ? 'Overdue: ' : ''}
            {format(new Date(task.dueDate), 'dd MMM yyyy')}
          </p>
        )}
      </div>

      {/* Status change */}
      {onStatusChange && (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <select
            value={task.status}
            onChange={e => onStatusChange(e.target.value)}
            className="text-xs text-slate-600 bg-transparent cursor-pointer hover:text-indigo-600 outline-none"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
```

---

## Step 5: TaskForm (`components/tasks/TaskForm.tsx`)

```typescript
'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TASK_PRIORITY, TASK_STATUS } from '@/lib/constants'

const taskSchema = z.object({
  title:       z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority:    z.enum(['low', 'medium', 'high']).default('medium'),
  status:      z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  dueDate:     z.string().optional(),
  assignedTo:  z.string().optional(),
  caseSearch:  z.string().optional(),
  clientSearch: z.string().optional(),
  caseId:      z.string().optional(),
  clientId:    z.string().optional(),
})

type TaskValues = z.infer<typeof taskSchema>

export function TaskForm({ defaultValues, teamMembers, onSuccess, onCancel }) {
  const [saving, setSaving] = useState(false)
  const [caseQuery, setCaseQuery] = useState('')
  const [caseResults, setCaseResults] = useState([])
  const [selectedCase, setSelectedCase] = useState(defaultValues?.case ?? null)
  const [selectedClient, setSelectedClient] = useState(defaultValues?.client ?? null)
  const [clientQuery, setClientQuery] = useState('')
  const [clientResults, setClientResults] = useState([])

  const isEdit = !!defaultValues?.id

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      dueDate: defaultValues.dueDate ? new Date(defaultValues.dueDate).toISOString().split('T')[0] : '',
    } : {
      priority: 'medium',
      status: 'pending',
    }
  })

  const searchCases = async (q: string) => {
    if (q.length < 2) return
    const res = await fetch(`/api/cases/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setCaseResults(data)
  }

  const searchClients = async (q: string) => {
    if (q.length < 2) return
    const res = await fetch(`/api/clients/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setClientResults(data)
  }

  const onSubmit = async (values: TaskValues) => {
    setSaving(true)
    try {
      const url = isEdit ? `/api/tasks/${defaultValues.id}` : '/api/tasks'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          caseId: selectedCase?.id,
          clientId: selectedClient?.id,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(isEdit ? 'Task updated' : 'Task created')
      onSuccess()
    } catch {
      toast.error('Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div>
        <Label>Title *</Label>
        <Input {...register('title')} placeholder="What needs to be done?" />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <Label>Description</Label>
        <Textarea {...register('description')} rows={3} placeholder="Optional details…" />
      </div>

      {/* Priority + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Due date + Assign To */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Due Date</Label>
          <Input type="date" {...register('dueDate')} />
        </div>
        <div>
          <Label>Assign To</Label>
          <Controller
            control={control}
            name="assignedTo"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger><SelectValue placeholder="Assign to…" /></SelectTrigger>
                <SelectContent>
                  {teamMembers.map(m => (
                    <SelectItem key={m.id} value={m.userId ?? m.id}>{m.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Link Case (search) */}
      <div>
        <Label>Link Case (optional)</Label>
        {selectedCase ? (
          <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-md text-sm">
            <span className="text-indigo-700">{selectedCase.caseNumber ?? 'Case'} — {selectedCase.firstParty}</span>
            <button type="button" onClick={() => setSelectedCase(null)} className="text-indigo-400 hover:text-indigo-700">×</button>
          </div>
        ) : (
          <div className="relative">
            <Input
              placeholder="Search cases…"
              value={caseQuery}
              onChange={e => { setCaseQuery(e.target.value); searchCases(e.target.value) }}
            />
            {caseResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-md mt-1">
                {caseResults.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                    onClick={() => { setSelectedCase(c); setCaseResults([]); setCaseQuery('') }}
                  >
                    <span className="font-mono">{c.caseNumber}</span> — {c.firstParty}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Link Client (search) */}
      <div>
        <Label>Link Client (optional)</Label>
        {selectedClient ? (
          <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-md text-sm">
            <span className="text-indigo-700">{selectedClient.fullName}</span>
            <button type="button" onClick={() => setSelectedClient(null)} className="text-indigo-400 hover:text-indigo-700">×</button>
          </div>
        ) : (
          <div className="relative">
            <Input
              placeholder="Search clients…"
              value={clientQuery}
              onChange={e => { setClientQuery(e.target.value); searchClients(e.target.value) }}
            />
            {clientResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-md mt-1">
                {clientResults.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                    onClick={() => { setSelectedClient(c); setClientResults([]); setClientQuery('') }}
                  >
                    {c.fullName} {c.mobile && `— ${c.mobile}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete (edit mode only) */}
      {isEdit && (
        <div className="pt-2">
          <button
            type="button"
            className="text-xs text-red-500 hover:text-red-700"
            onClick={async () => {
              await fetch(`/api/tasks/${defaultValues.id}`, { method: 'DELETE' })
              toast.success('Task deleted')
              onSuccess()
            }}
          >
            Delete task
          </button>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Create Task'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
```

---

## API Routes

### `app/api/tasks/route.ts`
```typescript
// GET: list tasks (with optional status filter)
// POST: create task
//   Body: { title, description, priority, status, dueDate, assignedTo, caseId, clientId }
//   Validates with taskSchema (Zod)
```

### `app/api/tasks/[id]/route.ts`
```typescript
// PATCH: update task (status, title, priority, etc.)
// DELETE: delete task
// Verify: task.profileId === userId
```

### `app/api/cases/search/route.ts`
```typescript
// GET ?q=searchterm
// Returns: [{ id, caseNumber, firstParty, oppositeParty }]
// Max 10 results
// Used by task form + reminder form for case linking
```

### `app/api/clients/search/route.ts`
```typescript
// GET ?q=searchterm
// Returns: [{ id, fullName, mobile, email }]
// Max 10 results
```

---

## Verification Checklist
- [ ] Kanban board shows 3 columns (pending / in progress / completed)
- [ ] Task card shows title, priority badge, due date, linked case/client
- [ ] Overdue tasks show due date in red
- [ ] Status dropdown in task card updates status via API
- [ ] Edit task opens pre-filled form in slide-over
- [ ] Case search autocomplete works in task form
- [ ] Client search autocomplete works in task form
- [ ] Delete task from edit form works
- [ ] Mobile: tabs instead of kanban columns
- [ ] Completed tasks show strikethrough title
