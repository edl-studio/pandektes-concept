import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUpRight01Icon,
  BookOpen02Icon,
  ChevronDownIcon,
} from '@hugeicons/core-free-icons'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  type ReactNode,
  useId,
} from 'react'
import { PdfPageCanvas } from '@/components/compounds/PageStack'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/motion/popover'
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
  title: ReactNode
  domain?: ReactNode
  url?: string
  pageNumber?: number
  quote?: ReactNode
}

export interface CitationsProps {
  citations: CitationItem[]
  title?: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  idPrefix?: string
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
  const href = `#${citationTargetId(idPrefix, citationId)}`
  const marker = (
    <a href={href} aria-label={`View citation ${index}`} className={cn('pk-citation', className)}>
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
  index,
  idPrefix,
}: {
  citation: CitationItem
  index: number
  idPrefix: string
}) {
  const content = (
    <>
      <CitationFavicon url={citation.url} pageNumber={citation.pageNumber} />
      <span className="pk-citation-row-copy">
        <span className="pk-citation-row-title">{citation.title}</span>
        {citation.domain ? (
          <span className="pk-citation-row-domain">{citation.domain}</span>
        ) : null}
      </span>
      <span className="pk-citation-row-meta">
        <span className="pk-citation pk-citation--static">{index}</span>
        {citation.url ? (
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            size={ICON_SIZE}
            color="currentColor"
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

export function CitationList({
  citations,
  idPrefix,
  className,
}: CitationListProps) {
  const reduce = useReducedMotion() ?? false
  const baseId = useId()
  const resolvedPrefix = idPrefix ?? `citation-list-${baseId.replace(/:/g, '')}`

  return (
    <div className={cn('pk-citation-list', className)}>
      <AnimatePresence mode="popLayout">
        {citations.map((citation, index) => (
          <motion.div
            layout="position"
            key={citation.id}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -3 }}
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
              index={index + 1}
              idPrefix={resolvedPrefix}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function Citations({
  citations,
  title = 'Sources',
  open,
  defaultOpen = false,
  onOpenChange,
  idPrefix,
  className,
}: CitationsProps) {
  const baseId = useId()
  const contentId = `${baseId}-content`
  const resolvedPrefix = idPrefix ?? `citation-${baseId.replace(/:/g, '')}`

  return (
    <Collapsible
      className={cn('pk-citations', className)}
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={(next) => onOpenChange?.(next)}
    >
      <CollapsibleTrigger className="pk-citations-toggle" aria-controls={contentId}>
        <HugeiconsIcon
          icon={BookOpen02Icon}
          size={ICON_SIZE}
          color="currentColor"
          strokeWidth={ICON_STROKE}
          absoluteStrokeWidth
        />
        <span>{title}</span>
        <span className="pk-citations-count">{citations.length}</span>
        <span className="pk-citations-chevron" aria-hidden="true">
          <HugeiconsIcon
            icon={ChevronDownIcon}
            size={ICON_SIZE}
            color="currentColor"
            strokeWidth={ICON_STROKE}
            absoluteStrokeWidth
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent id={contentId}>
        <CitationList
          citations={citations}
          idPrefix={resolvedPrefix}
          className="pk-citations-panel"
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
