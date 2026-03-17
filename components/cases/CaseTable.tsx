'use client'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, type ColumnDef, type SortingState
} from '@tanstack/react-table'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { CaseStatusBadge } from './CaseStatusBadge'
import { formatDate } from '@/lib/utils'

type CaseRow = {
  id: string
  caseNumber: string | null
  cnrNumber: string | null
  firstParty: string | null
  oppositeParty: string | null
  courtName: string | null
  nextDate: Date | null
  fixedFor: string | null
  status: string
  caseType: string | null
}

export function CaseTable({ cases }: { cases: CaseRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<CaseRow>[] = [
    {
      accessorKey: 'caseNumber',
      header: 'Case No.',
      cell: ({ row }) => (
        <Link href={`/cases/${row.original.id}`} className="font-mono text-sm text-foreground font-medium hover:underline">
          {row.original.caseNumber ?? '—'}
        </Link>
      ),
    },
    {
      accessorKey: 'firstParty',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-foreground text-muted-foreground">
          First Party
          {column.getIsSorted() === 'asc' ? <ArrowUp size={11} /> :
           column.getIsSorted() === 'desc' ? <ArrowDown size={11} /> :
           <ArrowUpDown size={11} />}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.firstParty ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'oppositeParty',
      header: 'Opposite Party',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.oppositeParty ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'courtName',
      header: 'Court',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate max-w-32 block">{row.original.courtName ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'nextDate',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-foreground text-muted-foreground">
          Next Date
          {column.getIsSorted() === 'asc' ? <ArrowUp size={11} /> :
           column.getIsSorted() === 'desc' ? <ArrowDown size={11} /> :
           <ArrowUpDown size={11} />}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.nextDate ? formatDate(row.original.nextDate) : 'Awaited'}</span>
      ),
    },
    {
      accessorKey: 'fixedFor',
      header: 'Fixed For',
      cell: ({ row }) => (
        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
          {row.original.fixedFor ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <CaseStatusBadge status={row.original.status} />,
    },
  ]

  const table = useReactTable({
    data: cases,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-secondary/50">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-border hover:bg-secondary/40 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
