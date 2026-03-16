'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { COURT_TYPES, DEFAULT_FIXED_FOR, CASE_STATUS } from '@/lib/constants'
import type { Case } from '@prisma/client'

const caseSchema = z.object({
  courtType: z.string().optional(),
  courtName: z.string().optional(),
  courtNo: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  caseNumber: z.string().optional(),
  cnrNumber: z.string().optional(),
  referenceNo: z.string().optional(),
  fileNo: z.string().optional(),
  fileName: z.string().optional(),
  year: z.string().optional(),
  firstParty: z.string().optional(),
  oppositeParty: z.string().optional(),
  caseType: z.string().optional(),
  underSection: z.string().optional(),
  policeStation: z.string().optional(),
  firNumber: z.string().optional(),
  judgeName: z.string().optional(),
  company: z.string().optional(),
  empanelment: z.string().optional(),
  comments: z.string().optional(),
  filingDate: z.string().optional(),
  previousDate: z.string().optional(),
  nextDate: z.string().optional(),
  fixedFor: z.string().optional(),
  status: z.enum(['running', 'decided', 'abandoned']).default('running'),
  isImportant: z.boolean().default(false),
  briefFacts: z.string().optional(),
  relevantLaws: z.string().optional(),
})

type CaseFormValues = z.infer<typeof caseSchema>

interface CaseFormProps {
  initialData?: Partial<Case>
  caseId?: string
}

export function CaseForm({ initialData, caseId }: CaseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cnrLoading, setCnrLoading] = useState(false)
  const isEdit = !!caseId

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      courtType: initialData?.courtType ?? '',
      courtName: initialData?.courtName ?? '',
      courtNo: initialData?.courtNo ?? '',
      state: initialData?.state ?? '',
      district: initialData?.district ?? '',
      caseNumber: initialData?.caseNumber ?? '',
      cnrNumber: initialData?.cnrNumber ?? '',
      referenceNo: initialData?.referenceNo ?? '',
      fileNo: initialData?.fileNo ?? '',
      fileName: initialData?.fileName ?? '',
      year: initialData?.year?.toString() ?? '',
      firstParty: initialData?.firstParty ?? '',
      oppositeParty: initialData?.oppositeParty ?? '',
      caseType: initialData?.caseType ?? '',
      underSection: initialData?.underSection ?? '',
      policeStation: initialData?.policeStation ?? '',
      firNumber: initialData?.firNumber ?? '',
      judgeName: initialData?.judgeName ?? '',
      company: initialData?.company ?? '',
      empanelment: initialData?.empanelment ?? '',
      comments: initialData?.comments ?? '',
      filingDate: initialData?.filingDate ? new Date(initialData.filingDate).toISOString().split('T')[0] : '',
      previousDate: initialData?.previousDate ? new Date(initialData.previousDate).toISOString().split('T')[0] : '',
      nextDate: initialData?.nextDate ? new Date(initialData.nextDate).toISOString().split('T')[0] : '',
      fixedFor: initialData?.fixedFor ?? '',
      status: (initialData?.status as 'running' | 'decided' | 'abandoned') ?? 'running',
      isImportant: initialData?.isImportant ?? false,
      briefFacts: initialData?.briefFacts ?? '',
      relevantLaws: initialData?.relevantLaws ?? '',
    },
  })

  const cnrNumber = watch('cnrNumber')

  const handleCnrLookup = async () => {
    if (!cnrNumber?.trim()) {
      toast.error('Enter a CNR number first')
      return
    }
    setCnrLoading(true)
    try {
      const res = await fetch('/api/courts/fetch-by-cnr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnr: cnrNumber }),
      })
      if (!res.ok) throw new Error('CNR lookup failed')
      const data = await res.json()
      if (data.caseData) {
        const cd = data.caseData
        if (cd.caseNumber) setValue('caseNumber', cd.caseNumber)
        if (cd.firstParty) setValue('firstParty', cd.firstParty)
        if (cd.oppositeParty) setValue('oppositeParty', cd.oppositeParty)
        if (cd.courtName) setValue('courtName', cd.courtName)
        if (cd.nextDate) setValue('nextDate', cd.nextDate)
        if (cd.fixedFor) setValue('fixedFor', cd.fixedFor)
        toast.success('Case details auto-filled from eCourts')
      }
    } catch {
      toast.error('CNR lookup failed. Please fill manually.')
    } finally {
      setCnrLoading(false)
    }
  }

  const onSubmit = async (values: CaseFormValues) => {
    setLoading(true)
    try {
      const payload = {
        ...values,
        year: values.year ? parseInt(values.year) : null,
        filingDate: values.filingDate || null,
        previousDate: values.previousDate || null,
        nextDate: values.nextDate || null,
      }
      const url = isEdit ? `/api/cases/${caseId}` : '/api/cases'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save case')
      const saved = await res.json()
      toast.success(isEdit ? 'Case updated' : 'Case created')
      router.push(`/cases/${saved.id ?? caseId}`)
    } catch {
      toast.error('Failed to save case. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Court Information */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Court Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Court Type</Label>
            <Controller
              control={control}
              name="courtType"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select court type" /></SelectTrigger>
                  <SelectContent>
                    {COURT_TYPES.map(ct => (
                      <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1">
            <Label>Court Name</Label>
            <Input placeholder="e.g. City Civil Court" {...register('courtName')} />
          </div>
          <div className="space-y-1">
            <Label>Court No.</Label>
            <Input placeholder="e.g. Court No. 5" {...register('courtNo')} />
          </div>
          <div className="space-y-1">
            <Label>State</Label>
            <Input placeholder="e.g. Telangana" {...register('state')} />
          </div>
          <div className="space-y-1">
            <Label>District</Label>
            <Input placeholder="e.g. Hyderabad" {...register('district')} />
          </div>
          <div className="space-y-1">
            <Label>Judge Name</Label>
            <Input placeholder="Judge's name" {...register('judgeName')} />
          </div>
        </div>
      </div>

      {/* Case Identifiers */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Case Identifiers</h2>

        {/* CNR Auto-fill */}
        <div className="mb-4 p-3 bg-indigo-50 rounded-md">
          <p className="text-xs text-indigo-600 font-medium mb-2">Auto-fill from eCourts using CNR</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter CNR Number (e.g. TGHC010012345672024)"
              {...register('cnrNumber')}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCnrLookup}
              disabled={cnrLoading}
            >
              {cnrLoading ? 'Looking up...' : 'Auto-fill'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Case Number</Label>
            <Input placeholder="e.g. CRL.P 1234" {...register('caseNumber')} />
          </div>
          <div className="space-y-1">
            <Label>Year</Label>
            <Input type="number" placeholder="e.g. 2024" {...register('year')} />
          </div>
          <div className="space-y-1">
            <Label>Reference No.</Label>
            <Input placeholder="Reference number" {...register('referenceNo')} />
          </div>
          <div className="space-y-1">
            <Label>File No.</Label>
            <Input placeholder="File number" {...register('fileNo')} />
          </div>
          <div className="space-y-1">
            <Label>File Name</Label>
            <Input placeholder="File name" {...register('fileName')} />
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Parties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>First Party (Petitioner / Appellant)</Label>
            <Input placeholder="First party name" {...register('firstParty')} />
          </div>
          <div className="space-y-1">
            <Label>Opposite Party (Respondent)</Label>
            <Input placeholder="Opposite party name" {...register('oppositeParty')} />
          </div>
        </div>
      </div>

      {/* Case Details */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Case Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Case Type</Label>
            <Input placeholder="e.g. Civil Suit / Criminal" {...register('caseType')} />
          </div>
          <div className="space-y-1">
            <Label>Under Section</Label>
            <Input placeholder="e.g. Sec 138 NI Act" {...register('underSection')} />
          </div>
          <div className="space-y-1">
            <Label>Police Station</Label>
            <Input placeholder="Police station (criminal cases)" {...register('policeStation')} />
          </div>
          <div className="space-y-1">
            <Label>FIR Number</Label>
            <Input placeholder="FIR number" {...register('firNumber')} />
          </div>
          <div className="space-y-1">
            <Label>Company</Label>
            <Input placeholder="Company name (if applicable)" {...register('company')} />
          </div>
          <div className="space-y-1">
            <Label>Empanelment</Label>
            <Input placeholder="e.g. Bank empanelment" {...register('empanelment')} />
          </div>
        </div>
      </div>

      {/* Dates & Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Dates & Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Filing Date</Label>
            <Input type="date" {...register('filingDate')} />
          </div>
          <div className="space-y-1">
            <Label>Previous Date</Label>
            <Input type="date" {...register('previousDate')} />
          </div>
          <div className="space-y-1">
            <Label>Next Date</Label>
            <Input type="date" {...register('nextDate')} />
          </div>
          <div className="space-y-1">
            <Label>Fixed For</Label>
            <Controller
              control={control}
              name="fixedFor"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_FIXED_FOR.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="decided">Decided</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Controller
              control={control}
              name="isImportant"
              render={({ field }) => (
                <Checkbox
                  id="isImportant"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isImportant" className="cursor-pointer">Mark as Important</Label>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Brief Facts & Notes</h2>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Brief Facts</Label>
            <Textarea
              placeholder="Brief facts of the case..."
              rows={4}
              {...register('briefFacts')}
            />
          </div>
          <div className="space-y-1">
            <Label>Relevant Laws</Label>
            <Textarea
              placeholder="Relevant laws and sections..."
              rows={3}
              {...register('relevantLaws')}
            />
          </div>
          <div className="space-y-1">
            <Label>Comments</Label>
            <Textarea
              placeholder="Any additional comments..."
              rows={2}
              {...register('comments')}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Case' : 'Create Case'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
