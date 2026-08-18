import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { PageStack, DocumentPageImage, PdfPageCanvas } from '@/components/compounds/PageStack'
import { PkButton, type PkButtonIcon } from '@/components/primitives/Button'
import { getCaseById } from './case-data'
import { DETAIL_PAGE_HEADER_HEIGHT, FULL_WIDTH, PAGE_HEIGHT, SCALE } from './transition/layout'

const BackArrowIcon: PkButtonIcon = ({ size, strokeWidth, className }) => (
  <HugeiconsIcon
    icon={ArrowLeft02Icon}
    size={size}
    strokeWidth={strokeWidth}
    className={className}
    color="currentColor"
  />
)

function BackToCasesButton({ className }: { className?: string }) {
  return (
    <PkButton variant="secondary" size="sm" leadingIcon={BackArrowIcon} className={className} asChild>
      <Link to="/">Back to cases</Link>
    </PkButton>
  )
}

const CONTENT_REVEAL_DELAY_MS = 400

const OVERLAY_HEIGHT = PAGE_HEIGHT * SCALE
const WIPE_EDGE_WIDTH = 48

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const caseSummary = id ? getCaseById(id) : undefined
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    const timer = setTimeout(() => setShowContent(true), CONTENT_REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!caseSummary) {
    return (
      <div className="min-h-screen bg-surface-body p-12">
        <p className="text-body-14 text-content-secondary">Case not found.</p>
        <BackToCasesButton className="mt-2" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-body p-12 flex flex-col items-center">
      {/* Fixed height (not text-flow margin) so this lines up pixel-for-pixel
          with BookOpenTransition's DETAIL_TOP settle target. */}
      <div className="w-full max-w-[600px] flex items-center" style={{ height: DETAIL_PAGE_HEADER_HEIGHT }}>
        <BackToCasesButton />
      </div>

      <div className="relative" style={{ width: FULL_WIDTH }}>
        {/* Skeleton stack — sheet boxes grow via real width/height (crisp
            radius/border), skeleton content scales via transform to match. */}
        <PageStack pageCount={caseSummary.pageCount} mode="list" scale={SCALE} />

        {/*
         * Real content for sheet 0 — rendered at its true final size, no
         * transform involved, so PDF/text content never blurs or distorts.
         * Always mounted (not conditionally rendered) so the PDF has the
         * full CONTENT_REVEAL_DELAY_MS window to load/render in the
         * background before the reveal starts. A single fixed-width soft
         * mask edge moves bottom-to-top over the static skeleton underneath.
         */}
        <div
          className="pk-page-stack__reveal-overlay"
          style={
            {
              width: FULL_WIDTH,
              height: OVERLAY_HEIGHT,
              '--pk-wipe-y': showContent ? `${OVERLAY_HEIGHT + WIPE_EDGE_WIDTH}px` : `-${WIPE_EDGE_WIDTH}px`,
              pointerEvents: showContent ? 'auto' : 'none',
            } as CSSProperties
          }
        >
          {caseSummary.documentUrl ? (
            <PdfPageCanvas url={caseSummary.documentUrl} targetWidth={FULL_WIDTH} />
          ) : (
            <DocumentPageImage caseNumber={caseSummary.caseNumber} />
          )}
        </div>
      </div>
    </div>
  )
}
