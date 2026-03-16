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
        <Link href={`/cases/${row.original.id}`} className="font-mono text-sm text-indigo-600 hover:underline">
          {row.original.caseNumber ?? '—'}
        </Link>
      ),
    },
    {
      accessorKey: 'firstParty',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-slate-900">
          First Party
          {column.getIsSorted() === 'asc' ? <ArrowUp size={12} /> :
           column.getIsSorted() === 'desc' ? <ArrowDown size={12} /> :
           <ArrowUpDown size={12} />}
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
        <span className="text-sm text-slate-600">{row.original.oppositeParty ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'courtName',
      header: 'Court',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 truncate max-w-32 block">{row.original.courtName ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'nextDate',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 hover:text-slate-900">
          Next Date
          {column.getIsSorted() === 'asc' ? <ArrowUp size={12} /> :
           column.getIsSorted() === 'desc' ? <ArrowDown size={12} /> :
           <ArrowUpDown size={12} />}
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
        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
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
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
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
