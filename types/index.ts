export type {
  Profile, Case, Client, Task, Reminder,
  CaseHistory, CaseOrder, CaseNote, CaseDocument,
  CaseClient, OpposeCounsel, Fee, LinkedCase,
  TeamMember, CourtRegistered, CustomField, ColorCode
} from '@prisma/client'

import type {
  Case, Client, CaseClient, CaseHistory, CaseNote,
  CaseDocument, CaseOrder, Fee, OpposeCounsel
} from '@prisma/client'

// Extended types with relations
export type CaseWithRelations = Case & {
  clients: (CaseClient & { client: Client })[]
  history: CaseHistory[]
  notes: CaseNote[]
  documents: CaseDocument[]
  orders: CaseOrder[]
  fees: Fee[]
  oppositeCouns: OpposeCounsel[]
}

export type CaseListItem = Pick<Case,
  'id' | 'caseNumber' | 'cnrNumber' | 'firstParty' | 'oppositeParty'
  | 'courtName' | 'courtType' | 'nextDate' | 'fixedFor' | 'status'
  | 'isImportant' | 'caseType' | 'year'
>

export type DashboardStats = {
  total: number
  today: number
  tomorrow: number
  awaited: number
  decided: number
}

export type CaseFilters = {
  status?: string
  courtType?: string
  nextDateFrom?: Date
  nextDateTo?: Date
  search?: string
  fixedFor?: string
  clientId?: string
  isImportant?: boolean
  page?: number
  limit?: number
}
