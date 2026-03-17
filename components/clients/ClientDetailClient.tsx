'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Phone, Mail, MapPin, Edit, Trash2, Briefcase, Calendar,
  Receipt, MessageSquare, CheckCircle, Clock
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ClientForm } from './ClientForm'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string | Date | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusBadge(status: string) {
  return 'bg-secondary text-muted-foreground border-border'
}

interface ClientDetailClientProps {
  client: any
}

export function ClientDetailClient({ client }: ClientDetailClientProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const runningCases = client.cases.filter((cc: any) => cc.case.status === 'running')
  const closedCases = client.cases.filter((cc: any) => cc.case.status !== 'running')
  const totalFees = client.fees
    .filter((f: any) => !f.isExpense)
    .reduce((sum: number, f: any) => sum + Number(f.amount), 0)

  const handleDelete = async () => {
    if (!confirm(`Delete client "${client.fullName}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Delete failed')
      }
      toast.success('Client deleted')
      router.push('/clients')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete client')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarFallback className="bg-secondary text-foreground text-lg font-semibold">
                {getInitials(client.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-foreground">{client.fullName}</h1>
                {client.dpdpConsentAt && (
                  <Badge variant="outline" className="text-xs bg-secondary text-foreground border-border gap-1">
                    <CheckCircle size={11} /> DPDP Consent
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {client.mobile && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} /> {client.mobile}
                  </span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={13} /> {client.email}
                  </span>
                )}
                {client.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {client.address}
                  </span>
                )}
              </div>
              {totalFees > 0 && (
                <p className="mt-2 text-sm font-medium text-foreground">
                  Total Received: {formatCurrency(totalFees)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit size={14} className="mr-1" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 size={14} className="mr-1" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cases">
        <TabsList className="bg-secondary">
          <TabsTrigger value="cases" className="gap-1.5">
            <Briefcase size={14} /> Cases ({client.cases.length})
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-1.5">
            <Receipt size={14} /> Fee History ({client.fees.length})
          </TabsTrigger>
          <TabsTrigger value="message" className="gap-1.5">
            <MessageSquare size={14} /> Message
          </TabsTrigger>
        </TabsList>

        {/* Cases Tab */}
        <TabsContent value="cases" className="mt-4 space-y-4">
          {/* Running cases */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground" />
              Running Cases ({runningCases.length})
            </h3>
            {runningCases.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No running cases.</p>
            ) : (
              <div className="space-y-2">
                {runningCases.map((cc: any) => (
                  <CaseRow key={cc.id} caseData={cc.case} />
                ))}
              </div>
            )}
          </div>

          {/* Decided/Abandoned cases */}
          {closedCases.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <CheckCircle size={14} className="text-muted-foreground" />
                Decided / Abandoned ({closedCases.length})
              </h3>
              <div className="space-y-2">
                {closedCases.map((cc: any) => (
                  <CaseRow key={cc.id} caseData={cc.case} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Fee History Tab */}
        <TabsContent value="fees" className="mt-4">
          {client.fees.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No fee records yet.</p>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Case</th>
                    <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Mode</th>
                    <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {client.fees.map((fee: any) => (
                    <tr key={fee.id} className="hover:bg-secondary/30">
                      <td className="py-2.5 px-4 text-muted-foreground">{formatDate(fee.feeDate)}</td>
                      <td className="py-2.5 px-4">
                        {fee.case ? (
                          <Link
                            href={`/cases/${fee.case.id}`}
                            className="text-foreground hover:underline text-xs"
                          >
                            {fee.case.caseNumber ?? 'View'}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">{fee.description ?? '-'}</td>
                      <td className="py-2.5 px-4 text-muted-foreground text-xs">{fee.paymentMode ?? '-'}</td>
                      <td className={`py-2.5 px-4 text-right font-medium ${fee.isExpense ? 'text-destructive' : 'text-foreground'}`}>
                        {fee.isExpense ? '-' : ''}{formatCurrency(Number(fee.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border bg-secondary/50">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-4 text-sm font-medium text-foreground text-right">
                      Total Received
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-foreground">
                      {formatCurrency(totalFees)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Message Tab */}
        <TabsContent value="message" className="mt-4">
          <MessageComposer client={client} />
        </TabsContent>
      </Tabs>

      {/* Edit sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Client</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <ClientForm
              defaultValues={{
                id: client.id,
                fullName: client.fullName,
                email: client.email ?? '',
                mobile: client.mobile ?? '',
                address: client.address ?? '',
                dpdpConsent: !!client.dpdpConsentAt,
              }}
              onSuccess={() => { setEditOpen(false); router.refresh() }}
              onCancel={() => setEditOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function CaseRow({ caseData }: { caseData: any }) {
  return (
    <Link
      href={`/cases/${caseData.id}`}
      className="flex items-center justify-between p-3 bg-card rounded-xl border border-border hover:bg-secondary/30 transition-all"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {caseData.firstParty} vs {caseData.oppositeParty}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {caseData.caseNumber ? `${caseData.caseNumber} • ` : ''}
          {caseData.courtName ?? ''}
          {caseData.caseType ? ` • ${caseData.caseType}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-3 shrink-0">
        {caseData.nextDate && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar size={11} />
            {new Date(caseData.nextDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
        )}
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-secondary text-muted-foreground border-border">
          {caseData.status}
        </span>
      </div>
    </Link>
  )
}

function MessageComposer({ client }: { client: any }) {
  const [email, setEmail] = useState(client.email ?? '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error('Email is required'); return }
    setSending(true)
    try {
      const res = await fetch('/api/notify/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, subject, body }),
      })
      if (!res.ok) throw new Error('Failed to send')
      toast.success('Message sent successfully')
      setSubject('')
      setBody('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 max-w-xl">
      <h3 className="text-sm font-medium text-foreground mb-4">Send Email to Client</h3>
      <form onSubmit={handleSend} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="client@example.com"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="Subject"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            placeholder="Type your message..."
          />
        </div>
        <Button type="submit" disabled={sending || !email}>
          {sending ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </div>
  )
}
