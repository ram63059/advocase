import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Breadcrumb { label: string; href?: string }

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumb?: Breadcrumb[]
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-1">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={14} className="text-slate-400" />}
                {item.href ? (
                  <Link href={item.href} className="text-sm text-slate-500 hover:text-slate-700">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-sm text-slate-500">{item.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
