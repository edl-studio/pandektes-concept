import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue, useSpring } from 'framer-motion'
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

const REORGANIZE_MS = 750 // Time allowed for the centered fan to spring into a vertical list.
const PRESTACK_X_MS = 300 // Collapse horizontal offsets before sheets descend into the list.
const STACK_HOLD_MS = 400 // Pause on the small vertical list before the final scale-up begins.
const APEX_TOP = 12 // Viewport Y (px) reached at the highest point of the sheaf's curved flight.
const EXTRACT_PAGE_LIFT = 170 // Unscaled upward pull (px) used to shape the flight's initial vertical tangent.
const EXTRACT_PAGE_SPREAD = 3 // Y-offset and rotation fan multiplier while the sheaf is extracted/in flight.
const CENTER_X_SPREAD = 6 // Horizontal-only fan multiplier reached gradually before restacking.
const CENTER_SPREAD_MS = 900 // Time at center for horizontal spreading to slow and settle before restacking.
const BOUNCE_UP_Y = -32 // Upper extent of the wave relative to each sheet's baseline.
const BOUNCE_DOWN_Y = 32 // Lower extent; positive Y carries the wave below baseline before it rises again.
const BOUNCE_UP_MS = 650 // Reverses the wave while its softer springs still carry upward momentum.
const BOUNCE_DOWN_MS = 700 // Lets the un-delayed return flow through before the next wave begins.
const BOUNCE_COUNT = 3 // Number of fake-loading bounce cycles completed before restacking.
const BACKGROUND_FADE_MS = 750 // CSS background fade delay (400ms) + fade (350ms); wave waits for completion.
const EXTRACT_THRESHOLD = 0.2 // Flight progress (0–1) that starts the book sink, page fade, and bounce clock.
const APEX_PROGRESS = 0.55 // Flight progress (0–1) at which the sheaf reaches the top of its arc.
const FLIGHT_SPRING = {
  type: 'spring',
  stiffness: 48,
  damping: 15,
  mass: 1.2,
} as const
const ROTATION_SPRING = {
  stiffness: 45,
  damping: 14,
  mass: 1.4,
} as const

type Phase =
  | 'extracting'
  | 'flying'
  | 'spreading'
  | 'aligning-x'
  | 'reorganizing'
  | 'scaling'
type BouncePhase = 'idle' | 'up' | 'down'

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
  const [bouncePhase, setBouncePhase] = useState<BouncePhase>('idle')

  const stackHandoffY = window.innerHeight / 2 - BOOK_HEIGHT / 2
  const stackRestY = DETAIL_TOP

  // The sheets and this left offset use the same spring, so their normalized
  // progress stays aligned while the real sheet boxes grow around center.
  const stackLeftSmall = window.innerWidth / 2 - PAGE_WIDTH / 2
  const stackLeftLarge = window.innerWidth / 2 - (PAGE_WIDTH * SCALE) / 2

  const startScale = originRect.width / BOOK_WIDTH
  const startRotation = originRect.rotation ?? 0
  const wasOpen = originRect.open ?? false
  const flightXSpread = wasOpen ? OPEN_PAGE_SPREAD : 1
  const flightRotationSpread = wasOpen ? OPEN_PAGE_SPREAD : 1
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

  function flightPoint(t: number) {
    return {
      x: continuousArc(
        t,
        startLeft,
        startLeft,
        apexX - apexHandleLeft,
        apexX,
        apexX + apexHandleRight,
        stackLeftSmall,
        stackLeftSmall,
      ),
      y: continuousArc(
        t,
        startTop,
        extractedTop,
        apexY,
        apexY,
        apexY,
        apexY + (stackHandoffY - apexY) * 0.55,
        stackHandoffY,
      ),
    }
  }

  const leftMv = useMotionValue(startLeft)
  const topMv = useMotionValue(startTop)
  const scaleMv = useMotionValue(startScale)
  const rotateTargetMv = useMotionValue(startRotation)
  const rotateMv = useSpring(rotateTargetMv, ROTATION_SPRING)

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
      let backgroundReady = Promise.resolve()

      async function runBounceSequence() {
        for (let cycle = 0; cycle < BOUNCE_COUNT; cycle += 1) {
          setBouncePhase('up')
          await wait(BOUNCE_UP_MS)
          if (cancelled) return

          // Leave the final cycle raised. The main sequence sends it
          // directly into list positions instead of settling the fan first.
          if (cycle === BOUNCE_COUNT - 1) return

          setBouncePhase('down')
          await wait(BOUNCE_DOWN_MS)
          if (cancelled) return
        }
      }

      // One progress value owns the full book-to-center journey. The first
      // cubic leaves vertically, and both cubics pass through the apex with
      // continuous velocity, so neither extraction nor the apex is a stop.
      const flight = animate(0, 1, {
        ...FLIGHT_SPRING,
        onUpdate(t) {
          const pathT = Math.max(0, Math.min(t, 1))
          const point = flightPoint(pathT)
          const nextPoint = flightPoint(Math.min(pathT + 0.002, 1))
          leftMv.set(point.x)
          topMv.set(point.y)

          if (!extracted && t >= EXTRACT_THRESHOLD) {
            extracted = true
            setPhase('flying')
            onExtracted()
            backgroundReady = wait(BACKGROUND_FADE_MS)
          }

          const flyProgress = Math.max(0, (t - EXTRACT_THRESHOLD) / (1 - EXTRACT_THRESHOLD))
          const heading = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI)
          const bank = Math.max(-12, Math.min(heading * 0.15, 12))
          const pathTaper = Math.sin(Math.PI * pathT)
          const entranceBlend = Math.min(pathT / EXTRACT_THRESHOLD, 1)
          scaleMv.set(startScale + (1 - startScale) * flyProgress)
          rotateTargetMv.set(startRotation * (1 - entranceBlend) + bank * pathTaper)
        },
      })
      stops.push(flight)
      await flight
      if (cancelled) return

      setPhase('spreading')
      await Promise.all([wait(CENTER_SPREAD_MS), backgroundReady])
      if (cancelled) return

      // Rotation has already normalized during flight. The final downward
      // stroke collapses the remaining X fan before the vertical restack.
      await runBounceSequence()
      if (cancelled) return

      setBouncePhase('down')
      setPhase('aligning-x')
      await wait(PRESTACK_X_MS)
      if (cancelled) return

      setPhase('reorganizing')
      await wait(REORGANIZE_MS)
      if (cancelled) return

      setBouncePhase('idle')
      await wait(STACK_HOLD_MS)
      if (cancelled) return

      setPhase('scaling')
      const scalingX = animate(leftMv, stackLeftLarge, {
        ...STACK_LAYOUT_SPRING,
      })
      const scalingY = animate(topMv, stackRestY, {
        ...STACK_LAYOUT_SPRING,
      })
      stops.push(scalingX, scalingY)
      await Promise.all([scalingX, scalingY])
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
  const isAligningX = phase === 'aligning-x'
  const isFanned =
    isExtracting || isFlying || isSpreading || isAligningX
  const isReorganized = phase === 'reorganizing' || phase === 'scaling'
  const isBounceRestacking = phase === 'reorganizing' && bouncePhase === 'down'
  const isScaled = phase === 'scaling'
  const currentXSpread = isFlying || isSpreading
    ? CENTER_X_SPREAD
    : isExtracting
      ? flightXSpread
      : 1

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
          initialXSpread={flightXSpread}
          spread={isFanned ? EXTRACT_PAGE_SPREAD : 1}
          xSpread={currentXSpread}
          rotationSpread={flightRotationSpread}
          springFan={isFanned}
          gentleFan={isFanned}
          bounceY={
            bouncePhase === 'up'
              ? BOUNCE_UP_Y
              : bouncePhase === 'down'
                ? BOUNCE_DOWN_Y
                : 0
          }
          bouncePhase={bouncePhase}
          alignRotation={isFlying || isSpreading || isAligningX}
          alignX={isAligningX}
          restackFromBounce={isBounceRestacking}
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
