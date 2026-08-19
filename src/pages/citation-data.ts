import { CASES } from './case-data'
import type { CitationItem } from '@/components/ai-elements/citations'

export interface AppCitationItem extends CitationItem {
  /** Which case document this citation comes from. */
  caseId: string
  /** Plain-text version of quote for PDF text matching. */
  quoteText?: string
}

const HJR = CASES[0] // bs-60017-2024-hjr  (12 pages)
const OLR = CASES[1] // bs-8528-2023-olr   (32 pages)
const SHR = CASES[2] // bs-13671-2021-shr  (29 pages)

export const CITATION_PREFIX = 'case-sources'

export const CITATION_ITEMS: AppCitationItem[] = [
  // ── Højesteret ────────────────────────────────────────────────────────
  {
    id: 'hjr-result',
    caseId: HJR.id,
    title: 'Domsdatabasen_13870 (instance 3).pdf',
    domain: 'page 9 · Result — Appellant 3',
    url: HJR.documentUrl,
    pageNumber: 9,
    quote:
      'The Supreme Court affirmed that the posting to Boeing fell outside vikarloven — no objective explanation for any of the four extensions was given. As a salaried employee (funktionær), the worker was entitled to sick pay throughout and to a four-month notice period. The DKK 25,000 Fixed-Term Employment Act compensation set by Østre Landsret was upheld.',
    quoteText:
      'På denne baggrund tiltræder Højesteret, at vikarloven ikke finder anvendelse på hans udsendelser. Han er efter det ovenfor anførte om samspillet mellem vikarloven og funktionærloven omfattet af funktionærloven og er derfor berettiget til løn under sygdom under hele sin ansættelse, jf. funktionærlovens § 5, stk. 1.',
  },
  {
    id: 'hjr-compensation',
    caseId: HJR.id,
    title: 'Domsdatabasen_13870 (instance 3).pdf',
    domain: 'page 9 · § 8, stk. 1 — godtgørelse',
    url: HJR.documentUrl,
    pageNumber: 9,
    quote:
      'Appellant 3 is entitled to compensation of DKK 25,000 under the Fixed-Term Employment Act.',
    quoteText:
      'Appelindstævnte, tidligere Appellant 3 er herefter berettiget til godtgørelse efter § 8, stk. 1, i lov om tidsbegrænset ansættelse. Af de grunde, som er anført af landsretten, tiltræder Højesteret, at godtgørelsen er fastsat til 25.000 kr.',
  },
  {
    id: 'hjr-two-questions',
    caseId: HJR.id,
    title: 'Domsdatabasen_13870 (instance 3).pdf',
    domain: 'page 5 · Two main questions',
    url: HJR.documentUrl,
    pageNumber: 5,
    quote:
      'Two questions before the Supreme Court: (1) Can a worker covered by vikarloven simultaneously be a salaried employee under funktionærloven? (2) When is a posting "temporary" within the meaning of vikarloven?',
    quoteText:
      'Sagen rejser to hovedspørgsmål, som har betydning for Højesterets stillingtagen til de fremsatte krav. For det første er spørgsmålet navnlig, om vikarer, der er omfattet af vikarloven, samtidig kan være funktionærer omfattet af funktionærloven. For det andet er spørgsmålet, hvornår udsendelse af en lønmodtager må anses for midlertidig og dermed omfattet af vikarloven.',
  },
  {
    id: 'hjr-stadfaestes',
    caseId: HJR.id,
    title: 'Domsdatabasen_13870 (instance 3).pdf',
    domain: 'page 11 · THI KENDES FOR RET',
    url: HJR.documentUrl,
    pageNumber: 11,
    quote: 'The appellate judgment is affirmed. No order as to costs.',
    quoteText: 'Landsrettens dom stadfæstes.',
  },

  // ── Østre Landsret ────────────────────────────────────────────────────
  {
    id: 'olr-misbrug',
    caseId: OLR.id,
    title: 'Domsdatabasen_11189 (instance 2).pdf',
    domain: 'page 28 · Misbrug — Appellant 3',
    url: OLR.documentUrl,
    pageNumber: 28,
    quote:
      'Østre Landsret found that no objective explanation was given for the original posting in 2016 or for the extensions in 2017 and 2018. Given the overall duration, the posting and extensions constituted abuse and circumvention of funktionærloven.',
    quoteText:
      'sammenholdt med varigheden af Appellant 3\'s, tidligere Sagsøger i BS-13671/2021-SHR samlede udsendelse til brugervirksomheden, finder landsretten det godtgjort, at udsendelsen og forlængelserne udgør misbrug og er en omgåelse af funktionærloven og lov om tidsbegrænset ansættelse.',
  },
  {
    id: 'olr-award',
    caseId: OLR.id,
    title: 'Domsdatabasen_11189 (instance 2).pdf',
    domain: 'page 29 · Award — DKK 282,338.09',
    url: OLR.documentUrl,
    pageNumber: 29,
    quote:
      'Østre Landsret upheld the full claim: DKK 257,338.09 for salary in the notice period and sick-pay arrears, plus DKK 25,000 in Fixed-Term Employment Act compensation — a total of DKK 282,338.09.',
    quoteText:
      'Herefter tager landsretten Appellant 3\'s, tidligere Sagsøger i BS-13671/2021-SHR påstand til følge med 282.338,09 kr.',
  },
  {
    id: 'olr-no-objective',
    caseId: OLR.id,
    title: 'Domsdatabasen_11189 (instance 2).pdf',
    domain: 'page 28 · No objective explanation',
    url: OLR.documentUrl,
    pageNumber: 28,
    quote:
      "The alleged Boeing shutdown was not supported by any documentary evidence and was never explored through witness testimony from the user company or the Adecco staff who managed the engagement in 2016–2018.",
    quoteText:
      'Adecco A/S har gjort gældende, at udsendelsen og forlængelserne skete som følge af brugervirksomhedens forventede forestående nedlukning i Danmark. Denne forklaring ses imidlertid ikke understøttet af sagens skriftlige materiale, og baggrunden for Appellant 3\'s, tidligere Sagsøger i BS-13671/2021-SHR udsendelse og forlængelser er heller ikke søgt belyst gennem vidneforklaringer fra brugervirksomheden eller medarbejdere hos Adecco A/S, der forestod kontakten med brugervirksomheden i 2016, 2017 eller 2018.',
  },

  // ── Sø- og Handelsretten ──────────────────────────────────────────────
  {
    id: 'shr-majority',
    caseId: SHR.id,
    title: 'Domsdatabasen_3417 (instance 1).pdf',
    domain: 'page 26 · Majority — vikarloven applies',
    url: SHR.documentUrl,
    pageNumber: 26,
    quote:
      'The two-judge majority held that the protective mechanism against successive extensions was built into the collective agreement (Funktionæroverenskomsten), not into vikarloven § 3, stk. 4. Since the agreement was uncontested, the posting remained within vikarloven and Adecco was acquitted.',
    quoteText:
      'finder vi, at Sagsøgers ansættelse i Adecco A/S var omfattet af vikarloven.',
  },
  {
    id: 'shr-dissent',
    caseId: SHR.id,
    title: 'Domsdatabasen_3417 (instance 1).pdf',
    domain: 'page 27 · Dissent — 3 yrs 8 months not temporary',
    url: SHR.documentUrl,
    pageNumber: 27,
    quote:
      `The dissenting judge found that 3 years and 8 months cannot objectively be "temporary" regardless of how many extensions occurred, and would have awarded three months' salary in the notice period, sick-pay, and one month's compensation.`,
    quoteText:
      'Sagsøgers ansættelse varede 3 år og 8 måneder. Uanset om de 4 forlængelser var objektivt begrundede eller ej, så er en så langvarig ansættelse ikke midlertidig.',
  },
  {
    id: 'shr-ruling',
    caseId: SHR.id,
    title: 'Domsdatabasen_3417 (instance 1).pdf',
    domain: 'page 28 · THI KENDES FOR RET',
    url: SHR.documentUrl,
    pageNumber: 28,
    quote: 'Adecco A/S is acquitted. HK Danmark is ordered to pay DKK 50,000 in costs.',
    quoteText: 'Adecco A/S frifindes.',
  },
]

export function getCitationById(id: string): AppCitationItem | undefined {
  return CITATION_ITEMS.find((c) => c.id === id)
}
