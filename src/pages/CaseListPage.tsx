import { useEffect, useRef, useState, type CSSProperties, type FC, type PointerEvent, type ReactNode } from 'react'
import { animate } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowUp,
  BadgeCheck,
  Calendar,
  Check,
  FileText,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { CASES, type CaseSummary } from './case-data'
import { PkCaseBook } from '@/components/compounds/CaseBook'
import {
  Citation,
  Citations,
} from '@/components/ai-elements/citations'
import { CITATION_ITEMS, CITATION_PREFIX } from './citation-data'
import { InputCopy } from '@/components/ui/input-copy'
import { PkButton } from '@/components/primitives/Button'
import { BookOpenTransition, type OriginRect } from './transition/BookOpenTransition'
import { BOOK_HEIGHT, BOOK_WIDTH } from './transition/layout'
import './case-list-page.css'

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
  <Calendar size={ICON_SIZE} strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const ITaskDone: FC = () => (
  <BadgeCheck size={ICON_SIZE} strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const IThumbsUp: FC = () => (
  <ThumbsUp size={ICON_SIZE} strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const IThumbsDown: FC = () => (
  <ThumbsDown size={ICON_SIZE} strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const IArrowUp: FC = () => (
  <ArrowUp size={ICON_SIZE} strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const ICheck: FC = () => (
  <Check size={ICON_SIZE} strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

const IFile: FC = () => (
  <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE} absoluteStrokeWidth className="co-icon" />
)

function PkMark() {
  return (
    <svg width={16} height={20} viewBox="0 0 16 20" fill="currentColor" aria-hidden>
      <path d="M 10.813 10 C 12.184 9.964 13.487 9.435 14.453 8.522 C 15.418 7.609 15.972 6.383 15.998 5.098 C 16.055 2.295 13.552 0.001 10.562 0.001 L 0.149 0.001 C 0.109 0.001 0.072 0.016 0.044 0.042 C 0.016 0.068 0 0.103 0 0.14 L 0 1.529 C 0 1.565 0.016 1.601 0.044 1.627 C 0.072 1.653 0.109 1.667 0.149 1.667 C 1.065 1.703 1.932 2.07 2.567 2.691 C 3.202 3.313 3.556 4.14 3.555 5 L 3.555 14.582 C 3.555 15.282 3.852 15.953 4.38 16.448 C 4.907 16.943 5.623 17.221 6.37 17.221 C 6.409 17.221 6.447 17.206 6.474 17.18 C 6.502 17.154 6.518 17.119 6.518 17.082 L 6.518 6.413 C 6.515 6.271 6.568 6.134 6.667 6.027 C 6.765 5.92 6.903 5.851 7.053 5.834 C 7.135 5.826 7.218 5.835 7.297 5.859 C 7.376 5.884 7.448 5.923 7.509 5.976 C 7.571 6.028 7.62 6.092 7.653 6.163 C 7.686 6.234 7.703 6.311 7.703 6.389 L 7.703 17.36 C 7.703 18.06 7.999 18.731 8.527 19.225 C 9.055 19.72 9.771 19.998 10.517 19.998 C 10.556 19.998 10.594 19.984 10.622 19.957 C 10.65 19.931 10.665 19.896 10.665 19.859 L 10.665 10.139 C 10.665 10.102 10.681 10.066 10.709 10.04 C 10.736 10.014 10.774 10 10.813 10 Z" />
    </svg>
  )
}

const NAV_SKELETON_WIDTHS = [48, 72, 56] as const

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

const MATTER_DESCRIPTION =
  `A quality controller recruited by Boeing and placed via Adecco A/S (now Flair Group A/S) worked without interruption at Boeing's Kastrup facility for 3\u00bd years under four successive fixed-term contracts. The central question across all three instances was whether that posting was "temporary" under the Temporary Agency Work Act (vikarloven) \u2014 and whether the worker was therefore entitled to salaried-employee protections under funktionærloven.`

const HOLDING_WIN =
  `The four successive extensions lacked any objective explanation, taking the posting outside vikarloven. The worker was a salaried employee (funktionær) entitled to sick pay and a four-month notice period. DKK 282,338.09 awarded in full.`

const HOLDING_LOSE =
  `Adecco was acquitted 2\u20131. The collective agreement (Funktionæroverenskomsten) displaced the successive-extension prohibition in vikarloven \u00a7\u00a03, stk.\u00a04. One judge dissented, finding the posting objectively non-temporary.`

function SectionHeader({
  title,
  citation,
  description = true,
}: {
  title: string
  citation?: ReactNode
  description?: boolean
}) {
  return (
    <div className="co-section-header">
      <h2 className="co-section-title">{title}</h2>
      {description && <p className="co-section-desc">{citation ?? MATTER_DESCRIPTION}</p>}
    </div>
  )
}

// ── TimelineItem ──────────────────────────────────────────────────────

function randomBookTilt(): number {
  const deg = 2 + Math.random() * 2
  return Math.random() < 0.5 ? -deg : deg
}

function useBookThumb({
  caseSummary,
  bookTilt,
  sinking,
  onOpen,
}: {
  caseSummary: CaseSummary
  bookTilt: number
  sinking: boolean
  onOpen: (caseSummary: CaseSummary, originRect: OriginRect) => void
}) {
  const [bookOpen, setBookOpen] = useState(false)
  const [holding, setHolding] = useState(false)
  const bookRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sinking) {
      bookRef.current?.style.setProperty('--co-sink', '0px')
      return
    }
    const sink = animate(0, 160, {
      type: 'spring',
      stiffness: 65,
      damping: 17,
      mass: 1.2,
      onUpdate: (value) => {
        bookRef.current?.style.setProperty('--co-sink', `${value}px`)
      },
    })
    return () => sink.stop()
  }, [sinking])

  const press = useRef({
    down: false,
    value: 1,
    shouldOpen: false,
    playback: null as { stop: () => void } | null,
  })

  function setPress(value: number) {
    press.current.value = value
    bookRef.current?.style.setProperty('--co-press', String(value))
  }

  function stopPress() {
    press.current.playback?.stop()
    press.current.playback = null
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    press.current.down = true
    press.current.shouldOpen = false
    setHolding(true)
    stopPress()
    press.current.playback = animate(press.current.value, 0.91, {
      duration: 0.35,
      ease: 'easeOut',
      onUpdate: setPress,
    })
  }

  function handlePointerUp() {
    if (!press.current.down) return
    press.current.down = false
    press.current.shouldOpen = false
    stopPress()
    setHolding(false)
    handleOpen()
  }

  async function handlePointerCancel() {
    if (!press.current.down && !press.current.shouldOpen) return
    press.current.down = false
    press.current.shouldOpen = false
    stopPress()
    const spring = animate(press.current.value, 1, {
      type: 'spring',
      stiffness: 420,
      damping: 16,
      onUpdate: setPress,
    })
    press.current.playback = spring
    await spring
    setHolding(false)
  }

  function handleOpen() {
    const book = bookRef.current
    const thumb = book?.parentElement
    if (!book || !thumb) return

    // Layout origin (transform-origin: top left), not the rotated AABB —
    // so the overlay starts on the same point the CSS thumb is anchored to.
    const thumbRect = thumb.getBoundingClientRect()
    const bookStyle = getComputedStyle(book)
    const originX = thumbRect.left + book.offsetLeft
    const originY = thumbRect.top + book.offsetTop
    const restScale = Number(bookStyle.getPropertyValue('--co-book-rest')) || 0.5
    const hoverScale = Number(bookStyle.getPropertyValue('--co-book-hover')) || 0.525
    // Preserve the held frame exactly when the overlay takes ownership;
    // otherwise releasing at 0.91 would pop straight back to full scale.
    const startScale = (bookOpen ? hoverScale : restScale) * press.current.value
    const rotation = bookOpen ? bookTilt : 0

    onOpen(caseSummary, {
      x: originX,
      y: originY,
      width: BOOK_WIDTH * startScale,
      height: BOOK_HEIGHT * startScale,
      rotation,
      open: bookOpen,
      clip: {
        top: Math.max(0, (thumbRect.top - originY) / startScale),
        right: Math.max(0, (originX + BOOK_WIDTH * startScale - thumbRect.right) / startScale),
        bottom: Math.max(0, (originY + BOOK_HEIGHT * startScale - thumbRect.bottom) / startScale),
        left: Math.max(0, (thumbRect.left - originX) / startScale),
      },
      tile: {
        left: thumbRect.left,
        top: thumbRect.top,
        right: thumbRect.right,
        bottom: thumbRect.bottom,
      },
    })
  }

  const Logo = caseSummary.Logo
  const filename = caseSummary.documentTitle
  const bookClassName = `co-doc-thumb-book${holding ? ' co-doc-thumb-book--holding' : ''}${sinking ? ' co-doc-thumb-book--sinking' : ''}`

  return {
    bookRef,
    bookOpen,
    setBookOpen,
    filename,
    Logo,
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel,
    handleOpen,
    bookClassName,
  }
}

function TimelineItem({
  instanceLabel,
  date,
  caseSummary,
  isFirst,
  isLast,
  bookTilt,
  lifted,
  sinking,
  onOpen,
}: {
  instanceLabel: string
  date: string
  caseSummary: CaseSummary
  isFirst: boolean
  isLast: boolean
  bookTilt: number
  lifted: boolean
  sinking: boolean
  onOpen: (caseSummary: CaseSummary, originRect: OriginRect) => void
}) {
  const statusLabel = caseSummary.status
  const {
    bookRef,
    bookOpen,
    setBookOpen,
    filename,
    Logo,
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel,
    handleOpen,
    bookClassName,
  } = useBookThumb({ caseSummary, bookTilt, sinking, onOpen })
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
              <Chip icon={<ITaskDone />} label={statusLabel} muted />
            </div>
          </div>

        {/* Document card */}
        <div
          className={`co-doc-card${lifted ? ' co-doc-card--lifted' : ''}`}
          style={{ '--co-book-tilt': `${bookTilt}deg` } as CSSProperties}
          onMouseEnter={() => setBookOpen(true)}
          onMouseLeave={() => setBookOpen(false)}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div className="co-doc-thumb" aria-hidden="true">
            <PkCaseBook
              ref={bookRef}
              caseNumber={caseSummary.caseNumber}
              title={caseSummary.title}
              coverColor={caseSummary.coverColor}
              pageCount={caseSummary.pageCount}
              logo={Logo ? <Logo /> : undefined}
              open={bookOpen}
              hidePages={lifted}
              extracting={sinking}
              className={bookClassName}
            />
          </div>
          <div className="co-doc-info">
            <div className="co-doc-copy">
              <p className="co-doc-name">{filename}</p>
              <div className="co-meta-row">
                <Chip label={`PDF · ${caseSummary.pageCount} pages`} muted />
              </div>
            </div>
            <PkButton
              variant="secondary"
              size="sm"
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                handleOpen()
              }}
            >
              Open
            </PkButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentCard({
  caseSummary,
  bookTilt,
  lifted,
  sinking,
  onOpen,
}: {
  caseSummary: CaseSummary
  bookTilt: number
  lifted: boolean
  sinking: boolean
  onOpen: (caseSummary: CaseSummary, originRect: OriginRect) => void
}) {
  const {
    bookRef,
    bookOpen,
    setBookOpen,
    filename,
    Logo,
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel,
    handleOpen,
    bookClassName,
  } = useBookThumb({ caseSummary, bookTilt, sinking, onOpen })

  return (
    <div
      className={`co-doc-poster${lifted ? ' co-doc-poster--lifted' : ''}`}
      style={{ '--co-book-tilt': `${bookTilt}deg` } as CSSProperties}
      role="button"
      tabIndex={0}
      aria-label={`Open ${filename}`}
      onMouseEnter={() => setBookOpen(true)}
      onMouseLeave={() => setBookOpen(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleOpen()
        }
      }}
    >
      <div className="co-doc-poster-thumb" aria-hidden="true">
        <PkCaseBook
          ref={bookRef}
          caseNumber={caseSummary.caseNumber}
          title={caseSummary.title}
          coverColor={caseSummary.coverColor}
          pageCount={caseSummary.pageCount}
          logo={Logo ? <Logo /> : undefined}
          open={bookOpen}
          hidePages={lifted}
          extracting={sinking}
          className={bookClassName}
        />
      </div>
      <div className="co-doc-poster-info">
        <p className="co-doc-name">{filename}</p>
        <div className="co-meta-row">
          <Chip icon={<IFile />} label={`${caseSummary.pageCount} pages`} muted />
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
  instanceLabel: `Instance ${CASES.length - i} · ${cs.courtLabel}`,
  date: cs.judgmentDate,
  bookTilt: randomBookTilt(),
}))

const DOCUMENT_ENTRIES = CASES.map((caseSummary) => ({
  caseSummary,
  bookTilt: randomBookTilt(),
}))

export function CaseListPage() {
  const [active, setActive] = useState<{
    caseSummary: CaseSummary
    originRect: OriginRect
    sinking: boolean
    originKey: string
  } | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const returningFromCaseDetail = Boolean(
    (location.state as { fromCaseDetail?: boolean } | null)?.fromCaseDetail,
  )

  return (
    <>
    <div className={`co-page${returningFromCaseDetail ? ' co-page--returning' : ''}${active ? ' co-page--transitioning' : ''}`}>
      <header className="co-appbar">
        <div className="co-appbar-inner">
          <Link to="/" className="co-appbar-logo">
            <PkMark />
            <span className="co-appbar-title">Pandektes</span>
          </Link>
          <nav className="co-appbar-nav" aria-hidden="true">
            {NAV_SKELETON_WIDTHS.map((width) => (
              <span key={width} className="co-appbar-skel" style={{ width }} />
            ))}
          </nav>
        </div>
      </header>

      <main className="co-content">
        {/* ── Case header ───────────────────────────────── */}
        <header className="co-case-header">
          <div className="co-meta-row">
            <InputCopy value={CASE_NUMBER_DISPLAY} />
            <Chip icon={<ITaskDone />} label="Final" />
          </div>
          <div className="co-case-titles">
            <h1 className="co-case-title">Flair Group v. HK Danmark</h1>
            <p className="co-case-desc">{citationMarker('hjr-result', 1, MATTER_DESCRIPTION)}</p>
          </div>
        </header>

        <div className="co-body">
          <div className="co-body-main">
            <div className="co-body-docs">
              <Divider />
              <section className="co-section" aria-label="Case documents">
                <SectionHeader title="Case documents" description={false} />
                <div className="co-docs-grid">
                  {DOCUMENT_ENTRIES.map(({ caseSummary, bookTilt }) => (
                    <DocumentCard
                      key={caseSummary.id}
                      caseSummary={caseSummary}
                      bookTilt={bookTilt}
                      lifted={
                        active?.originKey === `docs:${caseSummary.id}` &&
                        !active.sinking
                      }
                      sinking={active?.originKey === `docs:${caseSummary.id}` && active.sinking}
                      onOpen={(caseSummary, originRect) =>
                        setActive({ caseSummary, originRect, sinking: false, originKey: `docs:${caseSummary.id}` })
                      }
                    />
                  ))}
                </div>
              </section>
            </div>

            <div className="co-body-holding">
              <Divider />
              <section className="co-section" aria-label="Case holding">
                <SectionHeader
                  title="Case holding"
                  description={false}
                />
                <div className="co-holding-grid">
                  <HoldingCard
                    icon={<IThumbsUp />}
                    verdict="Worker awarded DKK 282,338.09"
                    detail={HOLDING_WIN}
                    citation={citationMarker('hjr-result', 1, HOLDING_WIN)}
                    variant="win"
                  />
                  <HoldingCard
                    icon={<IThumbsDown />}
                    verdict="Adecco acquitted"
                    detail={HOLDING_LOSE}
                    citation={citationMarker('shr-majority', 3, HOLDING_LOSE)}
                    variant="lose"
                  />
                </div>
              </section>
              <Divider />
            </div>

              <section className="co-section co-body-history" aria-label="Procedural history">
              <SectionHeader
                title="Procedural history"
                citation={citationMarker('hjr-result', 1,
                  `The dispute ran through three courts. Sø- og Handelsretten acquitted Adecco 2\u20131 (2021). Østre Landsret reversed and awarded DKK 282,338.09 (2024). Højesteret affirmed the appellate judgment in full (2026).`
                )}
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
                    lifted={
                      active?.originKey === `history:${caseSummary.id}` &&
                      !active.sinking
                    }
                    sinking={active?.originKey === `history:${caseSummary.id}` && active.sinking}
                    onOpen={(caseSummary, originRect) =>
                      setActive({ caseSummary, originRect, sinking: false, originKey: `history:${caseSummary.id}` })
                    }
                  />
                ))}
              </div>
            </section>
          </div>

          <aside className="co-sources">
            <Divider />
            <Citations
              citations={CITATION_ITEMS}
              idPrefix={CITATION_PREFIX}
              grouped
              defaultOpen
            />
            <Divider />
          </aside>
        </div>
      </main>
    </div>

    {active && (
      <BookOpenTransition
        caseSummary={active.caseSummary}
        originRect={active.originRect}
        onExtracted={() => {
          setActive((current) => current ? { ...current, sinking: true } : current)
        }}
        onComplete={() => {
          window.scrollTo(0, 0)
          navigate(`/case/${active.caseSummary.id}`)
        }}
      />
    )}
    </>
  )
}
