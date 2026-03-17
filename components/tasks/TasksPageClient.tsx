'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TaskKanban } from './TaskKanban'
import { TaskCard } from './TaskCard'
import { TaskForm } from './TaskForm'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface TasksPageClientProps {
  grouped: { pending: any[]; in_progress: any[]; completed: any[] }
  teamMembers: any[]
  showNewForm: boolean
}

export function TasksPageClient({ grouped, teamMembers, showNewForm }: TasksPageClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(showNewForm)
  const [editingTask, setEditingTask] = useState<any>(null)

  const totalPending = grouped.pending.length
  const totalInProgress = grouped.in_progress.length

  const handleTaskSaved = () => {
    setFormOpen(false)
    setEditingTask(null)
    router.refresh()
  }

  const openEdit = (task: any) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleStatusChange = (taskId: string, status: string) => {
    fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(() => router.refresh())
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalPending > 0 && <span className="font-medium text-foreground">{totalPending} pending</span>}
            {totalPending > 0 && totalInProgress > 0 && ' · '}
            {totalInProgress > 0 && <span className="font-medium text-foreground">{totalInProgress} in progress</span>}
            {totalPending === 0 && totalInProgress === 0 && 'All caught up!'}
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingTask(null); setFormOpen(true) }}>
          <Plus size={14} className="mr-1.5" /> Add Task
        </Button>
      </div>

      <div className="hidden md:block">
        <TaskKanban grouped={grouped} onEdit={openEdit} onStatusChange={handleStatusChange} />
      </div>

      <div className="md:hidden">
        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              Pending{grouped.pending.length > 0 ? ` (${grouped.pending.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex-1">
              In Progress{grouped.in_progress.length > 0 ? ` (${grouped.in_progress.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">Done</TabsTrigger>
          </TabsList>
          {(['pending', 'in_progress', 'completed'] as const).map(status => (
            <TabsContent key={status} value={status} className="mt-4 space-y-2">
              {grouped[status].map(task => (
                <TaskCard key={task.id} task={task} onEdit={openEdit}
                  onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)} />
              ))}
              {grouped[status].length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-10">No tasks here.</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Sheet open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditingTask(null) } }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingTask ? 'Edit Task' : 'New Task'}</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <TaskForm defaultValues={editingTask} teamMembers={teamMembers}
              onSuccess={handleTaskSaved}
              onCancel={() => { setFormOpen(false); setEditingTask(null) }} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
