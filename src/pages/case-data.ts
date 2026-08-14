export interface CaseSummary {
  id: string
  caseNumber: string
  title: string
  /** Actual page count of the underlying document — drives how many sheets PkCaseBook/PageStack render. */
  pageCount: number
  /** URL to the real judgment PDF, when we have one. Falls back to the abstract placeholder image otherwise. */
  documentUrl?: string
}

export const CASES: CaseSummary[] = [
  {
    id: 'bs-60017-2024-hjr',
    caseNumber: 'BS-60017/2024-HJR',
    title:
      'A temp posted to Boeing for years counts as a salaried employee — Flair Group (formerly Adecco) v. HK Danmark',
    pageCount: 6,
    documentUrl: '/documents/bs-60017-2024-hjr.pdf',
  },
  {
    id: 'bs-8528-2023-olr',
    caseNumber: 'BS-8528/2023-OLR',
    title: 'Østre Landsret upholds split ruling on vikarloven and funktionærloven coverage across joined appeals',
    pageCount: 4,
  },
  {
    id: 'bs-13671-2021-shr',
    caseNumber: 'BS-13671/2021-SHR',
    title: 'Sø- og Handelsretten rules on kr. 419,770.90 claim under funktionærloven vs. vikarloven coverage',
    pageCount: 3,
  },
]

export function getCaseById(id: string): CaseSummary | undefined {
  return CASES.find((c) => c.id === id)
}
