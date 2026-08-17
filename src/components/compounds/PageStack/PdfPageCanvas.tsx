import { useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const pdfCache = new Map<string, ReturnType<typeof pdfjsLib.getDocument>['promise']>()

function getPdf(url: string) {
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
}

export function PdfPageCanvas({ url, pageNumber = 1, targetWidth }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
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
      await page.render({ canvas, canvasContext: context, viewport }).promise
    }

    render()
    return () => {
      cancelled = true
    }
  }, [url, pageNumber, targetWidth])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}
