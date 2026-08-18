import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { Search } from 'lucide-react'
import { PkButton } from '@/components/primitives/Button'
import { InputField, InputGroup } from '@/components/ui/input-group'
import { getCaseById } from './case-data'
import { CaseDocumentViewer } from './CaseDocumentViewer'
import { DETAIL_PAGE_HEADER_HEIGHT } from './transition/layout'

function BackToCasesButton() {
  return (
    <PkButton
      variant="secondary"
      size="icon"
      className="fixed top-6 left-6 z-20"
      asChild
    >
      <Link to="/" aria-label="Back to cases">
        <HugeiconsIcon
          icon={Cancel01Icon}
          size={16}
          strokeWidth={1.5}
          color="currentColor"
          absoluteStrokeWidth
        />
      </Link>
    </PkButton>
  )
}

const CONTENT_REVEAL_DELAY_MS = 400

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const caseSummary = id ? getCaseById(id) : undefined
  const [showContent, setShowContent] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    const timer = setTimeout(() => setShowContent(true), CONTENT_REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!caseSummary) {
    return (
      <div className="min-h-screen bg-surface-body p-12">
        <p className="text-body-14 text-content-secondary">Case not found.</p>
        <BackToCasesButton />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-body p-12 flex flex-col items-center">
      <BackToCasesButton />

      {/* The fixed height keeps the stack aligned with BookOpenTransition's
          DETAIL_TOP settle target while providing a document toolbar. */}
      <div
        className="w-full max-w-[600px] flex items-start justify-end"
        style={{ height: DETAIL_PAGE_HEADER_HEIGHT }}
      >
        <InputGroup className="w-full">
          <InputField
            index={0}
            label="Search"
            labelHidden
            placeholder="Search document…"
            icon={Search}
            value={searchValue}
            onChange={setSearchValue}
          />
        </InputGroup>
      </div>

      <CaseDocumentViewer
        caseSummary={caseSummary}
        contentVisible={showContent}
      />
    </div>
  )
}
