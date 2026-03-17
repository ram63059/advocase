import type {
  District,
  Complex,
  ECourtsCaseDetail,
  ECourtsCaseListItem,
  CauseListEntry,
} from './types'

const ECOURTS_BASE = 'https://services.ecourts.gov.in/ecourtindiaServices'
const TIMEOUT_MS = 10000

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

function parseECourtsDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === '-' || dateStr.trim() === '') return null
  try {
    const cleaned = dateStr.trim().replace(/\//g, '-')
    const parts = cleaned.split('-')
    if (parts.length !== 3) return null
    const [day, month, year] = parts
    const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
    return isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

function parseCNRResponse(data: any): ECourtsCaseDetail {
  const caseDetails = data.case_details ?? {}
  const status = data.case_status ?? {}
  const petitioner = data.petitioner_details?.petitioner ?? ''
  const respondent = data.respondent_details?.respondent ?? ''
  const history = data.history_of_cases ?? []

  return {
    caseNumber: caseDetails.case_type && caseDetails.reg_number
      ? `${caseDetails.case_type} ${caseDetails.reg_number}/${caseDetails.reg_year}`
      : null,
    year: caseDetails.reg_year ? parseInt(caseDetails.reg_year) : null,
    courtName: status.court_name ?? null,
    courtNo: status.court_number ?? null,
    judgeName: status.judge_name ?? null,
    firstParty: petitioner.split('\n')[0]?.trim() ?? null,
    oppositeParty: respondent.split('\n')[0]?.trim() ?? null,
    nextDate: parseECourtsDate(status.next_hearing_date),
    fixedFor: status.stage_of_case ?? null,
    previousDate: history[0] ? parseECourtsDate(history[0].hearing_date) : null,
    filingDate: parseECourtsDate(caseDetails.date_of_registration),
    history: history.map((h: any) => ({
      judge: h.judge ?? null,
      businessOnDate: parseECourtsDate(h.business_on_date),
      hearingDate: parseECourtsDate(h.hearing_date),
      purpose: h.purpose_of_hearing ?? null,
    })),
  }
}

// ─────────────────────────────────────────────
// 1. Get Districts for a State
// ─────────────────────────────────────────────
export async function getDistricts(stateCode: string): Promise<District[]> {
  try {
    const res = await fetchWithTimeout(
      `${ECOURTS_BASE}/getDistrict?state_code=${stateCode}`
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.district ?? []).map((d: any) => ({
      id: d.dist_code,
      name: d.district_name,
    }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────
// 2. Get Court Complexes for a District
// ─────────────────────────────────────────────
export async function getComplexes(stateCode: string, districtCode: string): Promise<Complex[]> {
  try {
    const res = await fetchWithTimeout(
      `${ECOURTS_BASE}/getCourts?state_code=${stateCode}&dist_code=${districtCode}`
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.courts ?? []).map((c: any) => ({
      id: c.court_code,
      name: c.court_name,
      establishment: c.establishment_code ?? '',
    }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────
// 3. Fetch Case by CNR Number
// ─────────────────────────────────────────────
export async function fetchCaseByCNR(cnr: string): Promise<ECourtsCaseDetail | null> {
  const appToken = process.env.ECOURTS_APP_TOKEN ?? ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://services.ecourts.gov.in/ecourtindia_6/',
    'Origin': 'https://services.ecourts.gov.in',
  }
  if (appToken) headers['app_token'] = appToken

  try {
    const body = new URLSearchParams({ cino: cnr, ajax_req: 'true', app_token: appToken }).toString()
    const res = await fetchWithTimeout(`${ECOURTS_BASE}/fetchCaseViaCNR`, {
      method: 'POST',
      headers,
      body,
    })

    const text = await res.text()
    console.log('[eCourts CNR] status:', res.status, 'body:', text.slice(0, 500))

    if (!res.ok) return null

    let data: any
    try { data = JSON.parse(text) } catch { return null }
    if (!data || data.errorMsg || data.error) {
      console.log('[eCourts CNR] API error:', data?.errorMsg ?? data?.error)
      return null
    }

    return parseCNRResponse(data)
  } catch (err) {
    console.error('[eCourts CNR] fetch failed:', err)
    return null
  }
}

// ─────────────────────────────────────────────
// 4. Fetch Advocate Cases (for court sync)
// ─────────────────────────────────────────────
export async function fetchAdvocateCases(params: {
  stateCode: string
  districtCode?: string
  complexCode?: string
  establishmentCode?: string
  advocateName: string
  barCode?: string
  year?: string
}): Promise<ECourtsCaseListItem[]> {
  try {
    const res = await fetchWithTimeout(`${ECOURTS_BASE}/fetchCasesViaAdvocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        state_code: params.stateCode,
        dist_code: params.districtCode ?? '',
        court_complex_code: params.complexCode ?? '',
        est_code: params.establishmentCode ?? '',
        advocate_name: params.advocateName,
        reg_year: params.year ?? new Date().getFullYear().toString(),
      }).toString(),
    })

    if (!res.ok) return []
    const data = await res.json()
    if (!data || data.errorMsg) return []

    return (data.data ?? []).map((c: any) => ({
      cnrNumber: c.cnr_number ?? null,
      caseNumber: c.case_type && c.reg_number
        ? `${c.case_type} ${c.reg_number}/${c.reg_year}`
        : null,
      firstParty: c.petitioner ?? null,
      oppositeParty: c.respondent ?? null,
      nextDate: parseECourtsDate(c.next_hearing_date),
      fixedFor: c.stage_of_case ?? null,
      courtName: c.court_name ?? null,
      courtNo: c.court_no ?? null,
      judgeName: c.judge_name ?? null,
    }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────
// 5. Fetch Cause List
// ─────────────────────────────────────────────
export async function fetchCauseList(params: {
  stateCode: string
  districtCode: string
  complexCode: string
  establishmentCode: string
  date: string // YYYY-MM-DD
  caseType?: string
}): Promise<CauseListEntry[]> {
  try {
    // Convert to DD-MM-YYYY for eCourts API
    const formattedDate = params.date.split('-').reverse().join('-')

    const res = await fetchWithTimeout(`${ECOURTS_BASE}/getCauseList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        state_code: params.stateCode,
        dist_code: params.districtCode,
        court_complex_code: params.complexCode,
        est_code: params.establishmentCode,
        date: formattedDate,
        case_type_1: params.caseType ?? '',
      }).toString(),
    })

    if (!res.ok) return []
    const data = await res.json()
    return (data.causeList ?? []).map((entry: any) => ({
      serialNo: entry.srno ?? '',
      caseNumber: entry.case_no ?? '',
      petitioner: entry.petitioner_name ?? '',
      respondent: entry.respondent_name ?? '',
      advocate: entry.adv_name ?? '',
      purpose: entry.purpose ?? '',
      courtNo: entry.court_no ?? '',
    }))
  } catch {
    return []
  }
}
