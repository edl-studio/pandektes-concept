import type { CSSProperties } from 'react'
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
}

export function PageStack({ pageCount, mode, scale = 1 }: PageStackProps) {
  const height = (mode === 'list' ? pageCount * 233 + (pageCount - 1) * LIST_GAP : 233) * scale

  return (
    <div className="pk-page-stack__root" style={{ height, '--_stack-scale': scale } as CSSProperties}>
      {Array.from({ length: pageCount }, (_, i) => i)
        .slice()
        .reverse()
        .map((i) => {
          const style = {
            '--_sheet-x': mode === 'fan' ? `${i * FAN_STEP_X * scale}px` : '0px',
            '--_sheet-y': mode === 'fan' ? `${i * FAN_STEP_Y * scale}px` : `${i * (233 + LIST_GAP) * scale}px`,
            '--_sheet-rotation': mode === 'fan' ? `${i * FAN_STEP_ROTATION}deg` : '0deg',
            zIndex: pageCount - i,
          } as CSSProperties

          return (
            <div key={i} className="pk-page-stack__sheet" style={style}>
              <div className="pk-page-stack__sheet-skeleton">
                <PkPageSkeleton />
              </div>
            </div>
          )
        })}
    </div>
  )
}
