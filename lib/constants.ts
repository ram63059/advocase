export const CASE_STATUS = {
  RUNNING: 'running',
  DECIDED: 'decided',
  ABANDONED: 'abandoned',
} as const

export const COURT_TYPES = [
  { value: 'district', label: 'District & Taluka' },
  { value: 'hc', label: 'High Court' },
  { value: 'sc', label: 'Supreme Court' },
  { value: 'drt', label: 'DRT' },
  { value: 'nclt', label: 'NCLT' },
  { value: 'consumer', label: 'Consumer Forum' },
  { value: 'other', label: 'Other' },
] as const

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export const REMINDER_FREQUENCY = {
  ONCE: 'once',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const

export const PAYMENT_MODE = [
  'Cash', 'UPI', 'Bank Transfer', 'Cheque'
] as const

export const ORDER_TYPE = {
  INTERIM: 'interim',
  FINAL: 'final',
} as const

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  DONE: 'done',
  ERROR: 'error',
} as const

export const DEFAULT_FIXED_FOR = [
  'For Arguments',
  'For Orders',
  'For Evidence',
  'For Filing Counter',
  'For Filing Affidavit',
  'For Framing Issues',
  'For Hearing',
  'For Filing',
  'Date Awaited',
  'Next Date',
] as const

export const PLAN_LIMITS = {
  free: { cases: 50, clients: 20, teamMembers: 0, storage: 100 },
  basic: { cases: 500, clients: 200, teamMembers: 2, storage: 1024 },
  pro: { cases: Infinity, clients: Infinity, teamMembers: 10, storage: 10240 },
} as const
