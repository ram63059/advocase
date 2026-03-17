'use client'
import { format } from 'date-fns'
import { Pencil, Trash2, Mail, Smartphone, Briefcase, User, Bell } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const FREQUENCY_LABELS: Record<string, string> = {
  once: 'One-time', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
}

interface ReminderListProps {
  reminders: any[]
  onEdit: (reminder: any) => void
  onToggleActive: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}

export function ReminderList({ reminders, onEdit, onToggleActive, onDelete }: ReminderListProps) {
  const active = reminders.filter(r => r.isActive)
  const inactive = reminders.filter(r => !r.isActive)

  const renderReminder = (reminder: any) => (
    <div key={reminder.id} className={cn('flex items-start gap-4 px-5 py-4', !reminder.isActive && 'opacity-50')}>
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
        <Bell size={14} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{reminder.title}</p>
        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
          <span className="bg-secondary px-2 py-0.5 rounded-full">
            {FREQUENCY_LABELS[reminder.frequency] ?? reminder.frequency}
          </span>
          {reminder.startDate && <span>From: {format(new Date(reminder.startDate), 'dd MMM yyyy')}</span>}
          {reminder.reminderTime && <span>at {reminder.reminderTime}</span>}
          {reminder.endDate && <span>Until: {format(new Date(reminder.endDate), 'dd MMM yyyy')}</span>}
          {reminder.dayOfWeek && <span className="capitalize">{reminder.dayOfWeek}s</span>}
        </div>
        <div className="flex flex-wrap gap-3 mt-1">
          {reminder.sendEmail && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail size={10} /> {reminder.emailTo ?? 'Email'}
            </span>
          )}
          {reminder.sendSms && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Smartphone size={10} /> {reminder.mobileTo ?? 'SMS'}
            </span>
          )}
          {reminder.case && (
            <span className="text-xs text-foreground flex items-center gap-1">
              <Briefcase size={10} />
              <span className="font-mono">{reminder.case.caseNumber ?? 'Case'}</span>
            </span>
          )}
          {reminder.client && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User size={10} /> {reminder.client.fullName}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Switch checked={reminder.isActive} onCheckedChange={() => onToggleActive(reminder.id, reminder.isActive)} />
        <button onClick={() => onEdit(reminder)}
          className="text-muted-foreground hover:text-foreground transition-colors" title="Edit">
          <Pencil size={13} />
        </button>
        <button onClick={() => { if (confirm('Delete this reminder?')) onDelete(reminder.id) }}
          className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          <div className="px-5 py-2.5 bg-secondary/50 rounded-t-xl">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Active ({active.length})</p>
          </div>
          {active.map(renderReminder)}
        </div>
      )}
      {inactive.length > 0 && (
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          <div className="px-5 py-2.5 bg-secondary/50 rounded-t-xl">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Inactive ({inactive.length})</p>
          </div>
          {inactive.map(renderReminder)}
        </div>
      )}
    </div>
  )
}
