/**
 * Shared geometry between BookOpenTransition (the overlay) and
 * CaseDetailPage (the real resting layout) — kept in one place so the
 * overlay's final frame and the real page's initial render land on the
 * exact same pixel position with nothing left to eyeball.
 */
export const PAGE_WIDTH = 180 // matches PkCaseBook's --_cover-front-width / PageStack's sheet width
export const PAGE_HEIGHT = 233
export const FULL_WIDTH = 600 // reading width once scaled up
export const SCALE = FULL_WIDTH / PAGE_WIDTH

export const BOOK_WIDTH = 188
export const BOOK_HEIGHT = 233

// CaseDetailPage's structure is: p-12 padding, then a fixed-height header
// block (the "Back to cases" link) — deliberately a fixed height rather
// than text-flow-derived margin, so this constant stays exactly correct.
export const DETAIL_PAGE_PADDING = 48 // p-12
export const DETAIL_PAGE_HEADER_HEIGHT = 44
export const DETAIL_TOP = DETAIL_PAGE_PADDING + DETAIL_PAGE_HEADER_HEIGHT
