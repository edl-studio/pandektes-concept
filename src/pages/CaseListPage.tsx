import { useState, type CSSProperties, type FC, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar04Icon,
  GoogleDocIcon,
  LegalDocument01Icon,
  TaskDone02Icon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUp02Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { CASES, type CaseSummary } from './case-data'
import { PkCaseBook } from '@/components/compounds/CaseBook'
import { PdfPageCanvas } from '@/components/compounds/PageStack'
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  InlineCitationSource,
  InlineCitationText,
} from '@/components/ai-elements/inline-citation'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { InputCopy } from '@/components/ui/input-copy'
import { PkButton } from '@/components/primitives/Button'
import './case-list-page.css'

const SOURCE_PDF_URL = CASES[0].documentUrl
const SOURCE_THUMB_WIDTH = 20
const CITATION_THUMB_WIDTH = 40

const CITATION_SOURCES = [
  {
    title: 'Domsdatabasen_13870.pdf',
    description: 'page 2 · §3',
    url: SOURCE_PDF_URL,
    pageNumber: 2,
  },
  {
    title: 'Domsdatabasen_13870.pdf',
    description: 'page 2 · §3',
    url: SOURCE_PDF_URL,
    pageNumber: 2,
  },
] as const

// ── Icon wrappers (12px, stroke 1.5px absolute) ───────────────────────

const ICON_SIZE = 12
const ICON_STROKE = 1

const ICalendar: FC = () => (
  <HugeiconsIcon icon={Calendar04Icon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const IDoc: FC = () => (
  <HugeiconsIcon icon={GoogleDocIcon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const ILegalDoc: FC = () => (
  <HugeiconsIcon icon={LegalDocument01Icon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const ITaskDone: FC = () => (
  <HugeiconsIcon icon={TaskDone02Icon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const IThumbsUp: FC = () => (
  <HugeiconsIcon icon={ThumbsUpIcon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const IThumbsDown: FC = () => (
  <HugeiconsIcon icon={ThumbsDownIcon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const IChevronUp: FC = () => (
  <HugeiconsIcon icon={ChevronUpIcon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const IChevronDown: FC = () => (
  <HugeiconsIcon icon={ChevronDownIcon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const IArrowUp: FC = () => (
  <HugeiconsIcon icon={ArrowUp02Icon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const ICheck: FC = () => (
  <HugeiconsIcon icon={Tick02Icon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const IPdf: FC = () => (
  <svg
    className="co-icon"
    width={ICON_SIZE}
    height={ICON_SIZE}
    fill="none"
    viewBox="0 0 40 40"
    aria-hidden="true"
  >
    <path fill="#D92D20" d="M4 4a4 4 0 0 1 4-4h16l12 12v24a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
    <path fill="#fff" d="m24 0 12 12h-8a4 4 0 0 1-4-4z" opacity={0.3} />
    <path
      fill="#fff"
      d="M11.75 32v-6.546h2.582q.744 0 1.268.285.524.281.8.783.277.498.277 1.15 0 .653-.28 1.151a1.94 1.94 0 0 1-.816.777q-.53.278-1.285.278H12.65v-1.11h1.423q.399 0 .658-.137a.9.9 0 0 0 .39-.386q.13-.25.13-.572 0-.326-.13-.57a.88.88 0 0 0-.39-.38q-.262-.137-.665-.137h-.933V32zm8.147 0h-2.32v-6.546h2.339q.987 0 1.7.394.712.39 1.096 1.122.387.731.387 1.75 0 1.024-.387 1.759-.384.735-1.102 1.128-.717.393-1.713.393m-.937-1.186h.879q.614 0 1.032-.217.422-.22.633-.68.214-.464.214-1.196 0-.726-.214-1.186a1.4 1.4 0 0 0-.63-.677q-.418-.218-1.032-.218h-.882zM24.124 32v-6.546h4.334v1.142h-2.95v1.56h2.662v1.14h-2.662V32z"
    />
  </svg>
)

// ── Shared atoms ──────────────────────────────────────────────────────

function Chip({
  icon,
  label,
  muted = false,
}: {
  icon?: ReactNode
  label: string
  muted?: boolean
}) {
  return (
    <span className={`co-chip${muted ? ' co-chip--muted' : ''}`}>
      {icon}
      {label}
    </span>
  )
}

function CitationCard({ label }: { label: string }) {
  return (
    <InlineCitationCard>
      <InlineCitationCardTrigger aria-label={`Citation: ${label}`}>
        <IPdf />
        {label}
      </InlineCitationCardTrigger>
      <InlineCitationCardBody>
        <InlineCitationCarousel>
          <InlineCitationCarouselHeader>
            <InlineCitationCarouselPrev />
            <InlineCitationCarouselNext />
            <InlineCitationCarouselIndex />
          </InlineCitationCarouselHeader>
          <InlineCitationCarouselContent>
            {CITATION_SOURCES.map((source, index) => (
              <InlineCitationCarouselItem key={`${source.title}-${index}`}>
                <InlineCitationSource
                  title={source.title}
                  description={source.description}
                  thumbnail={
                    source.url ? (
                      <PdfPageCanvas
                        url={source.url}
                        pageNumber={source.pageNumber}
                        targetWidth={CITATION_THUMB_WIDTH}
                      />
                    ) : null
                  }
                />
              </InlineCitationCarouselItem>
            ))}
          </InlineCitationCarouselContent>
        </InlineCitationCarousel>
      </InlineCitationCardBody>
    </InlineCitationCard>
  )
}

/** Inline citation — optional cited text highlights when the badge is hovered */
function CitationBadge({ children, text }: { children: string; text?: ReactNode }) {
  return (
    <InlineCitation>
      {text != null && (
        <>
          <InlineCitationText>{text}</InlineCitationText>{' '}
        </>
      )}
      <CitationCard label={children} />
    </InlineCitation>
  )
}

function Divider() {
  return <hr className="co-divider" />
}

// ── Sources (expandable) ──────────────────────────────────────────────

function SourceRow({
  label,
  url,
  pageNumber,
}: {
  label: string
  url?: string
  pageNumber?: number
}) {
  return (
    <div className="co-source-row">
      <div className="co-source-thumb" aria-hidden="true">
        {url && (
          <PdfPageCanvas url={url} pageNumber={pageNumber} targetWidth={SOURCE_THUMB_WIDTH} />
        )}
      </div>
      <div className="co-source-text">
        <span>{label}</span>
        <span className="co-source-rule" aria-hidden="true" />
      </div>
    </div>
  )
}

function Sources() {
  return (
    <Collapsible defaultOpen className="co-sources">
      <CollapsibleTrigger className="co-sources-toggle">
        <IDoc />
        <span>2 sources</span>
        <span className="co-sources-chevron co-sources-chevron--up">
          <IChevronUp />
        </span>
        <span className="co-sources-chevron co-sources-chevron--down">
          <IChevronDown />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="co-sources-panel">
          {CITATION_SOURCES.map((source, index) => (
            <SourceRow
              key={`${source.title}-${index}`}
              label={`${source.title} · ${source.description}`}
              url={source.url}
              pageNumber={source.pageNumber}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ── HoldingCard ───────────────────────────────────────────────────────

function HoldingCard({
  icon,
  verdict,
  detail,
  citation,
  variant,
}: {
  icon: ReactNode
  /** First line — shown in accent colour */
  verdict: string
  /** Second line — subtitle in content-secondary */
  detail: string
  citation: string
  variant: 'win' | 'lose'
}) {
  return (
    <div className="co-holding-card">
      <div className={`co-holding-avatar co-holding-avatar--${variant}`}>{icon}</div>
      <InlineCitation className="co-holding-citation">
        <div className="co-holding-body">
          <p className="co-holding-verdict">
            <InlineCitationText>{verdict}</InlineCitationText>
          </p>
          <p className="co-holding-detail">{detail}</p>
        </div>
        <CitationCard label={citation} />
      </InlineCitation>
    </div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────

const PLACEHOLDER =
  'Short summary below the title so the title above could be shorter. Think of it as a full official title of this entity. While the title above is short, quick entity identifier.'

function SectionHeader({ title, citation }: { title: string; citation?: string }) {
  return (
    <div className="co-section-header">
      <h2 className="co-section-title">{title}</h2>
      {/* Citation badge is an inline span inside the <p> — "as a span" */}
      <p className="co-section-desc">
        {citation ? <CitationBadge text={PLACEHOLDER}>{citation}</CitationBadge> : PLACEHOLDER}
      </p>
    </div>
  )
}

// ── TimelineItem ──────────────────────────────────────────────────────

function docFilename(cs: CaseSummary): string {
  if (cs.documentUrl) {
    const name = cs.documentUrl.split('/').pop()
    if (name) return name
  }
  return `Domsdatabasen_${cs.caseNumber.replace(/[^A-Za-z0-9]/g, '_')}.pdf`
}

function randomBookTilt(): number {
  const deg = 2 + Math.random() * 2
  return Math.random() < 0.5 ? -deg : deg
}

function TimelineItem({
  instanceLabel,
  date,
  caseSummary,
  isFirst,
  isLast,
  bookTilt,
}: {
  instanceLabel: string
  date: string
  caseSummary: CaseSummary
  isFirst: boolean
  isLast: boolean
  bookTilt: number
}) {
  const [bookOpen, setBookOpen] = useState(false)
  const Logo = caseSummary.Logo
  const filename = docFilename(caseSummary)
  const caseNumberDisplay = caseSummary.caseNumber.replace('/', ' · ')

  return (
    <div className="co-timeline-item">
      {/* Left rail: dot + connector */}
      <div className="co-timeline-rail" aria-hidden="true">
        <div className={`co-timeline-dot${isFirst ? ' co-timeline-dot--accent' : ''}`}>
          {isFirst ? <ICheck /> : <IArrowUp />}
        </div>
        {!isLast && <div className="co-timeline-connector" />}
      </div>

      {/* Content */}
      <div className="co-timeline-body">
        <div className="co-timeline-header">
          <p className="co-timeline-label">{instanceLabel}</p>
          <div className="co-meta-row">
            <Chip icon={<ICalendar />} label={date} muted />
            <Chip icon={<ILegalDoc />} label={caseNumberDisplay} muted />
            <Chip icon={<ITaskDone />} label="Final" muted />
          </div>
        </div>

        {/* Document card */}
        <div
          className="co-doc-card"
          style={{ '--co-book-tilt': `${bookTilt}deg` } as CSSProperties}
          onMouseEnter={() => setBookOpen(true)}
          onMouseLeave={() => setBookOpen(false)}
        >
          <div className="co-doc-thumb" aria-hidden="true">
            <PkCaseBook
              caseNumber={caseSummary.caseNumber}
              title={caseSummary.title}
              pageCount={caseSummary.pageCount}
              logo={Logo ? <Logo /> : undefined}
              open={bookOpen}
              className="co-doc-thumb-book"
            />
          </div>
          <div className="co-doc-info">
            <div className="co-doc-copy">
              <p className="co-doc-name">{filename}</p>
              <div className="co-meta-row">
                <Chip label={`PDF · ${caseSummary.pageCount} pages`} muted />
              </div>
            </div>
            <PkButton variant="outline" size="sm" asChild>
              <Link to={`/case/${caseSummary.id}`}>Open</Link>
            </PkButton>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CaseListPage ──────────────────────────────────────────────────────

const CASE_NUMBER_DISPLAY = CASES[0].caseNumber.replace('/', ' · ')

// CASES[0] = HJR (Supreme Court) → Instance 3 (most recent / highest)
// CASES[1] = OLR (Appellate)     → Instance 2
// CASES[2] = SHR (First instance)→ Instance 1
const TIMELINE_ENTRIES = CASES.map((cs, i) => ({
  caseSummary: cs,
  instanceLabel: `Instance ${CASES.length - i} · Final`,
  date: '18 Jun 2026',
  bookTilt: randomBookTilt(),
}))

export function CaseListPage() {
  return (
    <div className="co-page">
      <main className="co-content">
        {/* ── Case header ───────────────────────────────── */}
        <header className="co-case-header">
          <div className="co-meta-row">
            <InputCopy value={CASE_NUMBER_DISPLAY} />
            <Chip icon={<ITaskDone />} label="Final" />
          </div>
          <div className="co-case-titles">
            <h1 className="co-case-title">Flair Group v. HK Danmark</h1>
            <p className="co-case-desc">{PLACEHOLDER}</p>
          </div>
        </header>

        <Divider />

        {/* ── Case holding ──────────────────────────────── */}
        <section className="co-section" aria-label="Case holding">
          <SectionHeader title="Case holding" citation="Page 2 · §3" />
          <Sources />
          <div className="co-holding-grid">
            <HoldingCard
              icon={<IThumbsUp />}
              verdict="Appellant 3 won."
              detail="282,338.09 dkk under funktionærloven."
              citation="Page 2 · §3"
              variant="win"
            />
            <HoldingCard
              icon={<IThumbsDown />}
              verdict="Appellant 1 and 2 lost."
              detail="Vikarloven compensation claim dismissed."
              citation="Page 2 · §3"
              variant="lose"
            />
          </div>
        </section>

        <Divider />

        {/* ── Procedural history ────────────────────────── */}
        <section className="co-section" aria-label="Procedural history">
          <SectionHeader title="Procedural history" citation="Page 2 · §3" />
          <div className="co-timeline" role="list">
            {TIMELINE_ENTRIES.map(({ caseSummary, instanceLabel, date, bookTilt }, i) => (
              <TimelineItem
                key={caseSummary.id}
                instanceLabel={instanceLabel}
                date={date}
                caseSummary={caseSummary}
                bookTilt={bookTilt}
                isFirst={i === 0}
                isLast={i === TIMELINE_ENTRIES.length - 1}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
