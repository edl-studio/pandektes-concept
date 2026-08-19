import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'
import { PageStack, STACK_LAYOUT_SPRING } from '@/components/compounds/PageStack'
import {
  CASE_BOOK_HOVER_PAGE_LIFT,
  MAX_CASE_BOOK_SHEETS,
} from '@/components/compounds/CaseBook'
import { FlickeringGrid } from '@/components/effects/FlickeringGrid'
import { Orb } from '@/components/effects/Orb'
import type { CaseSummary } from '../case-data'
import {
  BOOK_HEIGHT,
  BOOK_WIDTH,
  DETAIL_TOP,
  getDetailDocumentLeft,
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

const REORGANIZE_MS = 900 // Includes the back-to-front restack stagger before the final settle.
const PRESTACK_X_MS = 300 // Collapse horizontal offsets before sheets descend into the list.
const RESTACK_LIST_GAP = 28 // Expanded list gap that compresses back to normal before scaling.
const CENTER_X_COLLAPSE_PROGRESS = 0.72 // Begin flattening X offsets on the final approach so the sheaf lands stacked.
const CENTER_X_SETTLE_MS = 100 // Briefly hold the zero-X landing before opening the centered fan.
const STACK_HOLD_MS = 400 // Pause on the small vertical list before the final scale-up begins.
const APEX_TOP = -128 // Viewport Y (px) reached at the highest point of the sheaf's curved flight.
const EXTRACT_PAGE_LIFT = 170 // Unscaled upward pull (px) used to shape the flight's initial vertical tangent.
const CENTER_X_SPREAD = 6 // Horizontal-only fan multiplier reached gradually before restacking.
const CENTER_SPREAD_MS = 150 // Brief center handoff before the loading wave begins.
const BOUNCE_UP_Y = -20 // Upper extent of the wave relative to each sheet's baseline.
const BOUNCE_DOWN_Y = 20 // Lower extent; positive Y carries the wave below baseline before it rises again.
const BOUNCE_UP_MS = 650 // Reverses the wave while its softer springs still carry upward momentum.
const BOUNCE_DOWN_MS = 650 // Matches the upward phase so the wave is temporally symmetrical.
const BOUNCE_COUNT = 3 // Number of fake-loading bounce cycles completed before restacking.
const LOADING_LABELS = [
  'Reading the document…',
  'Identifying key arguments…',
  'Tracing citations…',
] as const
// Leave enough time for each shimmer-sweep exit and entrance within the loading wave.
const LOADING_LABEL_SWAP_DELAYS_MS = [950, 2050] as const
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
  | 'centering-x'
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

function ShimmerSweepLabel({
  text,
  reducedMotion,
}: {
  text: string
  reducedMotion: boolean
}) {
  const stageRef = useRef<HTMLSpanElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const displayedTextRef = useRef('')

  useEffect(() => {
    const stage = stageRef.current
    const element = labelRef.current
    if (!stage || !element) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const playbacks: Array<{ stop: () => void }> = []
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms)
      })

    async function swap(stage: HTMLSpanElement, element: HTMLSpanElement) {
      if (reducedMotion) {
        element.textContent = text
        stage.style.width = 'auto'
        displayedTextRef.current = text
        return
      }

      const hasDisplayedText = Boolean(displayedTextRef.current)
      if (hasDisplayedText) {
        const exit = animate(
          element,
          { opacity: 0, x: 22, filter: 'blur(8px)' },
          { duration: 0.468, ease: [0.7, 0, 0.84, 0] },
        )
        playbacks.push(exit)
        await exit
        if (cancelled) return
      }

      element.textContent = text
      displayedTextRef.current = text
      element.style.opacity = '0'
      element.style.transform = 'translateX(-22px)'
      element.style.filter = 'blur(8px)'
      const nextWidth = element.getBoundingClientRect().width

      if (hasDisplayedText) {
        const layout = animate(
          stage,
          { width: nextWidth },
          { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        )
        playbacks.push(layout)
      } else {
        stage.style.width = `${nextWidth}px`
      }

      if (displayedTextRef.current !== LOADING_LABELS[0]) {
        await wait(36)
        if (cancelled) return
      }

      const enter = animate(
        element,
        { opacity: 1, x: 0, filter: 'blur(0px)' },
        { duration: 0.612, ease: [0.22, 1, 0.36, 1] },
      )
      playbacks.push(enter)
      await enter
    }

    void swap(stage, element)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      playbacks.forEach((playback) => playback.stop())
    }
  }, [reducedMotion, text])

  return (
    <span ref={stageRef} className="pk-book-transition__label-stage">
      <span ref={labelRef} className="pk-book-transition__label-text" />
    </span>
  )
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
  const [loadingLabelIndex, setLoadingLabelIndex] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  const stackHandoffY = window.innerHeight / 2 - BOOK_HEIGHT / 2
  const stackRestY = DETAIL_TOP

  // The sheets and this left offset use the same spring, so their normalized
  // progress stays aligned while the real sheet boxes grow around center.
  const stackLeftSmall = window.innerWidth / 2 - PAGE_WIDTH / 2
  const stackLeftLarge = getDetailDocumentLeft(window.innerWidth)

  const startScale = originRect.width / BOOK_WIDTH
  const startRotation = originRect.rotation ?? 0
  const wasOpen = originRect.open ?? false
  const flightXSpread = wasOpen ? OPEN_PAGE_SPREAD : 1
  const flightYSpread = wasOpen ? OPEN_PAGE_SPREAD : 1
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

  const xMv = useMotionValue(startLeft)
  const yMv = useMotionValue(startTop)
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
      let centeringX = false
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
          xMv.set(point.x)
          yMv.set(point.y)

          if (!extracted && t >= EXTRACT_THRESHOLD) {
            extracted = true
            setPhase('flying')
            onExtracted()
            backgroundReady = wait(BACKGROUND_FADE_MS)
          }

          if (!centeringX && t >= CENTER_X_COLLAPSE_PROGRESS) {
            centeringX = true
            setPhase('centering-x')
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

      if (!centeringX) setPhase('centering-x')
      await wait(CENTER_X_SETTLE_MS)
      if (cancelled) return

      setPhase('spreading')
      setLoadingLabelIndex(0)
      LOADING_LABEL_SWAP_DELAYS_MS.forEach((delay, index) => {
        timers.push(
          setTimeout(() => {
            if (!cancelled) setLoadingLabelIndex(index + 1)
          }, delay),
        )
      })
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
      const scalingX = animate(xMv, stackLeftLarge, {
        ...STACK_LAYOUT_SPRING,
      })
      const scalingY = animate(yMv, stackRestY, {
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
  const isCenteringX = phase === 'centering-x'
  const isSpreading = phase === 'spreading'
  const isAligningX = phase === 'aligning-x'
  const isFanned =
    isExtracting || isFlying || isCenteringX || isSpreading || isAligningX
  const isReorganized = phase === 'reorganizing' || phase === 'scaling'
  const isBounceRestacking = phase === 'reorganizing' && bouncePhase === 'down'
  const isScaled = phase === 'scaling'
  const currentXSpread = isSpreading
    ? CENTER_X_SPREAD
    : isExtracting || isFlying
      ? flightXSpread
      : 0
  const currentYSpread = isExtracting ? flightYSpread : 0

  const tile = originRect.tile

  return (
    <div className="pk-book-transition fixed inset-0 z-[100] pointer-events-none">
      <div
        aria-hidden="true"
        className={`pk-book-transition__backdrop${isExtracting ? '' : ' pk-book-transition__backdrop--visible'}`}
      />

      <motion.div
        className="fixed top-0 left-0 z-[2]"
        style={{
          x: xMv,
          y: yMv,
          scale: scaleMv,
          rotate: rotateMv,
          transformOrigin: 'top left',
        }}
      >
        <PageStack
          pageCount={Math.min(caseSummary.pageCount, MAX_CASE_BOOK_SHEETS)}
          mode={isReorganized ? 'list' : 'fan'}
          frontSheetBackdrop={
            <AnimatePresence>
              {isSpreading && (
                <motion.div
                  className="pk-book-transition__flickering-grid"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 0.25,
                    transition: {
                      duration: prefersReducedMotion ? 0.12 : 1.2,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  }}
                  exit={{
                    opacity: 0,
                    transition: {
                      duration: prefersReducedMotion ? 0.12 : 0.25,
                      ease: 'easeOut',
                    },
                  }}
                >
                  <FlickeringGrid
                    color="#7d2334"
                    flickerChance={0.22}
                    maxOpacity={0.32}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          }
          skeletonShimmer={false}
          scale={isScaled ? SCALE : 1}
          initialSpread={wasOpen ? OPEN_PAGE_SPREAD : 1}
          initialXSpread={flightXSpread}
          xSpread={currentXSpread}
          ySpread={currentYSpread}
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
          alignRotation={isFlying || isCenteringX || isSpreading || isAligningX}
          alignX={isCenteringX || isAligningX}
          alignedXStep={isCenteringX ? 1 : 0}
          listGap={isBounceRestacking ? RESTACK_LIST_GAP : undefined}
          restackFromBounce={isBounceRestacking}
        />
      </motion.div>

      <AnimatePresence>
        {isSpreading && (
          <motion.div
            className="pk-book-transition__loader"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, filter: 'blur(6px)' }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, filter: 'blur(0px)' }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, filter: 'blur(6px)' }
            }
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.22, ease: 'easeOut' }}
          >
            <Orb
              label={LOADING_LABELS[loadingLabelIndex]}
              labelContent={
                <ShimmerSweepLabel
                  reducedMotion={Boolean(prefersReducedMotion)}
                  text={LOADING_LABELS[loadingLabelIndex]}
                />
              }
              pill
              variant="S3"
            />
          </motion.div>
        )}
      </AnimatePresence>

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
