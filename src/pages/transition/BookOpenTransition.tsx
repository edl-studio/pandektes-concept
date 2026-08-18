import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import { PageStack, STACK_LAYOUT_SPRING } from '@/components/compounds/PageStack'
import { CASE_BOOK_HOVER_PAGE_LIFT } from '@/components/compounds/CaseBook'
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

const REORGANIZE_MS = 750
const STACK_HOLD_MS = 320 // beat on the small list before it grows
/** Viewport Y the sheaf actually visits at the top of the inverted-U. */
const APEX_TOP = 48
const EXTRACT_PAGE_LIFT = 170
const EXTRACT_PAGE_SPREAD = 3
const CENTER_X_SPREAD = 6
const CENTER_SPREAD_MS = 900
const EXTRACT_THRESHOLD = 0.2
const APEX_PROGRESS = 0.55
const FLIGHT_SPRING = {
  type: 'spring',
  stiffness: 45,
  damping: 15,
  mass: 1.2,
} as const

type Phase = 'extracting' | 'flying' | 'spreading' | 'reorganizing' | 'scaling' | 'settling'

/** Cubic Bézier used by both halves of the continuous flight path. */
function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

/**
 * Two cubic segments joined with a shared, non-zero horizontal tangent.
 * Unlike the old pair of quadratics, this visits the apex without stopping.
 */
function continuousArc(
  t: number,
  p0: number,
  c1: number,
  c2: number,
  apex: number,
  c3: number,
  c4: number,
  p2: number,
) {
  if (t <= APEX_PROGRESS) {
    return cubicBezier(t / APEX_PROGRESS, p0, c1, c2, apex)
  }
  return cubicBezier((t - APEX_PROGRESS) / (1 - APEX_PROGRESS), apex, c3, c4, p2)
}

export function BookOpenTransition({
  caseSummary,
  originRect,
  onExtracted,
  onComplete,
}: {
  caseSummary: CaseSummary
  originRect: OriginRect
  onExtracted: () => void
  onComplete: () => void
}) {
  const [phase, setPhase] = useState<Phase>('extracting')

  const stackHandoffY = window.innerHeight / 2 - BOOK_HEIGHT / 2
  const stackRestY = DETAIL_TOP

  // The sheets and this left offset use the same spring, so their normalized
  // progress stays aligned while the real sheet boxes grow around center.
  const stackLeftSmall = window.innerWidth / 2 - PAGE_WIDTH / 2
  const stackLeftLarge = window.innerWidth / 2 - (PAGE_WIDTH * SCALE) / 2

  const startScale = originRect.width / BOOK_WIDTH
  const startRotation = originRect.rotation ?? 0
  const wasOpen = originRect.open ?? false
  const startLeft = originRect.x + (wasOpen ? OPEN_PAGE_NUDGE * startScale : 0)
  const startTop = originRect.y - (wasOpen ? CASE_BOOK_HOVER_PAGE_LIFT * startScale : 0)
  const extractedTop = originRect.y - EXTRACT_PAGE_LIFT * startScale
  // Visited peak: near the top of the viewport, halfway across to center.
  const travelX = stackLeftSmall - startLeft
  const apexX = startLeft + travelX * 0.5
  const apexY = Math.min(APEX_TOP, extractedTop - 24, stackHandoffY - 24)
  const apexHandleLeft = travelX * 0.16
  // Account for the unequal segment durations so velocity is continuous
  // through the apex, rather than merely pointing in the same direction.
  const apexHandleRight = apexHandleLeft * ((1 - APEX_PROGRESS) / APEX_PROGRESS)

  const leftMv = useMotionValue(startLeft)
  const topMv = useMotionValue(startTop)
  const scaleMv = useMotionValue(startScale)
  const rotateMv = useMotionValue(startRotation)

  useEffect(() => {
    let cancelled = false
    const stops: Array<{ stop: () => void }> = []
    const timers: Array<ReturnType<typeof setTimeout>> = []
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, ms))
      })

    async function run() {
      let extracted = false
      // One progress value owns the full book-to-center journey. The first
      // cubic leaves vertically, and both cubics pass through the apex with
      // continuous velocity, so neither extraction nor the apex is a stop.
      const flight = animate(0, 1, {
        ...FLIGHT_SPRING,
        onUpdate(t) {
          leftMv.set(
            continuousArc(
              t,
              startLeft,
              startLeft,
              apexX - apexHandleLeft,
              apexX,
              apexX + apexHandleRight,
              stackLeftSmall,
              stackLeftSmall,
            ),
          )
          topMv.set(
            continuousArc(
              t,
              startTop,
              extractedTop,
              apexY,
              apexY,
              apexY,
              apexY + (stackHandoffY - apexY) * 0.55,
              stackHandoffY,
            ),
          )

          if (!extracted && t >= EXTRACT_THRESHOLD) {
            extracted = true
            setPhase('flying')
            onExtracted()
          }

          const flyProgress = Math.max(0, (t - EXTRACT_THRESHOLD) / (1 - EXTRACT_THRESHOLD))
          scaleMv.set(startScale + (1 - startScale) * flyProgress)
          rotateMv.set(startRotation * (1 - flyProgress))
        },
      })
      stops.push(flight)
      await flight
      if (cancelled) return

      setPhase('spreading')
      await wait(CENTER_SPREAD_MS)
      if (cancelled) return

      setPhase('reorganizing')
      await wait(REORGANIZE_MS + STACK_HOLD_MS)
      if (cancelled) return

      setPhase('scaling')
      const scaling = animate(leftMv, stackLeftLarge, {
        ...STACK_LAYOUT_SPRING,
      })
      stops.push(scaling)
      await scaling
      if (cancelled) return

      setPhase('settling')
      const settling = animate(topMv, stackRestY, {
        ...STACK_LAYOUT_SPRING,
      })
      stops.push(settling)
      await settling
      if (!cancelled) onComplete()
    }

    void run()
    return () => {
      cancelled = true
      stops.forEach((playback) => playback.stop())
      timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isExtracting = phase === 'extracting'
  const isFlying = phase === 'flying'
  const isSpreading = phase === 'spreading'
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
          initialSpread={wasOpen ? OPEN_PAGE_SPREAD : 1}
          initialXSpread={wasOpen ? OPEN_PAGE_SPREAD : 1}
          spread={isExtracting || isFlying || isSpreading ? EXTRACT_PAGE_SPREAD : 1}
          xSpread={isExtracting || isFlying || isSpreading ? CENTER_X_SPREAD : 1}
          springFan={isExtracting || isFlying || isSpreading}
          gentleFan={isExtracting || isFlying || isSpreading}
        />
      </motion.div>

      {isExtracting && tile && (
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
