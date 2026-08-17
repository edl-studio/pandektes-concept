import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PkCaseBook } from '@/components/compounds/CaseBook'
import { PageStack } from '@/components/compounds/PageStack'
import type { CaseSummary } from '../case-data'
import { BOOK_HEIGHT, BOOK_WIDTH, DETAIL_TOP, PAGE_WIDTH, SCALE } from './layout'

export interface OriginRect {
  x: number
  y: number
  width: number
  height: number
}

const SLIDE_MS = 500
const COVER_EXIT_MS = 400
const FAN_HOLD_MS = 100 // brief beat at the handoff so the fan→list restack has a "before" to animate from
const REORGANIZE_MS = 500
const SCALE_MS = 450 // must match page-stack.css's sheet width/height transition duration (0.45s) — see note below
const SETTLE_MS = 400

type Phase = 'sliding' | 'cover-exiting' | 'fanned' | 'reorganizing' | 'scaling' | 'settling'

export function BookOpenTransition({
  caseSummary,
  originRect,
  onComplete,
}: {
  caseSummary: CaseSummary
  originRect: OriginRect
  onComplete: () => void
}) {
  const [phase, setPhase] = useState<Phase>('sliding')
  const Logo = caseSummary.Logo

  useEffect(() => {
    const t1 = SLIDE_MS
    const t2 = t1 + COVER_EXIT_MS
    const t3 = t2 + FAN_HOLD_MS
    const t4 = t3 + REORGANIZE_MS
    const t5 = t4 + SCALE_MS
    const t6 = t5 + SETTLE_MS
    const timers = [
      setTimeout(() => setPhase('cover-exiting'), t1),
      setTimeout(() => setPhase('fanned'), t2),
      setTimeout(() => setPhase('reorganizing'), t3),
      setTimeout(() => setPhase('scaling'), t4),
      setTimeout(() => setPhase('settling'), t5),
      setTimeout(onComplete, t6),
    ]
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bookCenterX = window.innerWidth / 2 - BOOK_WIDTH / 2
  const bookCenterY = window.innerHeight / 2 - BOOK_HEIGHT / 2

  const stackHandoffY = bookCenterY
  const stackRestY = DETAIL_TOP

  // The stack's box now grows via real width (not transform), so staying
  // centered means explicitly animating `left` between the two known
  // widths' centers — a percentage-based translate(-50%) does NOT track a
  // continuously CSS-transitioning width correctly (it resolves once, not
  // every frame), which is exactly what caused the top-left-anchored growth.
  // This only stays centered THROUGHOUT the animation (not just at the two
  // endpoints) because `left`'s duration/easing here exactly matches
  // page-stack.css's sheet width/height transition — same duration + same
  // easing curve means both interpolate through the same progress at every
  // instant, which cancels out algebraically. If either duration changes,
  // update the other to match.
  const stackLeftSmall = window.innerWidth / 2 - PAGE_WIDTH / 2
  const stackLeftLarge = window.innerWidth / 2 - PAGE_WIDTH * SCALE / 2

  const showBook = phase === 'sliding' || phase === 'cover-exiting'
  const isReorganized = phase === 'reorganizing' || phase === 'scaling' || phase === 'settling'
  const isScaled = phase === 'scaling' || phase === 'settling'
  const isSettled = phase === 'settling'
  // Timeline thumbs are CSS-scaled (0.5) with transform-origin top left.
  // Grow from that visual size so the overlay doesn't pop to 188×233.
  const startScale = originRect.width / BOOK_WIDTH

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {showBook && (
        <motion.div
          className="fixed"
          style={{ width: BOOK_WIDTH, height: BOOK_HEIGHT, transformOrigin: 'top left' }}
          initial={{ x: originRect.x, y: originRect.y, scale: startScale }}
          animate={{ x: bookCenterX, y: bookCenterY, scale: 1 }}
          transition={{ duration: SLIDE_MS / 1000, ease: 'easeInOut' }}
        >
          {/* No caseNumber/title passed — the transition never shows this
              text, so there's nothing in the DOM that could leak through
              during the reposition. */}
          <PkCaseBook
            pageCount={caseSummary.pageCount}
            logo={Logo ? <Logo /> : undefined}
            open
            coverExiting={phase === 'cover-exiting'}
          />
        </motion.div>
      )}

      {!showBook && (
        <motion.div
          className="fixed"
          initial={{ left: stackLeftSmall, top: stackHandoffY }}
          animate={{
            left: isScaled ? stackLeftLarge : stackLeftSmall,
            top: isSettled ? stackRestY : stackHandoffY,
          }}
          transition={{
            left: { duration: SCALE_MS / 1000, ease: 'easeInOut' },
            top: { duration: (isSettled ? SETTLE_MS : REORGANIZE_MS) / 1000, ease: 'easeInOut' },
          }}
        >
          <PageStack
            pageCount={caseSummary.pageCount}
            mode={isReorganized ? 'list' : 'fan'}
            scale={isScaled ? SCALE : 1}
          />
        </motion.div>
      )}
    </div>
  )
}
