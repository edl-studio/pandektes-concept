import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { PkPageSkeleton } from '@/components/compounds/CaseBook'
import './page-stack.css'

// Matches PkCaseBook's own fan geometry (PAGE_STEP_OFFSET/PAGE_STEP_Y_OFFSET/
// PAGE_STEP_ROTATION) exactly, so swapping from PkCaseBook to PageStack right
// after the cover exits lines up pixel-for-pixel.
const FAN_STEP_X = 2
const FAN_STEP_Y = -1
const FAN_STEP_ROTATION = 0.5
const LIST_GAP = 16 // base units — becomes LIST_GAP * scale on screen
const BOUNCE_STAGGER_WINDOW = 0.35 // A slower front-to-back wave, normalized for any page count.
export const STACK_LAYOUT_SPRING = {
  type: 'spring',
  stiffness: 65,
  damping: 17,
  mass: 1.2,
} as const

export interface PageStackProps {
  pageCount: number
  mode: 'fan' | 'list'
  /**
   * Uniform growth factor from the base 180x233 unit. Sheet boxes grow via
   * real width/height (see page-stack.css) so border-radius/border stay
   * crisp; skeleton content scales via transform to match, so it doesn't
   * look tiny against a much bigger sheet. Defaults to 1 (base size).
   */
  scale?: number
  /**
   * Fan multiplier matching PkCaseBook's `--_spread`. 2 is the hover-open
   * sheaf; 1 is the resting fan PageStack uses after the cover handoff.
   */
  spread?: number
  /** Horizontal-only fan multiplier, allowing wider sheets without extra tilt/Y offset. */
  xSpread?: number
  /** Fan spread used for the overlay's first frame, before it springs outward. */
  initialSpread?: number
  /** Horizontal-only spread used for the overlay's first frame. */
  initialXSpread?: number
  /** Use the folder-like spring while the sheets are still a fan. */
  springFan?: boolean
  /** Use a slower spring while the fan progressively opens in flight. */
  gentleFan?: boolean
  /** Temporary Y offset used for the centered sheet-bounce wave. */
  bounceY?: number
  /** Selects direction-specific springs for the traveling sheet wave. */
  bouncePhase?: 'idle' | 'up' | 'down'
  /** Normalize fan rotation while preserving its X and Y offsets. */
  alignRotation?: boolean
  /** Normalize fan X offsets independently of rotation and Y. */
  alignX?: boolean
  /** Carry the final downward bounce directly into the vertical list. */
  restackFromBounce?: boolean
}

export function PageStack({
  pageCount,
  mode,
  scale = 1,
  spread = 1,
  xSpread = spread,
  initialSpread = spread,
  initialXSpread = initialSpread,
  springFan = false,
  gentleFan = false,
  bounceY = 0,
  bouncePhase = 'idle',
  alignRotation = false,
  alignX = false,
  restackFromBounce = false,
}: PageStackProps) {
  const height = (mode === 'list' ? pageCount * 233 + (pageCount - 1) * LIST_GAP : 233) * scale
  const fan = mode === 'fan' ? spread : 1
  const xFan = mode === 'fan' ? xSpread : 1

  return (
    <div className="pk-page-stack__root" style={{ width: 180 * scale, height }}>
      {Array.from({ length: pageCount }, (_, i) => i)
        .slice()
        .reverse()
        .map((i) => {
          const style = {
            zIndex: pageCount - i,
          } as CSSProperties
          const sheetProgress =
            pageCount <= 1 ? 0 : i / (pageCount - 1)
          const sheetBounceY = bounceY * (1 - sheetProgress * 0.25)
          const target = {
            x:
              mode === 'fan' && !alignX
                ? i * FAN_STEP_X * xFan * scale
                : 0,
            y:
              mode === 'fan'
                ? i * FAN_STEP_Y * fan * scale + sheetBounceY
                : i * (233 + LIST_GAP) * scale +
                  (restackFromBounce ? sheetBounceY : 0),
            rotate:
              mode === 'fan' && !alignRotation
                ? i * FAN_STEP_ROTATION * fan
                : 0,
            width: 180 * scale,
            height: 233 * scale,
          }
          const initial = {
            x: i * FAN_STEP_X * initialXSpread * scale,
            y: i * FAN_STEP_Y * initialSpread * scale,
            rotate: i * FAN_STEP_ROTATION * initialSpread,
            width: 180 * scale,
            height: 233 * scale,
          }
          const sheetDelay = Math.min(i * 0.02, 0.1)
          const sheetSpring = {
            type: 'spring' as const,
            stiffness: 120,
            damping: 13,
            delay: sheetDelay,
          }
          const spreadSpring = {
            type: 'spring' as const,
            stiffness: 22,
            damping: 10,
            mass: 1.4,
            delay: sheetDelay,
          }
          const bounceUpSpring = {
            type: 'spring' as const,
            stiffness: 110,
            damping: 12,
            mass: 1.1,
            delay: sheetProgress * BOUNCE_STAGGER_WINDOW,
          }
          const bounceDownSpring = {
            type: 'spring' as const,
            stiffness: 90,
            damping: 13,
            mass: 1.1,
            delay: sheetProgress * BOUNCE_STAGGER_WINDOW,
          }
          const alignSpring = {
            type: 'spring' as const,
            stiffness: 90,
            damping: 15,
            mass: 1.1,
          }
          const restackBounceSpring = {
            type: 'spring' as const,
            stiffness: 130,
            damping: 18,
            delay: sheetProgress * BOUNCE_STAGGER_WINDOW,
          }
          const transition =
            mode === 'fan' && springFan
              ? {
                  x: alignX
                    ? alignSpring
                    : gentleFan
                      ? spreadSpring
                      : sheetSpring,
                  y:
                    bouncePhase === 'up'
                      ? bounceUpSpring
                      : bouncePhase === 'down'
                        ? bounceDownSpring
                        : sheetSpring,
                  rotate: alignRotation ? alignSpring : sheetSpring,
                  width: STACK_LAYOUT_SPRING,
                  height: STACK_LAYOUT_SPRING,
                }
              : mode === 'list' && restackFromBounce
                ? {
                    x: STACK_LAYOUT_SPRING,
                    y: restackBounceSpring,
                    rotate: restackBounceSpring,
                    width: STACK_LAYOUT_SPRING,
                    height: STACK_LAYOUT_SPRING,
                  }
              : STACK_LAYOUT_SPRING

          return (
            <motion.div
              key={i}
              className="pk-page-stack__sheet"
              style={style}
              initial={initial}
              animate={target}
              transition={transition}
            >
              <motion.div
                className="pk-page-stack__sheet-skeleton"
                initial={{ scale }}
                animate={{ scale }}
                transition={STACK_LAYOUT_SPRING}
              >
                <PkPageSkeleton />
              </motion.div>
            </motion.div>
          )
        })}
    </div>
  )
}
