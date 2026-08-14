import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CASES, type CaseSummary } from './case-data'
import { CaseBookCard } from './CaseBookCard'
import { BookOpenTransition, type OriginRect } from './transition/BookOpenTransition'

export function CaseListPage() {
  const [active, setActive] = useState<{ caseSummary: CaseSummary; originRect: OriginRect } | null>(null)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface-body p-12">
      <div className="transition-opacity duration-300" style={{ opacity: active ? 0 : 1 }}>
        <h1 className="heading-32 text-content-primary">Pandektes</h1>
        <p className="text-body-14 text-content-secondary mt-2 max-w-md">Click a case to open it.</p>

        <div className="mt-12 flex flex-wrap gap-10">
          {CASES.map((caseSummary) => (
            <CaseBookCard
              key={caseSummary.id}
              caseSummary={caseSummary}
              onOpen={(caseSummary, originRect) => setActive({ caseSummary, originRect })}
            />
          ))}
        </div>
      </div>

      {active && (
        <BookOpenTransition
          caseSummary={active.caseSummary}
          originRect={active.originRect}
          onComplete={() => navigate(`/case/${active.caseSummary.id}`)}
        />
      )}
    </div>
  )
}
