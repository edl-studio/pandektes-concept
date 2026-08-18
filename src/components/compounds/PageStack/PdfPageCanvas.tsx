import { useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { RenderTask } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const pdfCache = new Map<string, ReturnType<typeof pdfjsLib.getDocument>['promise']>()

export function getPdf(url: string) {
  let loading = pdfCache.get(url)
  if (!loading) {
    loading = pdfjsLib.getDocument({ url }).promise
    pdfCache.set(url, loading)
  }
  return loading
}

export interface PdfPageCanvasProps {
  url: string
  pageNumber?: number
  /** Target CSS display width in px — the canvas is rasterized at this size (× devicePixelRatio), never stretched. */
  targetWidth: number
  className?: string
}

export function PdfPageCanvas({ url, pageNumber = 1, targetWidth, className }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    let renderTask: RenderTask | null = null

    async function render() {
      try {
        const pdf = await getPdf(url)
        const page = await pdf.getPage(pageNumber)
        const dpr = window.devicePixelRatio || 1
        const baseViewport = page.getViewport({ scale: 1 })
        const cssScale = targetWidth / baseViewport.width
        const viewport = page.getViewport({ scale: cssScale * dpr })

        const canvas = canvasRef.current
        if (!canvas || cancelled) return

        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = `${targetWidth}px`
        canvas.style.height = `${targetWidth * (baseViewport.height / baseViewport.width)}px`

        const context = canvas.getContext('2d')
        if (!context) return
        renderTask = page.render({ canvas, canvasContext: context, viewport })
        await renderTask.promise
      } catch (error) {
        if (!cancelled && !(error instanceof pdfjsLib.RenderingCancelledException)) {
          console.error(`Failed to render PDF page ${pageNumber}`, error)
        }
      }
    }

    void render()
    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [url, pageNumber, targetWidth])

  return <canvas ref={canvasRef} className={className} style={{ display: 'block' }} />
}
