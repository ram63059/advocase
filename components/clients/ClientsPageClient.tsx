'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientCard } from './ClientCard'
import { ClientForm } from './ClientForm'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EmptyState } from '@/components/shared/EmptyState'

interface ClientsPageClientProps {
  clients: any[]
  total: number
  totalPages: number
  currentPage: number
  searchParams: { search?: string; page?: string }
  showNewForm: boolean
}

export function ClientsPageClient({
  clients,
  total,
  totalPages,
  currentPage,
  searchParams,
  showNewForm,
}: ClientsPageClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(showNewForm)
  const [search, setSearch] = useState(searchParams.search ?? '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    router.push(`/clients?${params.toString()}`)
  }

  const handleClientAdded = () => {
    setFormOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} total clients</p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={14} className="mr-1.5" /> Add Client
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, mobile, email..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" className="h-8">Search</Button>
        {searchParams.search && (
          <Button type="button" variant="ghost" size="sm" className="h-8"
            onClick={() => { setSearch(''); router.push('/clients') }}>
            Clear
          </Button>
        )}
      </form>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description={searchParams.search ? `No clients match "${searchParams.search}"` : 'Add your first client to link them to cases.'}
          action={!searchParams.search ? { label: 'Add Client', onClick: () => setFormOpen(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {clients.map(client => <ClientCard key={client.id} client={client} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams as any)
              params.set('page', String(currentPage - 1))
              router.push(`/clients?${params.toString()}`)
            }}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams as any)
              params.set('page', String(currentPage + 1))
              router.push(`/clients?${params.toString()}`)
            }}>Next</Button>
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Client</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <ClientForm onSuccess={handleClientAdded} onCancel={() => setFormOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
