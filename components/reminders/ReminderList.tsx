'use client'
import { format } from 'date-fns'
import { Pencil, Trash2, Mail, Smartphone, Briefcase, User, Bell } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const FREQUENCY_LABELS: Record<string, string> = {
  once: 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
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
    <div
      key={reminder.id}
      className={cn(
        'flex items-start gap-4 px-5 py-4',
        !reminder.isActive && 'opacity-60'
      )}
    >
      {/* Bell icon */}
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          reminder.isActive ? 'bg-amber-100' : 'bg-slate-100'
        )}
      >
        <Bell
          size={16}
          className={reminder.isActive ? 'text-amber-600' : 'text-slate-400'}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{reminder.title}</p>

        <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
          <span className="bg-slate-100 px-2 py-0.5 rounded-full">
            {FREQUENCY_LABELS[reminder.frequency] ?? reminder.frequency}
          </span>
          {reminder.startDate && (
            <span>From: {format(new Date(reminder.startDate), 'dd MMM yyyy')}</span>
          )}
          {reminder.reminderTime && <span>at {reminder.reminderTime}</span>}
          {reminder.endDate && (
            <span>Until: {format(new Date(reminder.endDate), 'dd MMM yyyy')}</span>
          )}
          {reminder.dayOfWeek && (
            <span className="capitalize">{reminder.dayOfWeek}s</span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-1">
          {reminder.sendEmail && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Mail size={11} /> {reminder.emailTo ?? 'Email'}
            </span>
          )}
          {reminder.sendSms && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Smartphone size={11} /> {reminder.mobileTo ?? 'SMS'}
            </span>
          )}
          {reminder.case && (
            <span className="text-xs text-indigo-600 flex items-center gap-1">
              <Briefcase size={11} />
              <span className="font-mono">{reminder.case.caseNumber ?? 'Case'}</span>
            </span>
          )}
          {reminder.client && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <User size={11} /> {reminder.client.fullName}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <Switch
          checked={reminder.isActive}
          onCheckedChange={() => onToggleActive(reminder.id, reminder.isActive)}
        />
        <button
          onClick={() => onEdit(reminder)}
          className="text-slate-400 hover:text-slate-700 transition-colors"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => {
            if (confirm('Delete this reminder?')) onDelete(reminder.id)
          }}
          className="text-slate-400 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          <div className="px-5 py-2.5 bg-slate-50">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Active ({active.length})
            </p>
          </div>
          {active.map(renderReminder)}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          <div className="px-5 py-2.5 bg-slate-50">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Inactive ({inactive.length})
            </p>
          </div>
          {inactive.map(renderReminder)}
        </div>
      )}
    </div>
  )
}
