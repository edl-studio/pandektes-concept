import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import { PageStack } from '@/components/compounds/PageStack'
import type { CaseSummary } from '../case-data'
import {
  BOOK_HEIGHT,
  BOOK_WIDTH,
  DETAIL_TOP,
  OPEN_PAGE_NUDGE,
  OPEN_PAGE_SPREAD,
  PAGE_WIDTH,
  SCALE,
} from './layout'

export interface OriginRect {
  x: number
  y: number
  width: number
  height: number
  /** Hover tilt of the tile book, in degrees. Eased to 0 on the sheets. */
  rotation?: number
  /** Whether the tile book was in its hover-open state (cover ajar, pages spread). */
  open?: boolean
  /** Tile overflow, in unscaled book pixels. `bottom` drives how far the lift rises. */
  clip?: { top: number; right: number; bottom: number; left: number }
  /** Viewport box of the tile clip. Stays put while the sheets lift through it. */
  tile?: { left: number; top: number; right: number; bottom: number }
}

export const LIFT_MS = 280
const FLY_MS = 1050
const REORGANIZE_MS = 500
const STACK_HOLD_MS = 320 // beat on the small list before it grows
const SCALE_MS = 700 // must match page-stack.css's sheet width/height transition duration (0.7s) — see note below
const SETTLE_MS = 400
/** Viewport Y the sheaf actually visits at the top of the inverted-U. */
const APEX_TOP = 48

type Phase = 'lifting' | 'sliding' | 'reorganizing' | 'scaling' | 'settling'

/** Quadratic Bézier. `p1` is the control point — the curve only aims at it. */
function quadBezier(t: number, p0: number, p1: number, p2: number) {
  const u = 1 - t
  return u * u * p0 + 2 * u * t * p1 + t * t * p2
}

/** Two quads that meet at `apex`, so the path visits the high point. */
function invertedU(
  t: number,
  p0: number,
  c1: number,
  apex: number,
  c2: number,
  p2: number,
) {
  if (t <= 0.5) return quadBezier(t * 2, p0, c1, apex)
  return quadBezier((t - 0.5) * 2, apex, c2, p2)
}

export function BookOpenTransition({
  caseSummary,
  originRect,
  onComplete,
}: {
  caseSummary: CaseSummary
  originRect: OriginRect
  onComplete: () => void
}) {
  const [phase, setPhase] = useState<Phase>('lifting')

  const stackHandoffY = window.innerHeight / 2 - BOOK_HEIGHT / 2
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
  const stackLeftLarge = window.innerWidth / 2 - (PAGE_WIDTH * SCALE) / 2

  const startScale = originRect.width / BOOK_WIDTH
  const startRotation = originRect.rotation ?? 0
  const wasOpen = originRect.open ?? false
  const startLeft = originRect.x + (wasOpen ? OPEN_PAGE_NUDGE * startScale : 0)
  // Visited peak: near the top of the viewport, halfway across to center.
  const apexX = startLeft + (stackLeftSmall - startLeft) * 0.5
  const apexY = Math.min(APEX_TOP, originRect.y - 24, stackHandoffY - 24)

  const leftMv = useMotionValue(startLeft)
  const topMv = useMotionValue(originRect.y)
  const scaleMv = useMotionValue(startScale)
  const rotateMv = useMotionValue(startRotation)

  useEffect(() => {
    const p0x = startLeft
    const p0y = originRect.y
    const p2x = stackLeftSmall
    const p2y = stackHandoffY

    const stops: Array<{ stop: () => void }> = [
      animate(0, 1, {
        duration: FLY_MS / 1000,
        ease: 'easeInOut',
        onUpdate(t) {
          // Up out of the book (control above the book), across the apex,
          // then down into center (control above the landing).
          leftMv.set(invertedU(t, p0x, p0x, apexX, p2x, p2x))
          topMv.set(invertedU(t, p0y, apexY, apexY, apexY, p2y))
          scaleMv.set(startScale + (1 - startScale) * t)
          rotateMv.set(startRotation * (1 - t))
        },
      }),
    ]

    const t0 = LIFT_MS
    const t1 = FLY_MS
    const t2 = t1 + REORGANIZE_MS + STACK_HOLD_MS
    const t3 = t2 + SCALE_MS
    const t4 = t3 + SETTLE_MS
    const timers = [
      setTimeout(() => setPhase('sliding'), t0),
      setTimeout(() => setPhase('reorganizing'), t1),
      setTimeout(() => {
        setPhase('scaling')
        stops.push(animate(leftMv, stackLeftLarge, { duration: SCALE_MS / 1000, ease: 'easeInOut' }))
      }, t2),
      setTimeout(() => {
        setPhase('settling')
        stops.push(animate(topMv, stackRestY, { duration: SETTLE_MS / 1000, ease: 'easeInOut' }))
      }, t3),
      setTimeout(onComplete, t4),
    ]
    return () => {
      stops.forEach((playback) => playback.stop())
      timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLifting = phase === 'lifting'
  const isReorganized = phase === 'reorganizing' || phase === 'scaling' || phase === 'settling'
  const isScaled = phase === 'scaling' || phase === 'settling'

  const tile = originRect.tile

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <motion.div
        className="fixed z-[2]"
        style={{
          left: leftMv,
          top: topMv,
          scale: scaleMv,
          rotate: rotateMv,
          transformOrigin: 'top left',
        }}
      >
        <PageStack
          pageCount={caseSummary.pageCount}
          mode={isReorganized ? 'list' : 'fan'}
          scale={isScaled ? SCALE : 1}
          spread={isLifting && wasOpen ? OPEN_PAGE_SPREAD : 1}
        />
      </motion.div>

      {isLifting && tile && (
        <div
          className="fixed z-[3]"
          style={{
            left: tile.left,
            top: tile.bottom,
            width: tile.right - tile.left,
            height: 64,
            backgroundColor: 'var(--pk-color-surface-body)',
          }}
        />
      )}
    </div>
  )
}
