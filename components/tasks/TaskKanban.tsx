'use client'
import { TaskCard } from './TaskCard'

const COLUMNS = [
  { id: 'pending',     label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed',   label: 'Completed' },
]

interface TaskKanbanProps {
  grouped: { pending: any[]; in_progress: any[]; completed: any[] }
  onEdit: (task: any) => void
  onStatusChange: (taskId: string, status: string) => void
}

export function TaskKanban({ grouped, onEdit, onStatusChange }: TaskKanbanProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {COLUMNS.map(col => {
        const tasks = grouped[col.id as keyof typeof grouped] ?? []
        return (
          <div key={col.id} className="bg-secondary/40 rounded-xl border border-border p-4 min-h-64">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
              <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full border border-border">
                {tasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} onEdit={onEdit}
                  onStatusChange={(newStatus) => onStatusChange(task.id, newStatus)} />
              ))}
            </div>
            {tasks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-6">No tasks</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
