import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import NumberFlow from '@number-flow/react'
import { PageStack, PdfPageCanvas, DocumentPageImage } from '@/components/compounds/PageStack'
import { getPdf } from '@/components/compounds/PageStack/PdfPageCanvas'
import type { CaseSummary } from './case-data'
import { FULL_WIDTH, PAGE_HEIGHT, SCALE } from './transition/layout'
import './case-document-viewer.css'

const PAGE_GAP = 16 * SCALE
const PAGE_DISPLAY_HEIGHT = PAGE_HEIGHT * SCALE
const THUMBNAIL_WIDTH = 96
const WIPE_EDGE_WIDTH = 48

interface CaseDocumentViewerProps {
  caseSummary: CaseSummary
  contentVisible: boolean
}

interface LazyPdfPageProps {
  url: string
  pageNumber: number
  eager?: boolean
}

function LazyPdfPage({ url, pageNumber, eager = false }: LazyPdfPageProps) {
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
        <PdfPageCanvas
          url={url}
          pageNumber={pageNumber}
          targetWidth={FULL_WIDTH}
          className="case-document-viewer__page-canvas"
        />
      )}
    </div>
  )
}

export function CaseDocumentViewer({
  caseSummary,
  contentVisible,
}: CaseDocumentViewerProps) {
  const [pageCount, setPageCount] = useState(caseSummary.pageCount)
  const [activePage, setActivePage] = useState(1)
  const pageRefs = useRef<Array<HTMLElement | null>>([])
  const thumbnailListRef = useRef<HTMLOListElement>(null)
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([])

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
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      list.scrollBy({
        top: scrollDelta,
        behavior: reduceMotion ? 'auto' : 'smooth',
      })
    }
  }, [activePage, pageCount])

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)
  const totalHeight =
    pageCount * PAGE_DISPLAY_HEIGHT + Math.max(0, pageCount - 1) * PAGE_GAP

  const goToPage = (pageNumber: number) => {
    setActivePage(pageNumber)
    pageRefs.current[pageNumber - 1]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

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

      <PageStack pageCount={pageCount} mode="list" scale={SCALE} />

      <div className="case-document-viewer__pages">
        {pages.map((pageNumber, index) => {
          const top = index * (PAGE_DISPLAY_HEIGHT + PAGE_GAP)
          const isFirstPage = pageNumber === 1
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
