import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { Search } from 'lucide-react'
import { PkButton } from '@/components/primitives/Button'
import { InputField, InputGroup } from '@/components/ui/input-group'
import { getCaseById } from './case-data'
import { getCitationById } from './citation-data'
import { CaseDocumentViewer } from './CaseDocumentViewer'
import type { CitationHighlight } from './CaseDocumentViewer'
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

const CONTENT_REVEAL_DELAY_MS = 600

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const caseSummary = id ? getCaseById(id) : undefined
  const [showContent, setShowContent] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchResultCount, setSearchResultCount] = useState<number | null>(null)

  // Incremented on Enter, decremented on Shift+Enter — viewer computes direction from delta.
  const [searchNavStep, setSearchNavStep] = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
    const timer = setTimeout(() => setShowContent(true), CONTENT_REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  // Resolve citation deep-link from ?citation=id query param.
  const citationId = searchParams.get('citation') ?? undefined
  let citationHighlight: CitationHighlight | undefined

  if (citationId && id) {
    const citation = getCitationById(citationId)
    if (citation && citation.caseId === id && citation.pageNumber && citation.quoteText) {
      citationHighlight = {
        pageNumber: citation.pageNumber,
        quoteText: citation.quoteText,
      }
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Positive delta = forward, negative delta = backward.
      setSearchNavStep((s) => s + (e.shiftKey ? -1 : 1))
    }
    if (e.key === 'Escape') {
      setSearchValue('')
    }
  }

  if (!caseSummary) {
    return (
      <div className="min-h-screen bg-surface-body p-12">
        <p className="text-body-14 text-content-secondary">Case not found.</p>
        <BackToCasesButton />
      </div>
    )
  }

  return (
    <div className="case-detail-page min-h-screen bg-surface-body">
      <BackToCasesButton />

      <CaseDocumentViewer
        caseSummary={caseSummary}
        contentVisible={showContent}
        searchQuery={searchValue}
        searchNavStep={searchNavStep}
        citationHighlight={citationHighlight}
        onSearchResults={setSearchResultCount}
        searchToolbar={
          <div
            className="case-detail-page__toolbar"
            data-content-visible={showContent}
            style={{ height: DETAIL_PAGE_HEADER_HEIGHT, position: 'relative' }}
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
                onKeyDown={handleSearchKeyDown}
              />
            </InputGroup>
            {searchValue.trim() && searchResultCount !== null && (
              <p
                className="case-detail-page__search-count"
                aria-live="polite"
                aria-atomic="true"
              >
                {searchResultCount === 0
                  ? 'No results'
                  : `${searchResultCount} result${searchResultCount !== 1 ? 's' : ''} — Enter to navigate`}
              </p>
            )}
          </div>
        }
      />
    </div>
  )
}
