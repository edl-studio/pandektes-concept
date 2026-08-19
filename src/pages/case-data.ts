import type { ComponentType } from 'react'
import { HojesteretLogo, OstreLandsretLogo, SoHandelsrettenLogo } from './court-logos'

export interface CaseSummary {
  id: string
  caseNumber: string
  title: string
  /** Actual page count of the underlying document — drives how many sheets PkCaseBook/PageStack render. */
  pageCount: number
  /** URL to the real judgment PDF, when we have one. Falls back to the abstract placeholder image otherwise. */
  documentUrl?: string
  /** Court seal rendered on the case-book cover. */
  Logo?: ComponentType
  /** ISO-format judgment date, displayed in the timeline. */
  judgmentDate: string
  /** Procedural status — drives the status chip on each timeline entry. */
  status: 'Final' | 'Appealed'
  /** Human-readable court label for the timeline. */
  courtLabel: string
}

/**
 * Three-instance appeal chain: HK/Danmark for a Boeing quality controller v.
 * Flair Group A/S (formerly Adecco A/S), on whether a 3½-year posting to
 * Boeing was "temporary" under the Temporary Agency Work Act (vikarloven).
 *
 * Listed highest-court-first so that CASES[0] drives the matter header and
 * the timeline shows most-recent at the top.
 */
export const CASES: CaseSummary[] = [
  {
    id: 'bs-60017-2024-hjr',
    caseNumber: 'BS-60017/2024-HJR',
    title:
      'Højesteret affirms — Boeing posting was not temporary; quality controller entitled to salaried-employee rights under funktionærloven',
    pageCount: 12,
    documentUrl: '/documents/bs-60017-2024-hjr.pdf',
    Logo: HojesteretLogo,
    judgmentDate: '18 Jun 2026',
    status: 'Final',
    courtLabel: 'Højesteret',
  },
  {
    id: 'bs-8528-2023-olr',
    caseNumber: 'BS-8528/2023-OLR',
    title:
      'Østre Landsret reverses — No objective explanation for four extensions; Flair Group ordered to pay DKK 282,338.09',
    pageCount: 32,
    documentUrl: '/documents/bs-8528-2023-olr.pdf',
    Logo: OstreLandsretLogo,
    judgmentDate: '24 Apr 2024',
    status: 'Appealed',
    courtLabel: 'Østre Landsret',
  },
  {
    id: 'bs-13671-2021-shr',
    caseNumber: 'BS-13671/2021-SHR',
    title:
      'Sø- og Handelsretten acquits — 2-1 majority holds posting covered by vikarloven; DKK 419,770.90 claim dismissed',
    pageCount: 29,
    documentUrl: '/documents/bs-13671-2021-shr.pdf',
    Logo: SoHandelsrettenLogo,
    judgmentDate: '15 Aug 2022',
    status: 'Appealed',
    courtLabel: 'Sø- og Handelsretten',
  },
]

export function getCaseById(id: string): CaseSummary | undefined {
  return CASES.find((c) => c.id === id)
}
