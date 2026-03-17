'use client'
import { format, isPast } from 'date-fns'
import { Pencil, Briefcase, User, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIORITY_CONFIG = {
  high:   { label: 'High',   className: 'bg-secondary text-foreground border-border' },
  medium: { label: 'Medium', className: 'bg-secondary text-muted-foreground border-border' },
  low:    { label: 'Low',    className: 'bg-secondary text-muted-foreground border-border' },
}

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
]

interface TaskCardProps {
  task: any
  onEdit: (task: any) => void
  onStatusChange?: (status: string) => void
}

export function TaskCard({ task, onEdit, onStatusChange }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed'

  return (
    <div className="bg-card rounded-xl border border-border p-3 hover:bg-secondary/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', priority.className)}>
          {priority.label}
        </span>
        <button onClick={() => onEdit(task)}
          className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors" title="Edit task">
          <Pencil size={12} />
        </button>
      </div>

      <h4 className={cn('text-sm font-medium text-foreground',
        task.status === 'completed' && 'line-through text-muted-foreground')}>
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="mt-2 space-y-1">
        {task.case && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Briefcase size={10} />
            <span className="truncate font-mono">{task.case.caseNumber ?? 'Case'}</span>
          </p>
        )}
        {task.client && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <User size={10} />
            {task.client.fullName}
          </p>
        )}
        {task.dueDate && (
          <p className={cn('text-xs flex items-center gap-1',
            isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
            <Calendar size={10} />
            {isOverdue && 'Overdue: '}
            {format(new Date(task.dueDate), 'dd MMM yyyy')}
          </p>
        )}
        {task.assignedTo && (
          <p className="text-xs text-muted-foreground">Assigned to: {task.assignedTo}</p>
        )}
      </div>

      {onStatusChange && (
        <div className="mt-3 pt-2 border-t border-border">
          <select value={task.status} onChange={e => onStatusChange(e.target.value)}
            className="text-xs text-muted-foreground bg-transparent cursor-pointer hover:text-foreground outline-none w-full">
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
