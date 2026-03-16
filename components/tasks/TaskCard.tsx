'use client'
import { format, isPast } from 'date-fns'
import { Pencil, Briefcase, User, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIORITY_CONFIG = {
  high:   { label: 'High',   className: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  low:    { label: 'Low',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

interface TaskCardProps {
  task: any
  onEdit: (task: any) => void
  onStatusChange?: (status: string) => void
}

export function TaskCard({ task, onEdit, onStatusChange }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
  const isOverdue =
    task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed'

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Priority + Edit */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full border',
            priority.className
          )}
        >
          {priority.label}
        </span>
        <button
          onClick={() => onEdit(task)}
          className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
          title="Edit task"
        >
          <Pencil size={12} />
        </button>
      </div>

      {/* Title */}
      <h4
        className={cn(
          'text-sm font-medium text-slate-900',
          task.status === 'completed' && 'line-through text-slate-400'
        )}
      >
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
          <p
            className={cn(
              'text-xs flex items-center gap-1',
              isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
            )}
          >
            <Calendar size={11} />
            {isOverdue && 'Overdue: '}
            {format(new Date(task.dueDate), 'dd MMM yyyy')}
          </p>
        )}
        {task.assignedTo && (
          <p className="text-xs text-slate-400">
            Assigned to: {task.assignedTo}
          </p>
        )}
      </div>

      {/* Status change */}
      {onStatusChange && (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <select
            value={task.status}
            onChange={e => onStatusChange(e.target.value)}
            className="text-xs text-slate-600 bg-transparent cursor-pointer hover:text-indigo-600 outline-none w-full"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
