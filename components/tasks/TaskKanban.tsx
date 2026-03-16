'use client'
import { TaskCard } from './TaskCard'

const COLUMNS = [
  { id: 'pending',     label: 'Pending',     headerClass: 'bg-amber-50 border-amber-200',  dotClass: 'bg-amber-400' },
  { id: 'in_progress', label: 'In Progress',  headerClass: 'bg-blue-50 border-blue-200',    dotClass: 'bg-blue-400' },
  { id: 'completed',   label: 'Completed',    headerClass: 'bg-emerald-50 border-emerald-200', dotClass: 'bg-emerald-400' },
]

interface TaskKanbanProps {
  grouped: {
    pending: any[]
    in_progress: any[]
    completed: any[]
  }
  onEdit: (task: any) => void
  onStatusChange: (taskId: string, status: string) => void
}

export function TaskKanban({ grouped, onEdit, onStatusChange }: TaskKanbanProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {COLUMNS.map(col => {
        const tasks = grouped[col.id as keyof typeof grouped] ?? []
        return (
          <div
            key={col.id}
            className={`rounded-lg border ${col.headerClass} p-4 min-h-64`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.dotClass}`} />
                <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
              </div>
              <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                {tasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEdit}
                  onStatusChange={(newStatus) => onStatusChange(task.id, newStatus)}
                />
              ))}
            </div>

            {tasks.length === 0 && (
              <p className="text-xs text-slate-400 text-center mt-6">No tasks</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
