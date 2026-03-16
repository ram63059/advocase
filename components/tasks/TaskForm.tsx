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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
})

type TaskValues = z.infer<typeof taskSchema>

interface TaskFormProps {
  defaultValues?: any
  teamMembers: Array<{ id: string; fullName: string; userId: string | null }>
  onSuccess: () => void
  onCancel: () => void
}

export function TaskForm({ defaultValues, teamMembers, onSuccess, onCancel }: TaskFormProps) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [caseQuery, setCaseQuery] = useState('')
  const [caseResults, setCaseResults] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<any>(defaultValues?.case ?? null)
  const [clientQuery, setClientQuery] = useState('')
  const [clientResults, setClientResults] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(defaultValues?.client ?? null)

  const isEdit = !!defaultValues?.id

  const { register, handleSubmit, control, formState: { errors } } = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultValues
      ? {
          title: defaultValues.title,
          description: defaultValues.description ?? '',
          priority: defaultValues.priority ?? 'medium',
          status: defaultValues.status ?? 'pending',
          dueDate: defaultValues.dueDate
            ? new Date(defaultValues.dueDate).toISOString().split('T')[0]
            : '',
          assignedTo: defaultValues.assignedTo ?? '',
        }
      : { priority: 'medium', status: 'pending' },
  })

  const searchCases = async (q: string) => {
    if (q.length < 2) { setCaseResults([]); return }
    const res = await fetch(`/api/cases/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setCaseResults(data)
  }

  const searchClients = async (q: string) => {
    if (q.length < 2) { setClientResults([]); return }
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
          caseId: selectedCase?.id ?? null,
          clientId: selectedClient?.id ?? null,
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

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    setDeleting(true)
    try {
      await fetch(`/api/tasks/${defaultValues.id}`, { method: 'DELETE' })
      toast.success('Task deleted')
      onSuccess()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="What needs to be done?"
          className="mt-1"
        />
        {errors.title && (
          <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder="Optional details..."
          className="mt-1"
        />
      </div>

      {/* Priority + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
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
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            {...register('dueDate')}
            className="mt-1"
          />
        </div>
        {teamMembers.length > 0 && (
          <div>
            <Label>Assign To</Label>
            <Controller
              control={control}
              name="assignedTo"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No assignment</SelectItem>
                    {teamMembers.map(m => (
                      <SelectItem key={m.id} value={m.userId ?? m.id}>
                        {m.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
      </div>

      {/* Link Case */}
      <div>
        <Label>Link Case (optional)</Label>
        {selectedCase ? (
          <div className="mt-1 flex items-center justify-between p-2.5 bg-indigo-50 rounded-md text-sm border border-indigo-100">
            <span className="text-indigo-700 truncate">
              {selectedCase.caseNumber ?? 'Case'} — {selectedCase.firstParty}
            </span>
            <button
              type="button"
              onClick={() => setSelectedCase(null)}
              className="text-indigo-400 hover:text-indigo-700 ml-2 shrink-0 text-base leading-none"
            >
              &times;
            </button>
          </div>
        ) : (
          <div className="relative mt-1">
            <Input
              placeholder="Search cases..."
              value={caseQuery}
              onChange={e => {
                setCaseQuery(e.target.value)
                searchCases(e.target.value)
              }}
            />
            {caseResults.length > 0 && (
              <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                {caseResults.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    onClick={() => {
                      setSelectedCase(c)
                      setCaseResults([])
                      setCaseQuery('')
                    }}
                  >
                    <span className="font-mono">{c.caseNumber}</span> —{' '}
                    {c.firstParty}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Link Client */}
      <div>
        <Label>Link Client (optional)</Label>
        {selectedClient ? (
          <div className="mt-1 flex items-center justify-between p-2.5 bg-indigo-50 rounded-md text-sm border border-indigo-100">
            <span className="text-indigo-700">{selectedClient.fullName}</span>
            <button
              type="button"
              onClick={() => setSelectedClient(null)}
              className="text-indigo-400 hover:text-indigo-700 ml-2 shrink-0 text-base leading-none"
            >
              &times;
            </button>
          </div>
        ) : (
          <div className="relative mt-1">
            <Input
              placeholder="Search clients..."
              value={clientQuery}
              onChange={e => {
                setClientQuery(e.target.value)
                searchClients(e.target.value)
              }}
            />
            {clientResults.length > 0 && (
              <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                {clientResults.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    onClick={() => {
                      setSelectedClient(c)
                      setClientResults([])
                      setClientQuery('')
                    }}
                  >
                    {c.fullName}
                    {c.mobile && ` — ${c.mobile}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete (edit only) */}
      {isEdit && (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete task'}
          </button>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
