import {
  ArrowUpRight,
  BookOpen,
  BookmarkPlus,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  type ReactNode,
  useId,
} from 'react'
import { Link } from 'react-router-dom'
import { PdfPageCanvas } from '@/components/compounds/PageStack'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/motion/popover'
import { SharedLayoutBg } from '@/components/motion/shared-layout-bg'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import './citations.css'

const ICON_SIZE = 12
const ICON_STROKE = 1
const THUMB_WIDTH = 20

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const SPRING_LAYOUT = { type: 'spring' as const, stiffness: 400, damping: 30 }

export interface CitationItem {
  id: string
  /** Per-passage label shown in the sub-row (grouped mode) or the row title (flat mode). */
  title: ReactNode
  /** Document-level label shown as the group header. Falls back to `title` when absent. */
  sourceTitle?: ReactNode
  domain?: ReactNode
  url?: string
  pageNumber?: number
  quote?: ReactNode
  /** Case ID for generating "Open in document" deep-links. */
  caseId?: string
  /** Plain-text version of quote for PDF text matching. */
  quoteText?: string
}

export interface CitationsProps {
  citations: CitationItem[]
  title?: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  idPrefix?: string
  /** When true, citations are grouped by source document. */
  grouped?: boolean
  className?: string
}

export interface CitationProps {
  citationId: string
  index: number
  /** Must match the related Citations idPrefix. */
  idPrefix: string
  /** Source shown in the hover card. */
  source?: CitationItem
  /** Cited text highlighted when the badge is hovered. */
  text?: ReactNode
  className?: string
}

export interface CitationListProps {
  citations: CitationItem[]
  idPrefix?: string
  className?: string
}

export interface CitationStackProps {
  citations: CitationItem[]
  limit?: number
  className?: string
}

function citationTargetId(prefix: string, citationId: string) {
  return `${prefix}-${citationId.replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

const CARD_THUMB_WIDTH = 40

function CitationCardBody({ source }: { source: CitationItem }) {
  return (
    <div className="pk-citation-card-body">
      <div className="pk-citation-card-source">
        <span className="pk-citation-card-thumb" aria-hidden="true">
          {source.url ? (
            <PdfPageCanvas
              url={source.url}
              pageNumber={source.pageNumber}
              targetWidth={CARD_THUMB_WIDTH}
            />
          ) : null}
        </span>
        <span className="pk-citation-card-copy">
          <span className="pk-citation-card-title">{source.title}</span>
          {source.domain ? (
            <span className="pk-citation-card-domain">{source.domain}</span>
          ) : null}
        </span>
      </div>
      {source.quote ? (
        <blockquote className="pk-citation-card-quote">{source.quote}</blockquote>
      ) : null}
      {source.caseId ? (
        <Link
          to={`/case/${source.caseId}?citation=${source.id}`}
          className="pk-citation-card-open"
        >
          <BookmarkPlus
            size={ICON_SIZE}
            strokeWidth={ICON_STROKE}
            absoluteStrokeWidth
          />
          Open in document
        </Link>
      ) : null}
    </div>
  )
}

export function Citation({
  citationId,
  index,
  idPrefix,
  source,
  text,
  className,
}: CitationProps) {
  const docHref = source?.caseId
    ? `/case/${source.caseId}?citation=${citationId}`
    : `#${citationTargetId(idPrefix, citationId)}`

  const marker = source?.caseId ? (
    <Link to={docHref} aria-label={`View citation ${index}`} className={cn('pk-citation', className)}>
      {index}
    </Link>
  ) : (
    <a href={docHref} aria-label={`View citation ${index}`} className={cn('pk-citation', className)}>
      {index}
    </a>
  )

  const badge = source ? (
    <Popover trigger="hover" side="bottom" align="start" sideOffset={14} panelRadius={12}>
      <PopoverTrigger>{marker}</PopoverTrigger>
      <PopoverContent className="pk-citation-card">
        <CitationCardBody source={source} />
      </PopoverContent>
    </Popover>
  ) : (
    marker
  )

  if (text == null) return badge

  return (
    <span className="pk-citation-wrap">
      <span className="pk-citation-text">{text}</span>{' '}
      {badge}
    </span>
  )
}

export function CitationFavicon({
  url,
  pageNumber,
  className,
}: {
  url?: string
  pageNumber?: number
  className?: string
}) {
  return (
    <span aria-hidden="true" className={cn('pk-citation-thumb', className)}>
      {url ? <PdfPageCanvas url={url} pageNumber={pageNumber} targetWidth={THUMB_WIDTH} /> : null}
    </span>
  )
}

export function CitationStack({
  citations,
  limit = 3,
  className,
}: CitationStackProps) {
  return (
    <span aria-hidden="true" className={cn('pk-citation-stack', className)}>
      {citations.slice(0, limit).map((citation) => (
        <CitationFavicon
          key={citation.id}
          url={citation.url}
          pageNumber={citation.pageNumber}
          className="pk-citation-stack-item"
        />
      ))}
    </span>
  )
}

function CitationRow({
  citation,
  idPrefix,
}: {
  citation: CitationItem
  idPrefix: string
}) {
  const content = (
    <>
      <CitationFavicon url={citation.url} pageNumber={citation.pageNumber} />
      <span className="pk-citation-row-copy">
        <span className="pk-citation-row-title">{citation.title}</span>
      </span>
      <span className="pk-citation-row-meta">
        {citation.url ? (
          <ExternalLink
            size={ICON_SIZE}
            strokeWidth={ICON_STROKE}
            absoluteStrokeWidth
          />
        ) : null}
      </span>
    </>
  )
  const id = citationTargetId(idPrefix, citation.id)

  return citation.url ? (
    <a
      id={id}
      href={citation.url}
      target="_blank"
      rel="noreferrer noopener"
      className="pk-citation-row"
    >
      {content}
    </a>
  ) : (
    <div id={id} className="pk-citation-row">
      {content}
    </div>
  )
}

// ── Grouped rendering ────────────────────────────────────────────────────────

interface CitationGroup {
  key: string
  url: string | undefined
  sourceTitle: ReactNode
  caseId: string | undefined
  items: CitationItem[]
}

function groupCitations(citations: CitationItem[]): CitationGroup[] {
  const groups = new Map<string, CitationGroup>()
  for (const citation of citations) {
    const key = citation.url ?? `__ungrouped__${citation.id}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        url: citation.url,
        sourceTitle: citation.sourceTitle ?? citation.title,
        caseId: citation.caseId,
        items: [],
      })
    }
    groups.get(key)!.items.push(citation)
  }
  return Array.from(groups.values())
}

function CitationSubRow({
  citation,
  idPrefix,
}: {
  citation: CitationItem
  idPrefix: string
}) {
  const id = citationTargetId(idPrefix, citation.id)
  const pageLabel = citation.pageNumber != null ? `p${citation.pageNumber}` : null
  const href = citation.caseId
    ? `/case/${citation.caseId}?citation=${citation.id}`
    : undefined

  const content = (
    <>
      <span className="pk-citation-subrow-title">{citation.title}</span>
      {pageLabel && <span className="pk-citation-subrow-page">{pageLabel}</span>}
      <span className="pk-citation-subrow-icon" aria-hidden="true">
        <ArrowUpRight size={ICON_SIZE} strokeWidth={ICON_STROKE} absoluteStrokeWidth />
      </span>
    </>
  )

  return href ? (
    <Link id={id} to={href} className="pk-citation-subrow">
      {content}
    </Link>
  ) : (
    <div id={id} className="pk-citation-subrow">
      {content}
    </div>
  )
}

function CitationGroupedList({
  citations,
  idPrefix,
  className,
}: CitationListProps) {
  const baseId = useId()
  const resolvedPrefix = idPrefix ?? `citation-group-${baseId.replace(/:/g, '')}`
  const groups = groupCitations(citations)

  return (
    <div className={cn('pk-citation-grouped-list', className)}>
      {groups.map((group) => {
        const headerHref = group.caseId ? `/case/${group.caseId}` : undefined
        const headerInner = (
          <>
            <CitationFavicon url={group.url} pageNumber={group.items[0]?.pageNumber} />
            <span className="pk-citation-group-title">{group.sourceTitle}</span>
          </>
        )
        return (
          <div key={group.key} className="pk-citation-group">
            {headerHref ? (
              <Link to={headerHref} className="pk-citation-group-header">
                {headerInner}
              </Link>
            ) : (
              <div className="pk-citation-group-header">{headerInner}</div>
            )}
            <div className="pk-citation-subitems">
              {group.items.map((citation) => (
                <CitationSubRow key={citation.id} citation={citation} idPrefix={resolvedPrefix} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CitationList({
  citations,
  idPrefix,
  className,
}: CitationListProps) {
  const reduce = useReducedMotion() ?? false
  const baseId = useId()
  const resolvedPrefix = idPrefix ?? `citation-list-${baseId.replace(/:/g, '')}`

  return (
    <SharedLayoutBg className={cn('pk-citation-list', className)} inset={4}>
      {citations.map((citation) => (
        <motion.div
          layout="position"
          key={citation.id}
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.18, ease: EASE_OUT },
                  y: SPRING_LAYOUT,
                  layout: SPRING_LAYOUT,
                }
          }
        >
          <CitationRow
            citation={citation}
            idPrefix={resolvedPrefix}
          />
        </motion.div>
      ))}
    </SharedLayoutBg>
  )
}

export function Citations({
  citations,
  title = 'Sources',
  open,
  defaultOpen = false,
  onOpenChange,
  idPrefix,
  grouped = false,
  className,
}: CitationsProps) {
  const baseId = useId()
  const contentId = `${baseId}-content`
  const resolvedPrefix = idPrefix ?? `citation-${baseId.replace(/:/g, '')}`

  const count = grouped
    ? new Set(citations.map((c) => c.url ?? c.id)).size
    : citations.length

  return (
    <Collapsible
      className={cn('pk-citations', className)}
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={(next) => onOpenChange?.(next)}
    >
      <CollapsibleTrigger className="pk-citations-toggle" aria-controls={contentId}>
        <BookOpen
          size={ICON_SIZE}
          strokeWidth={ICON_STROKE}
          absoluteStrokeWidth
        />
        <span>{title}</span>
        <span className="pk-citations-count">{count}</span>
        <span className="pk-citations-chevron" aria-hidden="true">
          <ChevronDown
            size={ICON_SIZE}
            strokeWidth={ICON_STROKE}
            absoluteStrokeWidth
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent id={contentId} className="pk-citations-panel-wrap">
        {grouped ? (
          <CitationGroupedList
            citations={citations}
            idPrefix={resolvedPrefix}
            className="pk-citations-panel"
          />
        ) : (
          <CitationList
            citations={citations}
            idPrefix={resolvedPrefix}
            className="pk-citations-panel"
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
