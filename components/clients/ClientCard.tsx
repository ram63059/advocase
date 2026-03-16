'use client'
import Link from 'next/link'
import { Phone, Mail, Briefcase, Receipt } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

interface ClientCardProps {
  client: {
    id: string
    fullName: string
    email: string | null
    mobile: string | null
    cases: { id: string }[]
    fees: { amount: any }[]
  }
}

export function ClientCard({ client }: ClientCardProps) {
  const totalFees = client.fees.reduce((sum, f) => sum + Number(f.amount), 0)
  const runningCases = client.cases.length

  return (
    <Link
      href={`/clients/${client.id}`}
      className="block bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-medium">
            {getInitials(client.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 truncate">{client.fullName}</h3>
          {client.mobile && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone size={11} /> {client.mobile}
            </p>
          )}
          {client.email && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
              <Mail size={11} /> {client.email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Briefcase size={12} />
          {runningCases} running {runningCases === 1 ? 'case' : 'cases'}
        </span>
        {totalFees > 0 && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Receipt size={12} />
            {formatCurrency(totalFees)}
          </span>
        )}
      </div>
    </Link>
  )
}
