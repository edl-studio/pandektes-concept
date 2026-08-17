import { useState, type CSSProperties, type FC, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar04Icon,
  TaskDone02Icon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  ArrowUp02Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { CASES, type CaseSummary } from './case-data'
import { PkCaseBook } from '@/components/compounds/CaseBook'
import {
  Citation,
  Citations,
  type CitationItem,
} from '@/components/ai-elements/citations'
import { InputCopy } from '@/components/ui/input-copy'
import { PkButton } from '@/components/primitives/Button'
import './case-list-page.css'

const SOURCE_PDF_URL = CASES[0].documentUrl
const CITATION_PREFIX = 'case-sources'

const CITATION_ITEMS: CitationItem[] = [
  {
    id: 'holding-win',
    title: 'Domsdatabasen_13870.pdf',
    domain: 'page 2 · §3',
    url: SOURCE_PDF_URL,
    pageNumber: 2,
    quote:
      'Appellant 3 is entitled to compensation of DKK 282,338.09 under funktionærloven.',
  },
  {
    id: 'holding-lose',
    title: 'Domsdatabasen_13870.pdf',
    domain: 'page 2 · §3',
    url: SOURCE_PDF_URL,
    pageNumber: 2,
    quote: 'The claims of appellants 1 and 2 under vikarloven are dismissed.',
  },
]

function citationMarker(id: string, index: number, text?: ReactNode) {
  const source = CITATION_ITEMS.find((item) => item.id === id)
  return (
    <Citation
      citationId={id}
      index={index}
      idPrefix={CITATION_PREFIX}
      source={source}
      text={text}
    />
  )
}

// ── Icon wrappers (12px, stroke 1.5px absolute) ───────────────────────

const ICON_SIZE = 12
const ICON_STROKE = 1

const ICalendar: FC = () => (
  <HugeiconsIcon icon={Calendar04Icon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
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

const IArrowUp: FC = () => (
  <HugeiconsIcon icon={ArrowUp02Icon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const ICheck: FC = () => (
  <HugeiconsIcon icon={Tick02Icon} size={ICON_SIZE} color="currentColor" strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
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

function Divider() {
  return <hr className="co-divider" />
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
  citation?: ReactNode
  variant: 'win' | 'lose'
}) {
  return (
    <div className="co-holding-card">
      <div className={`co-holding-avatar co-holding-avatar--${variant}`}>{icon}</div>
      <div className="co-holding-body">
        <p className="co-holding-verdict">{verdict}</p>
        <p className="co-holding-detail">{citation ?? detail}</p>
      </div>
    </div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────

const PLACEHOLDER =
  'Short summary below the title so the title above could be shorter. Think of it as a full official title of this entity. While the title above is short, quick entity identifier.'

const HOLDING_WIN =
  'A long-term posting to Boeing brought the worker within funktionærloven. The court awarded DKK 282,338.09 in salary and holiday pay, treating the assignment as ordinary salaried employment rather than a temporary agency placement.'

const HOLDING_LOSE =
  'The joined vikarloven claims were dismissed. The court found no basis for agency-work compensation once the relationship was classified as salaried employment, and the remaining appellants were left without a separate remedy.'

function SectionHeader({ title, citation }: { title: string; citation?: ReactNode }) {
  return (
    <div className="co-section-header">
      <h2 className="co-section-title">{title}</h2>
      <p className="co-section-desc">{citation ?? PLACEHOLDER}</p>
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
            <InputCopy value={caseNumberDisplay} />
            <Chip icon={<ICalendar />} label={date} muted />
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
          <SectionHeader
            title="Case holding"
            citation={citationMarker('holding-win', 1, PLACEHOLDER)}
          />
          <Citations
            citations={CITATION_ITEMS}
            idPrefix={CITATION_PREFIX}
            defaultOpen
          />
          <div className="co-holding-grid">
            <HoldingCard
              icon={<IThumbsUp />}
              verdict="Appellant 3 won."
              detail={HOLDING_WIN}
              citation={citationMarker('holding-win', 1, HOLDING_WIN)}
              variant="win"
            />
            <HoldingCard
              icon={<IThumbsDown />}
              verdict="Appellant 1 and 2 lost."
              detail={HOLDING_LOSE}
              citation={citationMarker('holding-lose', 2, HOLDING_LOSE)}
              variant="lose"
            />
          </div>
        </section>

        <Divider />

        {/* ── Procedural history ────────────────────────── */}
        <section className="co-section" aria-label="Procedural history">
          <SectionHeader
            title="Procedural history"
            citation={citationMarker('holding-win', 1, PLACEHOLDER)}
          />
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
