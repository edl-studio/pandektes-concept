import { CASES } from './case-data'
import type { CitationItem } from '@/components/ai-elements/citations'

export interface AppCitationItem extends CitationItem {
  /** Which case document this citation comes from. */
  caseId: string
  /** Plain-text version of quote for PDF text matching. */
  quoteText?: string
}

const SOURCE_PDF_URL = CASES[0].documentUrl
const CASE_ID = CASES[0].id

export const CITATION_PREFIX = 'case-sources'

export const CITATION_ITEMS: AppCitationItem[] = [
  {
    id: 'holding-win',
    caseId: CASE_ID,
    title: 'Domsdatabasen_13870.pdf',
    domain: 'page 2 · §3',
    url: SOURCE_PDF_URL,
    pageNumber: 2,
    quote:
      'Appellant 3 is entitled to compensation of DKK 282,338.09 under funktionærloven.',
    quoteText:
      'Appellant 3 is entitled to compensation of DKK 282,338.09 under funktionærloven.',
  },
  {
    id: 'holding-lose',
    caseId: CASE_ID,
    title: 'Domsdatabasen_13870.pdf',
    domain: 'page 2 · §3',
    url: SOURCE_PDF_URL,
    pageNumber: 2,
    quote: 'The claims of appellants 1 and 2 under vikarloven are dismissed.',
    quoteText: 'The claims of appellants 1 and 2 under vikarloven are dismissed.',
  },
]

export function getCitationById(id: string): AppCitationItem | undefined {
  return CITATION_ITEMS.find((c) => c.id === id)
}
