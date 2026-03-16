export interface ECourtsCaseDetail {
  caseNumber: string | null
  year: number | null
  courtName: string | null
  courtNo: string | null
  judgeName: string | null
  firstParty: string | null
  oppositeParty: string | null
  nextDate: Date | null
  fixedFor: string | null
  previousDate: Date | null
  filingDate: Date | null
  history: ECourtsCaseHistory[]
}

export interface ECourtsCaseHistory {
  judge: string | null
  businessOnDate: Date | null
  hearingDate: Date | null
  purpose: string | null
}

export interface ECourtsCaseListItem {
  cnrNumber: string | null
  caseNumber: string | null
  firstParty: string | null
  oppositeParty: string | null
  nextDate: Date | null
  fixedFor: string | null
  courtName: string | null
  courtNo: string | null
  judgeName: string | null
}

export interface CauseListEntry {
  serialNo: string
  caseNumber: string
  petitioner: string
  respondent: string
  advocate: string
  purpose: string
  courtNo: string
}

export interface District {
  id: string
  name: string
}

export interface Complex {
  id: string
  name: string
  establishment: string
}

export interface ECourtState {
  state_id: string
  state_code: string
  state_name: string
}
