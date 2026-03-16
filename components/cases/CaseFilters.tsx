'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { COURT_TYPES, DEFAULT_FIXED_FOR } from '@/lib/constants'

interface FilterValues {
  caseNumber: string
  cnrNumber: string
  courtType: string
  firstParty: string
  oppositeParty: string
  fixedFor: string
  nextDateFrom: string
  nextDateTo: string
  year: string
}

interface CaseFiltersProps {
  open: boolean
  onClose: () => void
  onApply: (filters: Record<string, string | undefined>) => void
  initialValues: Record<string, string | undefined>
}

export function CaseFilters({ open, onClose, onApply, initialValues }: CaseFiltersProps) {
  const { register, control, handleSubmit, reset } = useForm<FilterValues>({
    defaultValues: {
      caseNumber: initialValues.caseNumber ?? '',
      cnrNumber: initialValues.cnrNumber ?? '',
      courtType: initialValues.courtType ?? '',
      firstParty: initialValues.firstParty ?? '',
      oppositeParty: initialValues.oppositeParty ?? '',
      fixedFor: initialValues.fixedFor ?? '',
      nextDateFrom: initialValues.nextDateFrom ?? '',
      nextDateTo: initialValues.nextDateTo ?? '',
      year: initialValues.year ?? '',
    },
  })

  const onSubmit = (values: FilterValues) => {
    const filters: Record<string, string | undefined> = {}
    Object.entries(values).forEach(([key, value]) => {
      if (value) filters[key] = value
    })
    onApply(filters)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Cases</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Case Number</Label>
              <Input placeholder="e.g. CRL.P 1234" {...register('caseNumber')} />
            </div>
            <div className="space-y-1">
              <Label>CNR Number</Label>
              <Input placeholder="e.g. TGHC01..." {...register('cnrNumber')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Year</Label>
              <Input placeholder="e.g. 2024" {...register('year')} />
            </div>
            <div className="space-y-1">
              <Label>Court Type</Label>
              <Controller
                control={control}
                name="courtType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="All courts" /></SelectTrigger>
                    <SelectContent>
                      {COURT_TYPES.map(ct => (
                        <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>First Party</Label>
            <Input placeholder="Search by first party name" {...register('firstParty')} />
          </div>

          <div className="space-y-1">
            <Label>Opposite Party</Label>
            <Input placeholder="Search by opposite party name" {...register('oppositeParty')} />
          </div>

          <div className="space-y-1">
            <Label>Fixed For</Label>
            <Controller
              control={control}
              name="fixedFor"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Any purpose" /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_FIXED_FOR.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Next Date From</Label>
              <Input type="date" {...register('nextDateFrom')} />
            </div>
            <div className="space-y-1">
              <Label>Next Date To</Label>
              <Input type="date" {...register('nextDateTo')} />
            </div>
          </div>
        </form>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => { reset(); onApply({}) }}>
            Reset Filters
          </Button>
          <Button onClick={handleSubmit(onSubmit)}>
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
