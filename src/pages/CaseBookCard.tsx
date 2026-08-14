import { useRef } from 'react'
import { PkCaseBook } from '@/components/compounds/CaseBook'
import type { CaseSummary } from './case-data'
import type { OriginRect } from './transition/BookOpenTransition'

export function CaseBookCard({
  caseSummary,
  onOpen,
}: {
  caseSummary: CaseSummary
  onOpen: (caseSummary: CaseSummary, originRect: OriginRect) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  function handleOpen() {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    onOpen(caseSummary, { x: rect.left, y: rect.top, width: rect.width, height: rect.height })
  }

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') handleOpen()
      }}
      style={{ cursor: 'pointer', width: 188, height: 233 }}
    >
      <PkCaseBook caseNumber={caseSummary.caseNumber} title={caseSummary.title} pageCount={caseSummary.pageCount} />
    </div>
  )
}
