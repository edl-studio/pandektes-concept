import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { BookIcon } from './BookIcon'
import { CoverLogo } from './CoverLogo'
import { PAGE_SKELETON_GROUPS } from './skeleton-layouts'
import './case-book.css'

const DEFAULT_PAGE_COUNT = 6

const PAGE_BASE_OFFSET = 0 // px, first page starts flush with the cover (--_page-x: 0px)
const PAGE_STEP_OFFSET = 2 // px, added per subsequent page (x-axis)
const PAGE_STEP_ROTATION = 0.5 // deg, added per subsequent page
const PAGE_STEP_Y_OFFSET = -1 // px, added per subsequent page (y-axis), starting at 0

export interface PkCaseBookProps extends HTMLAttributes<HTMLDivElement> {
  /** Case citation shown on the back cover, e.g. "BS-60017/2024-HJR". Omit to render no back-cover text at all. */
  caseNumber?: string
  /** Full case title shown on the back cover. Omit to render no back-cover text at all. */
  title?: string
  /** Number of pages fanned out behind the cover. Defaults to 6. */
  pageCount?: number
  /** Forces the hover-open choreography (cover tilt + page spread) on programmatically. */
  open?: boolean
  /** Opens the front cover further than hover (extract tilt) so sheets can leave. */
  extracting?: boolean
  /** Eases the front cover back to closed, overriding `open` / `extracting`. */
  coverClosing?: boolean
  /** Slides + fades the front/back covers away, leaving only the page stack visible. */
  coverExiting?: boolean
  /** Omit the page fan — used when an overlay owns the sheets. */
  hidePages?: boolean
  /** Omit the back board — used to sandwich overlay sheets between covers. */
  hideBackCover?: boolean
  /** Omit the front board. */
  hideFrontCover?: boolean
  /** Custom cover mark. Any SVG (or img). Receives the same embossed treatment as the default book icon. */
  logo?: ReactNode
  testId?: string
}

function FlipEdge() {
  return (
    <span className="pk-case-book__flip-edge">
      <span />
      <span />
    </span>
  )
}

/** Shared skeleton-bar markup for a single page's content — reused by PageStack for the detail-view sheets. */
export function PkPageSkeleton() {
  return (
    <>
      {PAGE_SKELETON_GROUPS.map((rows, groupIndex) => (
        <div className="pk-case-book__text-group" key={groupIndex}>
          {rows.map((row, rowIndex) => (
            <div className="pk-case-book__skeleton-row" key={rowIndex}>
              {row.widths.map((width, barIndex) => (
                <span className="pk-case-book__skeleton-bar" key={barIndex} style={{ width: `${width}%` }} />
              ))}
              {row.fillLast && <span className="pk-case-book__skeleton-bar pk-case-book__skeleton-bar--fill" />}
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

export const PkCaseBook = forwardRef<HTMLDivElement, PkCaseBookProps>(
  (
    {
      caseNumber,
      title,
      pageCount = DEFAULT_PAGE_COUNT,
      open,
      extracting,
      coverClosing,
      coverExiting,
      hidePages,
      hideBackCover,
      hideFrontCover,
      logo,
      className,
      testId,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          'pk-case-book__root',
          open && 'pk-case-book__root--open',
          extracting && 'pk-case-book__root--extracting',
          coverClosing && 'pk-case-book__root--cover-closing',
          coverExiting && 'pk-case-book__root--cover-exiting',
          className,
        )}
        data-testid={testId}
        {...props}
      >
        {!hideBackCover && (
          <div className="pk-case-book__cover-back">
            {caseNumber && <p className="pk-case-book__case-number">{caseNumber}</p>}
            {title && <p className="pk-case-book__case-title">{title}</p>}
            <FlipEdge />
            <span className="pk-case-book__spine" />
          </div>
        )}

        {!hidePages && (
          <div className="pk-case-book__pages">
            {/* Drawn back-to-front (highest offset first) so page 0 — the one
                closest to the cover — paints last and sits on top. */}
            {Array.from({ length: pageCount }, (_, pageIndex) => pageCount - 1 - pageIndex).map((pageIndex) => {
              const style = {
                '--_page-x': `${PAGE_BASE_OFFSET + pageIndex * PAGE_STEP_OFFSET}px`,
                '--_page-y': `${pageIndex * PAGE_STEP_Y_OFFSET}px`,
                '--_page-rotation': `${pageIndex * PAGE_STEP_ROTATION}deg`,
              } as CSSProperties

              return (
                <div key={pageIndex} className="pk-case-book__page" style={style}>
                  {pageIndex === 0 && <PkPageSkeleton />}
                </div>
              )
            })}
          </div>
        )}

        {!hideFrontCover && (
          <div className="pk-case-book__cover-front">
            <div className="pk-case-book__cover-front-edge">
              <FlipEdge />
              <span className="pk-case-book__spine" />
            </div>
            <CoverLogo>{logo ?? <BookIcon />}</CoverLogo>
          </div>
        )}
      </div>
    )
  },
)

PkCaseBook.displayName = 'PkCaseBook'
