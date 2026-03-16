import { cn } from '@/lib/utils'

const statusConfig = {
  running:   { label: 'Running',   className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  decided:   { label: 'Decided',   className: 'bg-green-50 text-green-700 border border-green-200' },
  abandoned: { label: 'Abandoned', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

interface CaseStatusBadgeProps {
  status: string
  className?: string
}

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.running
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.className, className)}>
      {config.label}
    </span>
  )
}
