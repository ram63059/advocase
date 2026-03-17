'use client'
import Link from 'next/link'
import { Phone, Mail, Briefcase, Receipt } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
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
      className="block bg-card rounded-xl border border-border p-4 hover:bg-secondary/30 transition-all"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-secondary text-foreground text-sm font-medium">
            {getInitials(client.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground text-sm truncate">{client.fullName}</h3>
          {client.mobile && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone size={10} /> {client.mobile}
            </p>
          )}
          {client.email && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
              <Mail size={10} /> {client.email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Briefcase size={11} />
          {runningCases} running {runningCases === 1 ? 'case' : 'cases'}
        </span>
        {totalFees > 0 && (
          <span className="flex items-center gap-1 text-foreground font-medium">
            <Receipt size={11} />
            {formatCurrency(totalFees)}
          </span>
        )}
      </div>
    </Link>
  )
}
