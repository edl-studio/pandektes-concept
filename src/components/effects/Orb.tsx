import type { CSSProperties } from 'react'
import styles from './Orb.module.css'

const STAGE = 28
const SIZE = 20
const N = 3
const PITCH = 6
const MID = (N - 1) / 2

export type OrbVariant = 'S3'

export const ORB_TASKS: Record<OrbVariant, string> = {
  S3: 'Working',
}

const RING: [number, number][] = (() => {
  const ring: [number, number][] = []
  for (let x = 0; x < N; x += 1) ring.push([x, 0])
  for (let y = 1; y < N; y += 1) ring.push([N - 1, y])
  for (let x = N - 2; x >= 0; x -= 1) ring.push([x, N - 1])
  for (let y = N - 2; y >= 1; y -= 1) ring.push([0, y])
  return ring
})()

const RING_INDEX = new Map(RING.map(([x, y], index) => [`${x},${y}`, index]))

function cellDelay(x: number, y: number) {
  const index = RING_INDEX.get(`${x},${y}`)
  if (index === undefined) return 0
  return -(((RING.length - index) % RING.length) / RING.length) * 1700
}

interface Cell {
  key: string
  left: number
  top: number
  delay: number
  still: boolean
  mid: boolean
}

function latticeCells(): Cell[] {
  const cells: Cell[] = []

  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      cells.push({
        key: `${x},${y}`,
        left: STAGE / 2 + (x - MID) * PITCH,
        top: STAGE / 2 + (y - MID) * PITCH,
        delay: cellDelay(x, y),
        still: !RING_INDEX.has(`${x},${y}`),
        mid: x === MID && y === MID,
      })
    }
  }

  return cells
}

const CELLS = latticeCells()

export interface OrbProps {
  variant?: OrbVariant
  size?: number
  label?: string
  pill?: boolean
  className?: string
  style?: CSSProperties
}

export function Orb({
  variant = 'S3',
  size = SIZE,
  label,
  pill = false,
  className,
  style,
}: OrbProps) {
  const text = label ?? `${ORB_TASKS[variant]}…`

  return (
    <span
      className={`${styles.root}${className ? ` ${className}` : ''}`}
      data-pill={pill ? '' : undefined}
      role={pill ? 'status' : undefined}
      aria-live={pill ? 'polite' : undefined}
      style={style}
    >
      <span
        className={styles.glyph}
        role={pill ? undefined : 'img'}
        aria-label={pill ? undefined : text}
        aria-hidden={pill ? true : undefined}
        style={
          {
            width: size,
            height: size,
            '--orb-k': size / STAGE,
          } as CSSProperties
        }
      >
        <span className={styles.stage}>
          <span className={styles.lattice} data-variant={variant}>
            {CELLS.map((cell) => (
              <span
                key={cell.key}
                className={styles.cell}
                data-still={cell.still ? '' : undefined}
                data-mid={cell.mid ? '' : undefined}
                style={
                  {
                    left: cell.left,
                    top: cell.top,
                    animationDelay: `${cell.delay}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        </span>
      </span>
      {pill && <span className={styles.label}>{text}</span>}
    </span>
  )
}
