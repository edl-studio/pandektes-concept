import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import NumberFlow from '@number-flow/react'
import { PageStack, PdfPageCanvas, SelectablePdfPage, DocumentPageImage } from '@/components/compounds/PageStack'
import { FlickeringGrid } from '@/components/effects/FlickeringGrid'
import { getPdf } from '@/components/compounds/PageStack/PdfPageCanvas'
import { getTextIndex, searchIndex } from '@/components/compounds/PageStack/pdf-text-index'
import type { SearchMatch } from '@/components/compounds/PageStack/pdf-text-index'
import type { CaseSummary } from './case-data'
import { FULL_WIDTH, PAGE_HEIGHT, SCALE } from './transition/layout'
import './case-document-viewer.css'

const PAGE_GAP = 16 * SCALE
const PAGE_DISPLAY_HEIGHT = PAGE_HEIGHT * SCALE
const THUMBNAIL_WIDTH = 96
const WIPE_EDGE_WIDTH = 48

export interface CitationHighlight {
  pageNumber: number
  quoteText: string
}

export interface CaseDocumentViewerProps {
  caseSummary: CaseSummary
  contentVisible: boolean
  searchQuery?: string
  /**
   * Single step counter from the search toolbar. Positive = forward,
   * negative = backward; viewer computes direction from the delta vs its
   * previous value.
   */
  searchNavStep?: number
  /** Scroll to this page and highlight this quote (citation deep-link). */
  citationHighlight?: CitationHighlight
  /** Called after search index is built, with total match count. */
  onSearchResults?: (count: number) => void
}

interface LazyPdfPageProps {
  url: string
  pageNumber: number
  eager?: boolean
  searchQuery?: string
  activeHighlight?: string
  isActivePage?: boolean
}

function LazyPdfPage({
  url,
  pageNumber,
  eager = false,
  searchQuery,
  activeHighlight,
  isActivePage,
}: LazyPdfPageProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(eager)

  useEffect(() => {
    if (shouldRender) return

    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') {
      setShouldRender(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShouldRender(true)
        observer.disconnect()
      },
      { rootMargin: '800px 0px' },
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [shouldRender])

  return (
    <div ref={rootRef} className="case-document-viewer__page-content">
      {shouldRender && (
        <SelectablePdfPage
          url={url}
          pageNumber={pageNumber}
          targetWidth={FULL_WIDTH}
          className="case-document-viewer__page-canvas"
          searchQuery={searchQuery}
          activeHighlight={activeHighlight}
          isActivePage={isActivePage}
        />
      )}
    </div>
  )
}

export function CaseDocumentViewer({
  caseSummary,
  contentVisible,
  searchQuery = '',
  searchNavStep = 0,
  citationHighlight,
  onSearchResults,
}: CaseDocumentViewerProps) {
  const [pageCount, setPageCount] = useState(caseSummary.pageCount)
  const [activePage, setActivePage] = useState(1)
  const pageRefs = useRef<Array<HTMLElement | null>>([])
  const thumbnailListRef = useRef<HTMLOListElement>(null)
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([])

  // Search state
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([])
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const prevNavStepRef = useRef(searchNavStep)

  const goToPage = useCallback((pageNumber: number) => {
    setActivePage(pageNumber)
    pageRefs.current[pageNumber - 1]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [])

  // Resolve page count from the PDF.
  useEffect(() => {
    let cancelled = false
    setPageCount(caseSummary.pageCount)
    setActivePage(1)

    if (!caseSummary.documentUrl) return

    void getPdf(caseSummary.documentUrl)
      .then((pdf) => {
        if (!cancelled) setPageCount(pdf.numPages)
      })
      .catch((error: unknown) => {
        if (!cancelled) console.error('Failed to read PDF page count', error)
      })

    return () => {
      cancelled = true
    }
  }, [caseSummary.id, caseSummary.documentUrl, caseSummary.pageCount])

  // Build text index and compute search matches whenever the query changes.
  useEffect(() => {
    let cancelled = false

    async function index() {
      if (!caseSummary.documentUrl || !searchQuery.trim()) {
        setSearchMatches([])
        setActiveMatchIndex(0)
        onSearchResults?.(0)
        return
      }

      try {
        const pages = await getTextIndex(caseSummary.documentUrl)
        if (cancelled) return

        const matches = searchIndex(pages, searchQuery)
        setSearchMatches(matches)
        setActiveMatchIndex(0)

        const total = matches.reduce((s, m) => s + m.count, 0)
        onSearchResults?.(total)

        if (matches.length > 0) {
          goToPage(matches[0].pageNumber)
        }
      } catch (error) {
        if (!cancelled) console.error('PDF text index error', error)
      }
    }

    void index()
    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseSummary.documentUrl, searchQuery])

  // Keyboard navigation (Enter = forward, Shift+Enter = backward).
  useEffect(() => {
    const delta = searchNavStep - prevNavStepRef.current
    prevNavStepRef.current = searchNavStep
    if (delta === 0 || searchMatches.length === 0) return

    const forward = delta > 0
    setActiveMatchIndex((prev) => {
      const len = searchMatches.length
      const next = forward ? (prev + 1) % len : (prev - 1 + len) % len
      goToPage(searchMatches[next].pageNumber)
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchNavStep])

  // Scroll to citation page after content becomes visible.
  useEffect(() => {
    if (!citationHighlight || !contentVisible || searchQuery.trim()) return
    goToPage(citationHighlight.pageNumber)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citationHighlight?.pageNumber, contentVisible, searchQuery])

  // Active-page tracking via IntersectionObserver.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const ratios = new Map<number, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const page = Number((entry.target as HTMLElement).dataset.page)
          ratios.set(page, entry.isIntersecting ? entry.intersectionRatio : 0)
        })

        let mostVisiblePage = 1
        let largestRatio = 0
        ratios.forEach((ratio, page) => {
          if (ratio > largestRatio) {
            mostVisiblePage = page
            largestRatio = ratio
          }
        })

        if (largestRatio > 0) setActivePage(mostVisiblePage)
      },
      {
        rootMargin: '-10% 0px -35% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    )

    pageRefs.current.slice(0, pageCount).forEach((page) => {
      if (page) observer.observe(page)
    })

    return () => observer.disconnect()
  }, [pageCount])

  // Scroll thumbnail into view when activePage changes.
  useEffect(() => {
    const list = thumbnailListRef.current
    const thumbnail = thumbnailRefs.current[activePage - 1]
    if (!list || !thumbnail) return

    const listRect = list.getBoundingClientRect()
    const thumbnailRect = thumbnail.getBoundingClientRect()
    const edgePadding = 8
    let scrollDelta = 0

    if (thumbnailRect.top < listRect.top + edgePadding) {
      scrollDelta = thumbnailRect.top - listRect.top - edgePadding
    } else if (thumbnailRect.bottom > listRect.bottom - edgePadding) {
      scrollDelta = thumbnailRect.bottom - listRect.bottom + edgePadding
    }

    if (scrollDelta !== 0) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      list.scrollBy({ top: scrollDelta, behavior: reduceMotion ? 'auto' : 'smooth' })
    }
  }, [activePage, pageCount])

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)
  const totalHeight =
    pageCount * PAGE_DISPLAY_HEIGHT + Math.max(0, pageCount - 1) * PAGE_GAP

  const activeMatchPage = searchMatches[activeMatchIndex]?.pageNumber ?? null

  return (
    <div
      className="case-document-viewer"
      data-content-visible={contentVisible}
      style={{ width: FULL_WIDTH, height: totalHeight }}
    >
      <aside className="case-document-viewer__sidebar">
        <nav className="case-document-viewer__nav" aria-label="Document pages">
          <p className="case-document-viewer__page-status" aria-live="polite">
            <span>Page</span>
            <NumberFlow
              value={activePage}
              format={{ useGrouping: false }}
              willChange
            />
            <span>of {pageCount}</span>
          </p>
          <ol
            ref={thumbnailListRef}
            className="case-document-viewer__thumbnail-list"
          >
            {pages.map((pageNumber) => (
              <li key={pageNumber}>
                <button
                  ref={(node) => {
                    thumbnailRefs.current[pageNumber - 1] = node
                  }}
                  type="button"
                  className="case-document-viewer__thumbnail-button"
                  style={
                    {
                      '--pk-thumbnail-delay': `${(pageNumber - 1) * 80}ms`,
                    } as CSSProperties
                  }
                  aria-label={`Go to page ${pageNumber}`}
                  aria-current={activePage === pageNumber ? 'page' : undefined}
                  onClick={() => goToPage(pageNumber)}
                >
                  <span className="case-document-viewer__thumbnail-preview">
                    {caseSummary.documentUrl ? (
                      <PdfPageCanvas
                        url={caseSummary.documentUrl}
                        pageNumber={pageNumber}
                        targetWidth={THUMBNAIL_WIDTH}
                        className="case-document-viewer__thumbnail-canvas"
                      />
                    ) : (
                      <DocumentPageImage caseNumber={caseSummary.caseNumber} />
                    )}
                  </span>
                  <span className="case-document-viewer__thumbnail-number">
                    {pageNumber}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <PageStack
        pageCount={pageCount}
        mode="list"
        scale={SCALE}
        frontSheetBackdrop={
          <FlickeringGrid
            className="case-document-viewer__flickering-grid"
            color="#7d2334"
            flickerChance={0.22}
            maxOpacity={0.32}
          />
        }
      />

      <div className="case-document-viewer__pages">
        {pages.map((pageNumber, index) => {
          const top = index * (PAGE_DISPLAY_HEIGHT + PAGE_GAP)
          const isFirstPage = pageNumber === 1

          // Per-page highlight logic:
          // Search query takes priority; citation highlight shown when no search active.
          const hasSearch = searchQuery.trim().length > 0
          const pageSearchQuery = hasSearch && caseSummary.documentUrl ? searchQuery : ''
          const isActivePg = hasSearch
            ? pageNumber === activeMatchPage
            : false
          const pageActiveHighlight =
            !hasSearch && citationHighlight?.pageNumber === pageNumber
              ? citationHighlight.quoteText
              : ''

          const style = {
            top,
            width: FULL_WIDTH,
            height: PAGE_DISPLAY_HEIGHT,
            ...(isFirstPage
              ? {
                  '--pk-wipe-y': contentVisible
                    ? `${PAGE_DISPLAY_HEIGHT + WIPE_EDGE_WIDTH}px`
                    : `-${WIPE_EDGE_WIDTH}px`,
                }
              : {}),
          } as CSSProperties

          return (
            <section
              key={pageNumber}
              ref={(node) => {
                pageRefs.current[index] = node
              }}
              data-page={pageNumber}
              aria-label={`Page ${pageNumber}`}
              className={`case-document-viewer__page${
                isFirstPage ? ' pk-page-stack__reveal-overlay' : ''
              }`}
              style={style}
            >
              {caseSummary.documentUrl ? (
                <LazyPdfPage
                  url={caseSummary.documentUrl}
                  pageNumber={pageNumber}
                  eager={isFirstPage}
                  searchQuery={pageSearchQuery}
                  activeHighlight={pageActiveHighlight}
                  isActivePage={isActivePg}
                />
              ) : (
                <DocumentPageImage caseNumber={caseSummary.caseNumber} />
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
