import { cn } from '@/lib/utils'

const statusConfig = {
  running:   { label: 'Running',   className: 'bg-secondary text-foreground border border-border' },
  decided:   { label: 'Decided',   className: 'bg-secondary text-muted-foreground border border-border' },
  abandoned: { label: 'Abandoned', className: 'bg-secondary text-muted-foreground border border-border' },
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
