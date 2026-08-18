import { useEffect, useRef, useState, type CSSProperties } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { RenderTask } from 'pdfjs-dist'
import { getPdf } from './PdfPageCanvas'

export interface SelectablePdfPageProps {
  url: string
  pageNumber?: number
  /**
   * Target CSS display width in px. Canvas is rasterized at this size ×
   * devicePixelRatio; text layer uses CSS scale only for accurate alignment.
   */
  targetWidth: number
  className?: string
  /** Passive search term — all matches on this page get a soft highlight. */
  searchQuery?: string
  /** Quote to highlight prominently (citation deep-link). Superseded by searchQuery. */
  activeHighlight?: string
  /** When true the page's highlights use the active/focused style. */
  isActivePage?: boolean
}

interface HighlightRect {
  left: number
  top: number
  width: number
  height: number
  active: boolean
}

/**
 * Find all occurrences of `query` within the rendered text layer and return
 * viewport-relative rects converted to container-relative coordinates.
 */
function findRects(
  textDivs: HTMLElement[],
  query: string,
  containerEl: HTMLElement,
  active: boolean,
): HighlightRect[] {
  const trimmed = query.trim()
  if (!trimmed || textDivs.length === 0) return []

  const lowerQuery = trimmed.toLowerCase()
  const containerRect = containerEl.getBoundingClientRect()
  const result: HighlightRect[] = []

  // Build a contiguous character map across all text spans.
  let fullText = ''
  const spanMap: Array<{ el: HTMLElement; start: number; len: number }> = []
  for (const div of textDivs) {
    const text = div.textContent ?? ''
    spanMap.push({ el: div, start: fullText.length, len: text.length })
    fullText += text
  }

  const lowerFull = fullText.toLowerCase()
  let searchPos = 0

  while (true) {
    const matchStart = lowerFull.indexOf(lowerQuery, searchPos)
    if (matchStart === -1) break
    const matchEnd = matchStart + lowerQuery.length

    for (const { el, start, len } of spanMap) {
      const spanEnd = start + len
      if (spanEnd <= matchStart || start >= matchEnd) continue

      const charStart = Math.max(matchStart - start, 0)
      const charEnd = Math.min(matchEnd - start, len)

      try {
        const textNode = el.firstChild
        if (!textNode || textNode.nodeType !== Node.TEXT_NODE) continue
        const nodeLen = textNode.textContent?.length ?? 0
        if (charStart >= nodeLen) continue

        const range = document.createRange()
        range.setStart(textNode, charStart)
        range.setEnd(textNode, Math.min(charEnd, nodeLen))

        for (const r of Array.from(range.getClientRects())) {
          if (r.width > 0.5 && r.height > 0.5) {
            result.push({
              left: r.left - containerRect.left,
              top: r.top - containerRect.top,
              width: r.width,
              height: r.height,
              active,
            })
          }
        }
      } catch {
        // Silently skip malformed text nodes.
      }
    }

    searchPos = matchStart + 1
  }

  return result
}

export function SelectablePdfPage({
  url,
  pageNumber = 1,
  targetWidth,
  className,
  searchQuery = '',
  activeHighlight = '',
  isActivePage = false,
}: SelectablePdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const textDivsRef = useRef<HTMLElement[]>([])
  // Bumped after each text layer render to trigger highlight recomputation.
  const [textLayerVersion, setTextLayerVersion] = useState(0)
  const [highlightRects, setHighlightRects] = useState<HighlightRect[]>([])

  // Effect 1 — render canvas and text layer.
  useEffect(() => {
    let cancelled = false
    let renderTask: RenderTask | null = null
    let textLayerInst: { cancel: () => void } | null = null

    async function render() {
      try {
        const pdf = await getPdf(url)
        const page = await pdf.getPage(pageNumber)
        const dpr = window.devicePixelRatio || 1
        const baseViewport = page.getViewport({ scale: 1 })
        const cssScale = targetWidth / baseViewport.width

        // Canvas: rendered at full DPR resolution for sharpness.
        const canvasViewport = page.getViewport({ scale: cssScale * dpr })
        // Text layer: CSS scale only so selection rectangles align with display.
        const cssViewport = page.getViewport({ scale: cssScale })

        const canvas = canvasRef.current
        const textDiv = textLayerRef.current
        if (!canvas || !textDiv || cancelled) return

        canvas.width = canvasViewport.width
        canvas.height = canvasViewport.height
        canvas.style.width = `${targetWidth}px`
        canvas.style.height = `${targetWidth * (baseViewport.height / baseViewport.width)}px`

        const context = canvas.getContext('2d')
        if (!context) return

        renderTask = page.render({ canvas, canvasContext: context, viewport: canvasViewport })
        await renderTask.promise
        if (cancelled) return

        // Clear previous content before rendering fresh text layer.
        textDiv.replaceChildren()

        const tl = new pdfjsLib.TextLayer({
          textContentSource: page.streamTextContent(),
          container: textDiv,
          viewport: cssViewport,
        })
        textLayerInst = tl
        await tl.render()
        if (cancelled) return

        textDivsRef.current = tl.textDivs
        setTextLayerVersion((v) => v + 1)
      } catch (error) {
        if (!cancelled && !(error instanceof pdfjsLib.RenderingCancelledException)) {
          console.error(`SelectablePdfPage: failed to render page ${pageNumber}`, error)
        }
      }
    }

    void render()
    return () => {
      cancelled = true
      renderTask?.cancel()
      textLayerInst?.cancel()
    }
  }, [url, pageNumber, targetWidth])

  // Effect 2 — recompute highlight rectangles when text layer or queries change.
  useEffect(() => {
    const wrapper = wrapperRef.current
    const textDivs = textDivsRef.current

    if (!wrapper || textDivs.length === 0) {
      setHighlightRects([])
      return
    }

    const rects: HighlightRect[] = []

    // Citation / active highlight takes priority.
    if (activeHighlight.trim()) {
      rects.push(...findRects(textDivs, activeHighlight, wrapper, true))
    }

    // Search query highlights (passive), skipped when identical to activeHighlight.
    if (
      searchQuery.trim() &&
      searchQuery.trim().toLowerCase() !== activeHighlight.trim().toLowerCase()
    ) {
      rects.push(...findRects(textDivs, searchQuery, wrapper, isActivePage))
    }

    setHighlightRects(rects)
  }, [textLayerVersion, searchQuery, activeHighlight, isActivePage])

  return (
    <div
      ref={wrapperRef}
      className={['pdf-selectable-page', className].filter(Boolean).join(' ')}
      style={{ position: 'relative' } as CSSProperties}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {/* Highlight overlays — rendered above canvas, below text layer. */}
      <div aria-hidden="true" className="pdf-selectable-page__highlight-layer">
        {highlightRects.map((r, i) => (
          <div
            key={i}
            className={`pdf-selectable-page__highlight${r.active ? ' pdf-selectable-page__highlight--active' : ''}`}
            style={{
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
            } as CSSProperties}
          />
        ))}
      </div>

      {/* Transparent selectable text layer. */}
      <div ref={textLayerRef} className="textLayer" />
    </div>
  )
}
