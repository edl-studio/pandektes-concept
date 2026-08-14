import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageStack, DocumentPageImage, PdfPageCanvas } from '@/components/compounds/PageStack'
import { getCaseById } from './case-data'
import { DETAIL_PAGE_HEADER_HEIGHT, FULL_WIDTH, PAGE_HEIGHT, SCALE } from './transition/layout'

const CONTENT_REVEAL_DELAY_MS = 400

// Explicit equal width/height (not a %, which resolves independently
// against this box's non-square dimensions and stretches the circle into
// an ellipse) keeps the iris mask a true circle. Sized to comfortably
// cover the box's own diagonal so "fully open" shows no circular clipping.
const OVERLAY_HEIGHT = PAGE_HEIGHT * SCALE
const MASK_DIAMETER = Math.ceil(Math.hypot(FULL_WIDTH, OVERLAY_HEIGHT) * 1.1)

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const caseSummary = id ? getCaseById(id) : undefined
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), CONTENT_REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!caseSummary) {
    return (
      <div className="min-h-screen bg-surface-body p-12">
        <p className="text-body-14 text-content-secondary">Case not found.</p>
        <Link to="/" className="text-body-14 text-accent mt-2 inline-block">
          Back to cases
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-body p-12 flex flex-col items-center">
      {/* Fixed height (not text-flow margin) so this lines up pixel-for-pixel
          with BookOpenTransition's DETAIL_TOP settle target. */}
      <div className="w-full max-w-[600px] flex items-center" style={{ height: DETAIL_PAGE_HEADER_HEIGHT }}>
        <Link to="/" className="text-body-14 text-content-secondary">
          ← Back to cases
        </Link>
      </div>

      <div className="relative" style={{ width: FULL_WIDTH }}>
        {/* Skeleton stack — sheet boxes grow via real width/height (crisp
            radius/border), skeleton content scales via transform to match. */}
        <PageStack pageCount={caseSummary.pageCount} mode="list" scale={SCALE} revealFirstPage={showContent} />

        {/*
         * Real content for sheet 0 — rendered at its true final size, no
         * transform involved, so PDF/text content never blurs or distorts.
         * Always mounted (not conditionally rendered) so the PDF has the
         * full CONTENT_REVEAL_DELAY_MS window to load/render in the
         * background before the reveal starts. Iris-opens via mask-size,
         * mirroring the skeleton's iris-close on the layer underneath.
         */}
        <div
          className="pk-page-stack__reveal-overlay"
          style={{
            width: FULL_WIDTH,
            height: OVERLAY_HEIGHT,
            WebkitMaskSize: showContent ? `${MASK_DIAMETER}px ${MASK_DIAMETER}px` : '0px 0px',
            maskSize: showContent ? `${MASK_DIAMETER}px ${MASK_DIAMETER}px` : '0px 0px',
            pointerEvents: showContent ? 'auto' : 'none',
          }}
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
