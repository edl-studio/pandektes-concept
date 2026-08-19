/**
 * Shared geometry between BookOpenTransition (the overlay) and
 * CaseDetailPage (the real resting layout) — kept in one place so the
 * overlay's final frame and the real page's initial render land on the
 * exact same pixel position with nothing left to eyeball.
 */
export const PAGE_WIDTH = 180 // matches PkCaseBook's --_cover-front-width / PageStack's sheet width
export const PAGE_HEIGHT = 233
export const FULL_WIDTH = 544 // document column width in the detail workspace
export const SCALE = FULL_WIDTH / PAGE_WIDTH

export const BOOK_WIDTH = 188
export const BOOK_HEIGHT = 233

/** PkCaseBook's open-state `.pk-case-book__pages { translateX }` , in unscaled book pixels. */
export const OPEN_PAGE_NUDGE = 4
/** Matches `.pk-case-book__root--open` `--_spread`. */
export const OPEN_PAGE_SPREAD = 2

export const DETAIL_MAIN_PADDING = 24
export const DETAIL_PAGE_HEADER_HEIGHT = 32
export const DETAIL_PAGE_HEADER_GAP = 24
export const DETAIL_SIDEBAR_WIDTH = 360
export const DETAIL_WORKSPACE_WIDTH = 768
export const DETAIL_NAV_COLUMN_WIDTH = 200
export const DETAIL_COLUMN_GAP = 24
export const DETAIL_TOP =
  DETAIL_MAIN_PADDING + DETAIL_PAGE_HEADER_HEIGHT + DETAIL_PAGE_HEADER_GAP

/** Horizontal handoff position before the summary sidebar expands. */
export function getDetailDocumentLeft(viewportWidth: number): number {
  return (viewportWidth - FULL_WIDTH) / 2
}
