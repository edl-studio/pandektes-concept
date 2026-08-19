import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import NumberFlow from '@number-flow/react'
import { PageStack, PdfPageCanvas, SelectablePdfPage, DocumentPageImage } from '@/components/compounds/PageStack'
import { FlickeringGrid } from '@/components/effects/FlickeringGrid'
import { getPdf } from '@/components/compounds/PageStack/PdfPageCanvas'
import { getTextIndex, searchIndex } from '@/components/compounds/PageStack/pdf-text-index'
import type { SearchMatch } from '@/components/compounds/PageStack/pdf-text-index'
import { SharedLayoutBg } from '@/components/motion/shared-layout-bg'
import type { CaseSummary } from './case-data'
import {
  DocumentSummarySidebar,
  type DocumentSummaryBlock,
} from './DocumentSummarySidebar'
import {
  DETAIL_PAGE_HEADER_GAP,
  DETAIL_PAGE_HEADER_HEIGHT,
  FULL_WIDTH,
  PAGE_HEIGHT,
  SCALE,
} from './transition/layout'
import './case-document-viewer.css'

const PAGE_GAP = 16 * SCALE
const PAGE_DISPLAY_HEIGHT = PAGE_HEIGHT * SCALE
const DOCUMENT_TOP_INSET = DETAIL_PAGE_HEADER_HEIGHT + DETAIL_PAGE_HEADER_GAP
const DOCUMENT_BOTTOM_INSET = 112
const THUMBNAIL_WIDTH = 96
const THUMBNAIL_FADE_HEIGHT = 112
const WIPE_EDGE_WIDTH = 48
const DOCUMENT_REVEAL_FALLBACK_MS = 2700
const THUMBNAIL_STAGGER_MS = 80
const THUMBNAIL_REVEAL_DURATION_MS = 650
const SIDEBAR_REVEAL_LEAD_MS = 500

const SUMMARY_BLOCKS_BY_CASE: Record<string, DocumentSummaryBlock[]> = {
  // ── Højesteret (12 pages) ──────────────────────────────────────────────
  'bs-60017-2024-hjr': [
    {
      id: 'hjr-two-questions',
      title: 'Two legal questions',
      body: 'The case raised two main questions: (1) Can a worker covered by vikarloven also be a salaried employee under funktionærloven? (2) When is a posting "temporary"?',
      pageNumber: 5,
      quoteText:
        'Sagen rejser to hovedspørgsmål, som har betydning for Højesterets stillingtagen til de fremsatte krav.',
    },
    {
      id: 'hjr-vikarloven-not-applicable',
      title: 'vikarloven does not apply — Appellant 3',
      body: 'No objective explanation was given for any of the four extensions to Boeing. The posting therefore fell outside vikarloven; as a salaried employee the worker was entitled to sick pay and a four-month notice period.',
      pageNumber: 9,
      quoteText:
        'På denne baggrund tiltræder Højesteret, at vikarloven ikke finder anvendelse på hans udsendelser. Han er efter det ovenfor anførte om samspillet mellem vikarloven og funktionærloven omfattet af funktionærloven og er derfor berettiget til løn under sygdom under hele sin ansættelse, jf. funktionærlovens § 5, stk. 1.',
    },
    {
      id: 'hjr-compensation-25000',
      title: 'DKK 25,000 compensation confirmed',
      body: 'The Supreme Court upheld the Fixed-Term Employment Act compensation of DKK 25,000 set by Østre Landsret, on the same grounds given by the appellate court.',
      pageNumber: 9,
      quoteText:
        'Appelindstævnte, tidligere Appellant 3 er herefter berettiget til godtgørelse efter § 8, stk. 1, i lov om tidsbegrænset ansættelse. Af de grunde, som er anført af landsretten, tiltræder Højesteret, at godtgørelsen er fastsat til 25.000 kr.',
    },
    {
      id: 'hjr-stadfaestes',
      title: 'Appellate judgment affirmed',
      body: 'Højesteret affirmed the full Østre Landsret judgment. No costs were ordered for the Supreme Court proceedings.',
      pageNumber: 11,
      quoteText: 'Landsrettens dom stadfæstes.',
    },
  ],

  // ── Østre Landsret (32 pages) ──────────────────────────────────────────
  'bs-8528-2023-olr': [
    {
      id: 'olr-legal-standard',
      title: 'Standard for "temporary" posting',
      body: 'The duration and number of extensions do not in themselves remove a posting from vikarloven. The decisive question is whether there is an objective explanation for the successive extensions.',
      pageNumber: 25,
      quoteText:
        'Landsretten finder, at det ikke i sig selv er i strid med vikarlovens eller vikardirektivets regler om "midlertidig" udsendelse successivt at udsende en vikar tidsbegrænset, hvad enten udsendelse sker til forskellige eller samme brugervirksomhed, jf. herved også vikarlovens § 3, stk. 4.',
    },
    {
      id: 'olr-no-objective-explanation',
      title: 'No objective explanation — Appellant 3',
      body: "The alleged Boeing shutdown was not supported by any documents and was not explored through witnesses. No objective explanation was given for why Boeing originally engaged the worker or why the 2017 and 2018 extensions occurred.",
      pageNumber: 29,
      quoteText:
        'Adecco A/S har gjort gældende, at udsendelsen og forlængelserne skete som følge af brugervirksomhedens forventede forestående nedlukning i Danmark. Denne forklaring ses imidlertid ikke understøttet af sagens skriftlige materiale, og baggrunden for Appellant 3\'s, tidligere Sagsøger i BS-13671/2021-SHR udsendelse og forlængelser er heller ikke søgt belyst gennem vidneforklaringer fra brugervirksomheden eller medarbejdere hos Adecco A/S, der forestod kontakten med brugervirksomheden i 2016, 2017 eller 2018.',
    },
    {
      id: 'olr-misbrug-conclusion',
      title: 'Abuse finding — posting outside vikarloven',
      body: "Given the total duration and the absence of any objective explanation, the court found the posting and extensions constituted abuse and circumvention of funktionærloven and the Fixed-Term Employment Act.",
      pageNumber: 29,
      quoteText:
        'sammenholdt med varigheden af Appellant 3\'s, tidligere Sagsøger i BS-13671/2021-SHR samlede udsendelse til brugervirksomheden, finder landsretten det godtgjort, at udsendelsen og forlængelserne udgør misbrug og er en omgåelse af funktionærloven og lov om tidsbegrænset ansættelse.',
    },
    {
      id: 'olr-award-282338',
      title: 'DKK 282,338.09 awarded',
      body: 'Østre Landsret awarded the full claim: DKK 257,338.09 in salary for the notice period and sick-pay arrears, plus DKK 25,000 in Fixed-Term Employment Act compensation.',
      pageNumber: 30,
      quoteText:
        'Herefter tager landsretten Appellant 3\'s, tidligere Sagsøger i BS-13671/2021-SHR påstand til følge med 282.338,09 kr.',
    },
  ],

  // ── Sø- og Handelsretten (29 pages) ───────────────────────────────────
  'bs-13671-2021-shr': [
    {
      id: 'shr-facts',
      title: 'Four extensions over 3½ years',
      body: `The worker was posted to Boeing from 1 December 2016 to 31 July 2020 \u2014 3 years and 8 months \u2014 under an initial one-year contract extended four times. Each extension cited ongoing demand for the worker's skills.`,
      pageNumber: 3,
      quoteText:
        'Ansættelseskontrakten blev herefter forlænget i alt fire gange (fra 2. december 2017 til 30. november 2018, fra 1. december 2018 til 30. november 2019, fra 1. december 2019 til 27. marts 2020 og fra 28. marts 2020 til 31. juli 2020).',
    },
    {
      id: 'shr-majority-collective',
      title: 'Majority: Funktionæroverenskomsten displaces § 3, stk. 4',
      body: 'The two-judge majority held that the protection against successive extensions resided in the collective agreement (Funktionæroverenskomsten), not in vikarloven § 3, stk. 4. As the agreement was uncontested, the posting stayed within vikarloven.',
      pageNumber: 26,
      quoteText:
        'finder vi, at Sagsøgers ansættelse i Adecco A/S var omfattet af vikarloven.',
    },
    {
      id: 'shr-dissent',
      title: 'Dissent: 3 yrs 8 months cannot be "temporary"',
      body: `The dissenting judge held that a posting of 3 years and 8 months is simply not temporary, regardless of whether each extension was individually justified. The worker would have received three months' salary, sick pay, and one month's compensation.`,
      pageNumber: 27,
      quoteText:
        'Sagsøgers ansættelse varede 3 år og 8 måneder. Uanset om de 4 forlængelser var objektivt begrundede eller ej, så er en så langvarig ansættelse ikke midlertidig.',
    },
    {
      id: 'shr-ruling',
      title: 'Majority ruling — Adecco acquitted',
      body: 'Decision by majority vote. Adecco A/S is acquitted. HK Danmark is ordered to pay DKK 50,000 in costs.',
      pageNumber: 28,
      quoteText: 'Adecco A/S frifindes.',
    },
  ],
}

export interface CitationHighlight {
  pageNumber: number
  quoteText: string
}

export interface CaseDocumentViewerProps {
  caseSummary: CaseSummary
  contentVisible: boolean
  sidebarOpen?: boolean
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
  /** Called after the final thumbnail has completed its entrance transition. */
  onThumbnailRevealComplete?: () => void
  /** Search controls rendered in the document column header. */
  searchToolbar?: ReactNode
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
  sidebarOpen = true,
  searchQuery = '',
  searchNavStep = 0,
  citationHighlight,
  onSearchResults,
  onThumbnailRevealComplete,
  searchToolbar,
}: CaseDocumentViewerProps) {
  const [pageCount, setPageCount] = useState(caseSummary.pageCount)
  const [activePage, setActivePage] = useState(1)
  const [activeSummaryId, setActiveSummaryId] = useState<string>()
  const [documentRevealComplete, setDocumentRevealComplete] = useState(false)
  const [thumbnailNavVisible, setThumbnailNavVisible] = useState(false)
  const pageRefs = useRef<Array<HTMLElement | null>>([])
  const documentScrollRef = useRef<HTMLDivElement>(null)
  const thumbnailListRef = useRef<HTMLOListElement>(null)
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([])
  const programmaticPageRef = useRef<number | null>(null)
  const programmaticScrollTimerRef = useRef<number>()
  const thumbnailRevealReportedRef = useRef(false)

  // Search state
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([])
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const prevNavStepRef = useRef(searchNavStep)

  const releaseProgrammaticNavigation = useCallback(() => {
    programmaticPageRef.current = null
    window.clearTimeout(programmaticScrollTimerRef.current)
    programmaticScrollTimerRef.current = undefined
  }, [])

  const reportThumbnailRevealComplete = useCallback(() => {
    if (thumbnailRevealReportedRef.current) return
    thumbnailRevealReportedRef.current = true
    onThumbnailRevealComplete?.()
  }, [onThumbnailRevealComplete])

  useEffect(() => {
    thumbnailRevealReportedRef.current = false
    setDocumentRevealComplete(false)
    setThumbnailNavVisible(false)
  }, [caseSummary.id])

  useEffect(() => {
    if (!contentVisible) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDocumentRevealComplete(true)
      return
    }

    // Transition events for registered custom properties are supported by
    // current browsers; this timeout keeps the nav available if one is lost.
    const fallback = window.setTimeout(
      () => setDocumentRevealComplete(true),
      DOCUMENT_REVEAL_FALLBACK_MS,
    )
    return () => window.clearTimeout(fallback)
  }, [caseSummary.id, contentVisible])

  useEffect(() => {
    if (!documentRevealComplete) return

    // Let the newly mounted thumbnails paint once in their hidden state before
    // enabling the staggered entrance transition.
    const frame = window.requestAnimationFrame(() => {
      setThumbnailNavVisible(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [documentRevealComplete])

  useEffect(() => {
    if (!thumbnailNavVisible) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reportThumbnailRevealComplete()
      return
    }

    const lastThumbnailEndMs =
      Math.max(0, pageCount - 1) * THUMBNAIL_STAGGER_MS +
      THUMBNAIL_REVEAL_DURATION_MS
    const timer = window.setTimeout(
      reportThumbnailRevealComplete,
      Math.max(0, lastThumbnailEndMs - SIDEBAR_REVEAL_LEAD_MS),
    )
    return () => window.clearTimeout(timer)
  }, [pageCount, reportThumbnailRevealComplete, thumbnailNavVisible])

  const goToPage = useCallback(
    (pageNumber: number) => {
      setActivePage(pageNumber)
      const page = pageRefs.current[pageNumber - 1]
      const scrollArea = documentScrollRef.current
      if (!page || !scrollArea) return

      const targetTop = page.offsetTop
      if (Math.abs(scrollArea.scrollTop - targetTop) > 1) {
        programmaticPageRef.current = pageNumber
        window.clearTimeout(programmaticScrollTimerRef.current)
        programmaticScrollTimerRef.current = window.setTimeout(
          releaseProgrammaticNavigation,
          1000,
        )
      }

      scrollArea.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      })
    },
    [releaseProgrammaticNavigation],
  )

  useEffect(() => {
    const scrollArea = documentScrollRef.current
    if (!scrollArea) return

    const handleScroll = () => {
      if (programmaticPageRef.current === null) return
      window.clearTimeout(programmaticScrollTimerRef.current)
      programmaticScrollTimerRef.current = window.setTimeout(
        releaseProgrammaticNavigation,
        120,
      )
    }

    scrollArea.addEventListener('scroll', handleScroll, { passive: true })
    scrollArea.addEventListener('scrollend', releaseProgrammaticNavigation)
    scrollArea.addEventListener('wheel', releaseProgrammaticNavigation, { passive: true })
    scrollArea.addEventListener('touchstart', releaseProgrammaticNavigation, { passive: true })

    return () => {
      scrollArea.removeEventListener('scroll', handleScroll)
      scrollArea.removeEventListener('scrollend', releaseProgrammaticNavigation)
      scrollArea.removeEventListener('wheel', releaseProgrammaticNavigation)
      scrollArea.removeEventListener('touchstart', releaseProgrammaticNavigation)
      releaseProgrammaticNavigation()
    }
  }, [releaseProgrammaticNavigation])

  const summaryBlocks = SUMMARY_BLOCKS_BY_CASE[caseSummary.id] ?? []
  const activeSummary = summaryBlocks.find((block) => block.id === activeSummaryId)

  const selectSummary = useCallback(
    (block: DocumentSummaryBlock) => {
      setActiveSummaryId(block.id)
      goToPage(block.pageNumber)
    },
    [goToPage],
  )

  // Resolve page count from the PDF.
  useEffect(() => {
    let cancelled = false
    setPageCount(caseSummary.pageCount)
    setActivePage(1)
    setActiveSummaryId(undefined)

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

        if (largestRatio > 0 && programmaticPageRef.current === null) {
          setActivePage(mostVisiblePage)
        }
      },
      {
        root: documentScrollRef.current,
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
    const sidebarRect = list
      .closest<HTMLElement>('.case-document-viewer__sidebar')
      ?.getBoundingClientRect()
    const thumbnailRect = thumbnail.getBoundingClientRect()
    const edgePadding = 8
    const visibleTop =
      Math.max(listRect.top, (sidebarRect?.top ?? listRect.top) + THUMBNAIL_FADE_HEIGHT) +
      edgePadding
    const visibleBottom =
      Math.min(
        listRect.bottom,
        (sidebarRect?.bottom ?? listRect.bottom) - THUMBNAIL_FADE_HEIGHT,
      ) - edgePadding
    let scrollDelta = 0

    if (thumbnailRect.top < visibleTop) {
      scrollDelta = thumbnailRect.top - visibleTop
    } else if (thumbnailRect.bottom > visibleBottom) {
      scrollDelta = thumbnailRect.bottom - visibleBottom
    }

    if (scrollDelta !== 0) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      list.scrollBy({ top: scrollDelta, behavior: reduceMotion ? 'auto' : 'smooth' })
    }
  }, [activePage, documentRevealComplete, pageCount])

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)
  const totalHeight =
    pageCount * PAGE_DISPLAY_HEIGHT + Math.max(0, pageCount - 1) * PAGE_GAP

  const activeMatchPage = searchMatches[activeMatchIndex]?.pageNumber ?? null

  return (
    <div
      className="case-document-viewer"
      data-content-visible={contentVisible}
      data-sidebar-open={sidebarOpen}
      data-thumbnail-nav-visible={thumbnailNavVisible}
    >
      <main className="case-document-viewer__main">
        <div className="case-document-viewer__workspace">
          <aside className="case-document-viewer__sidebar">
            <p className="case-document-viewer__page-status" aria-live="polite">
              <span>Page</span>
              <NumberFlow
                value={activePage}
                format={{ useGrouping: false }}
                willChange
              />
              <span>of {pageCount}</span>
            </p>
            {documentRevealComplete && (
              <nav className="case-document-viewer__nav" aria-label="Document pages">
                <SharedLayoutBg
                  as="ul"
                  ref={thumbnailListRef}
                  className="case-document-viewer__thumbnail-list"
                  activeIndex={activePage - 1}
                  inset={0}
                  pillClassName="case-document-viewer__thumbnail-pill"
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
                            '--pk-thumbnail-delay': `${(pageNumber - 1) * THUMBNAIL_STAGGER_MS}ms`,
                          } as CSSProperties
                        }
                        aria-label={`Go to page ${pageNumber}`}
                        aria-current={activePage === pageNumber ? 'page' : undefined}
                        onClick={() => goToPage(pageNumber)}
                        onTransitionEnd={
                          pageNumber === pageCount
                            ? (event) => {
                                if (
                                  event.target === event.currentTarget &&
                                  event.propertyName === 'transform'
                                ) {
                                  reportThumbnailRevealComplete()
                                }
                              }
                            : undefined
                        }
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
                </SharedLayoutBg>
              </nav>
            )}
          </aside>

          <div className="case-document-viewer__document-column">
            <div className="case-document-viewer__toolbar-slot">
              {searchToolbar}
            </div>

            <div
              ref={documentScrollRef}
              className="case-document-viewer__scroll-area"
              tabIndex={0}
              aria-label="Document pages"
            >
              <div
                className="case-document-viewer__scroll-content"
                style={{
                  width: FULL_WIDTH,
                  height:
                    totalHeight + DOCUMENT_TOP_INSET + DOCUMENT_BOTTOM_INSET,
                  paddingTop: DOCUMENT_TOP_INSET,
                  paddingBottom: DOCUMENT_BOTTOM_INSET,
                }}
              >
                <div
                  className="case-document-viewer__pages-stage"
                  style={{ width: FULL_WIDTH, height: totalHeight }}
                >
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

                    // Search takes priority over summary/citation highlights.
                    const hasSearch = searchQuery.trim().length > 0
                    const pageSearchQuery =
                      hasSearch && caseSummary.documentUrl ? searchQuery : ''
                    const isActivePg = hasSearch
                      ? pageNumber === activeMatchPage
                      : false
                    const pageActiveHighlight =
                      !hasSearch && activeSummary?.pageNumber === pageNumber
                        ? activeSummary.quoteText
                        : !hasSearch &&
                            citationHighlight?.pageNumber === pageNumber
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
                          onTransitionEnd={
                            isFirstPage
                              ? (event) => {
                                  if (
                                    event.target === event.currentTarget &&
                                    event.propertyName === '--pk-wipe-y'
                                  ) {
                                    setDocumentRevealComplete(true)
                                  }
                                }
                              : undefined
                          }
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
              </div>
            </div>
          </div>
        </div>
      </main>

      {summaryBlocks.length > 0 && (
        <DocumentSummarySidebar
          blocks={summaryBlocks}
          activeBlockId={activeSummaryId}
          onSelect={selectSummary}
        />
      )}
    </div>
  )
}
