'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

export interface FlickeringGridProps extends HTMLAttributes<HTMLDivElement> {
  squareSize?: number
  gridGap?: number
  flickerChance?: number
  color?: string
  width?: number
  height?: number
  maxOpacity?: number
}

export function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = 'rgb(0, 0, 0)',
  width,
  height,
  className,
  maxOpacity = 0.3,
  ...props
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const memoizedColor = useMemo(() => {
    if (typeof window === 'undefined') return 'rgba(0, 0, 0,'

    const colorCanvas = document.createElement('canvas')
    colorCanvas.width = 1
    colorCanvas.height = 1
    const context = colorCanvas.getContext('2d')
    if (!context) return 'rgba(125, 35, 52,'

    context.fillStyle = color
    context.fillRect(0, 0, 1, 1)
    const [r, g, b] = Array.from(
      context.getImageData(0, 0, 1, 1).data,
    )
    return `rgba(${r}, ${g}, ${b},`
  }, [color])

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, canvasWidth: number, canvasHeight: number) => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(canvasWidth * dpr)
      canvas.height = Math.round(canvasHeight * dpr)
      canvas.style.width = `${canvasWidth}px`
      canvas.style.height = `${canvasHeight}px`
      const cols = Math.ceil(canvasWidth / (squareSize + gridGap))
      const rows = Math.ceil(canvasHeight / (squareSize + gridGap))
      const squares = new Float32Array(cols * rows)

      for (let i = 0; i < squares.length; i += 1) {
        squares[i] = Math.random() * maxOpacity
      }

      return { cols, rows, squares, dpr }
    },
    [gridGap, maxOpacity, squareSize],
  )

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let i = 0; i < squares.length; i += 1) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity
        }
      }
    },
    [flickerChance, maxOpacity],
  )

  const drawGrid = useCallback(
    (
      context: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      context.clearRect(0, 0, canvasWidth, canvasHeight)

      for (let column = 0; column < cols; column += 1) {
        for (let row = 0; row < rows; row += 1) {
          const opacity = squares[column * rows + row]
          context.fillStyle = `${memoizedColor}${opacity})`
          context.fillRect(
            column * (squareSize + gridGap) * dpr,
            row * (squareSize + gridGap) * dpr,
            squareSize * dpr,
            squareSize * dpr,
          )
        }
      }
    },
    [gridGap, memoizedColor, squareSize],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const context = canvas?.getContext('2d') ?? null
    if (!canvas || !container || !context) return

    let animationFrameId: number | null = null
    let gridParams: ReturnType<typeof setupCanvas> | null = null
    let lastTime: number | null = null

    const updateCanvasSize = () => {
      const newWidth = width ?? container.clientWidth
      const newHeight = height ?? container.clientHeight
      setCanvasSize({ width: newWidth, height: newHeight })
      gridParams = setupCanvas(canvas, newWidth, newHeight)
      drawGrid(
        context,
        canvas.width,
        canvas.height,
        gridParams.cols,
        gridParams.rows,
        gridParams.squares,
        gridParams.dpr,
      )
    }

    const animate = (time: number) => {
      if (!isInView || !gridParams) return
      const deltaTime = lastTime === null ? 0 : (time - lastTime) / 1000
      lastTime = time
      updateSquares(gridParams.squares, deltaTime)
      drawGrid(
        context,
        canvas.width,
        canvas.height,
        gridParams.cols,
        gridParams.rows,
        gridParams.squares,
        gridParams.dpr,
      )
      animationFrameId = requestAnimationFrame(animate)
    }

    updateCanvasSize()

    const resizeObserver = new ResizeObserver(updateCanvasSize)
    resizeObserver.observe(container)

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 },
    )
    intersectionObserver.observe(canvas)

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (isInView && !reduceMotion) {
      animationFrameId = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [
    drawGrid,
    height,
    isInView,
    setupCanvas,
    updateSquares,
    width,
  ])

  return (
    <div
      ref={containerRef}
      className={cn('h-full w-full', className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
    </div>
  )
}
