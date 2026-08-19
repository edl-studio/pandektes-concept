import { getPdf } from './PdfPageCanvas'

export interface PageTextItem {
  str: string
  /** Character offset of this item within the page's full text. */
  start: number
}

export interface PageTextIndex {
  pageNumber: number
  /** Full text of the page (items concatenated). */
  fullText: string
  items: PageTextItem[]
}

export interface SearchMatch {
  pageNumber: number
  /** Number of non-overlapping occurrences on this page. */
  count: number
}

const indexCache = new Map<string, Promise<PageTextIndex[]>>()
const IGNORED_MATCH_CHARACTER = /[\s\u00ad\u2010\u2011\u2012\u2013\u2212-]/
const MATCH_CHARACTER_EQUIVALENTS: Record<string, string> = {
  '\u2018': "'",
  '\u2019': "'",
  '\u201c': '"',
  '\u201d': '"',
  '\u201e': '"',
  '\u00ab': '"',
  '\u00bb': '"',
}

function canonicalizeSearchText(text: string): string {
  let canonical = ''

  for (const character of text) {
    if (!IGNORED_MATCH_CHARACTER.test(character)) {
      canonical += (
        MATCH_CHARACTER_EQUIVALENTS[character] ?? character
      ).toLocaleLowerCase('da')
    }
  }

  return canonical
}

/** Returns (and caches) a per-page text index for the PDF at `url`. */
export function getTextIndex(url: string): Promise<PageTextIndex[]> {
  let cached = indexCache.get(url)
  if (!cached) {
    cached = buildIndex(url)
    indexCache.set(url, cached)
  }
  return cached
}

async function buildIndex(url: string): Promise<PageTextIndex[]> {
  const pdf = await getPdf(url)
  const pages: PageTextIndex[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    let fullText = ''
    const items: PageTextItem[] = []

    for (const rawItem of content.items) {
      if ('str' in rawItem) {
        items.push({ str: rawItem.str, start: fullText.length })
        fullText += rawItem.str
      }
    }

    pages.push({ pageNumber: pageNum, fullText, items })
  }

  return pages
}

/**
 * Returns the pages that contain at least one occurrence of `query`.
 * Case-insensitive; respects Danish characters.
 */
export function searchIndex(pages: PageTextIndex[], query: string): SearchMatch[] {
  const canonicalQuery = canonicalizeSearchText(query)
  if (!canonicalQuery) return []

  const results: SearchMatch[] = []

  for (const page of pages) {
    const pageText = canonicalizeSearchText(page.fullText)
    let count = 0
    let pos = 0

    while (true) {
      const idx = pageText.indexOf(canonicalQuery, pos)
      if (idx === -1) break
      count++
      pos = idx + 1
    }

    if (count > 0) results.push({ pageNumber: page.pageNumber, count })
  }

  return results
}
