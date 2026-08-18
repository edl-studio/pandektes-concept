import { AlignLeft, FileText } from 'lucide-react'
import type { CSSProperties } from 'react'

export interface DocumentSummaryBlock {
  id: string
  title: string
  body: string
  pageNumber: number
  quoteText: string
  source: string
  badge?: string
}

interface DocumentSummarySidebarProps {
  blocks: DocumentSummaryBlock[]
  activeBlockId?: string
  onSelect: (block: DocumentSummaryBlock) => void
}

export function DocumentSummarySidebar({
  blocks,
  activeBlockId,
  onSelect,
}: DocumentSummarySidebarProps) {
  return (
    <aside className="case-document-summary" aria-label="Document summary">
      <div className="case-document-summary__heading">
        <span>Summary</span>
        <span className="case-document-summary__count">{blocks.length}</span>
      </div>

      <div className="case-document-summary__blocks">
        {blocks.map((block, index) => {
          const active = block.id === activeBlockId

          return (
            <button
              key={block.id}
              type="button"
              className="case-document-summary__block"
              aria-pressed={active}
              onClick={() => onSelect(block)}
              style={
                {
                  '--pk-summary-delay': `${index * 80}ms`,
                } as CSSProperties
              }
            >
              <span className="case-document-summary__block-bar">
                <span className="case-document-summary__title">
                  <AlignLeft size={12} strokeWidth={2} aria-hidden="true" />
                  <span>{block.title}</span>
                </span>
                <span className="case-document-summary__page">
                  Page {block.pageNumber}
                </span>
              </span>

              <span className="case-document-summary__body">{block.body}</span>

              <span className="case-document-summary__source">
                <span className="case-document-summary__badge">
                  <FileText size={11} strokeWidth={2} aria-hidden="true" />
                  {block.badge ?? 'PDF'}
                </span>
                <span className="case-document-summary__source-name">
                  {block.source}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
