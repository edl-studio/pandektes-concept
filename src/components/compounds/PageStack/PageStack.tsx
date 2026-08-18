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
  /** Fan spread used for the overlay's first frame, before it springs outward. */
  initialSpread?: number
  /** Use the folder-like spring while the sheets are still a fan. */
  springFan?: boolean
}

export function PageStack({
  pageCount,
  mode,
  scale = 1,
  spread = 1,
  initialSpread = spread,
  springFan = false,
}: PageStackProps) {
  const height = (mode === 'list' ? pageCount * 233 + (pageCount - 1) * LIST_GAP : 233) * scale
  const fan = mode === 'fan' ? spread : 1

  return (
    <div className="pk-page-stack__root" style={{ height, '--_stack-scale': scale } as CSSProperties}>
      {Array.from({ length: pageCount }, (_, i) => i)
        .slice()
        .reverse()
        .map((i) => {
          const style = {
            zIndex: pageCount - i,
          } as CSSProperties
          const target = {
            x: mode === 'fan' ? i * FAN_STEP_X * fan * scale : 0,
            y: mode === 'fan' ? i * FAN_STEP_Y * fan * scale : i * (233 + LIST_GAP) * scale,
            rotate: mode === 'fan' ? i * FAN_STEP_ROTATION * fan : 0,
          }
          const initial = {
            x: i * FAN_STEP_X * initialSpread * scale,
            y: i * FAN_STEP_Y * initialSpread * scale,
            rotate: i * FAN_STEP_ROTATION * initialSpread,
          }

          return (
            <motion.div
              key={i}
              className="pk-page-stack__sheet"
              style={style}
              initial={initial}
              animate={target}
              transition={
                mode === 'fan' && springFan
                  ? {
                      type: 'spring',
                      stiffness: 120,
                      damping: 13,
                      delay: Math.min(i * 0.02, 0.1),
                    }
                  : { duration: 0.5, ease: 'easeInOut' }
              }
            >
              <div className="pk-page-stack__sheet-skeleton">
                <PkPageSkeleton />
              </div>
            </motion.div>
          )
        })}
    </div>
  )
}
