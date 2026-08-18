import type { CSSProperties } from 'react'
import styles from './Orb.module.css'

const STAGE = 28
const SIZE = 20
const N = 3
const PITCH = 6
const MID = (N - 1) / 2
const SWIRL = 1.05
const SPREAD = 1.6

export type OrbVariant = 'S1'

export const ORB_TASKS: Record<OrbVariant, string> = {
  S1: 'Thinking',
}

function cellDelay(x: number, y: number) {
  const dx = x - MID
  const dy = y - MID
  return Math.hypot(dx, dy) * 700 - (dx === 0 && dy === 0 ? 180 : 0)
}

function swirl(x: number, y: number, angle: number): [number, number] {
  const dx = x - MID
  const dy = y - MID
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return [
    ((dx * cos - dy * sin) * SPREAD - dx) * PITCH,
    ((dx * sin + dy * cos) * SPREAD - dy) * PITCH,
  ]
}

interface Cell {
  key: string
  left: number
  top: number
  delay: number
  ax: number
  ay: number
  bx: number
  by: number
  mid: boolean
}

function latticeCells(): Cell[] {
  const cells: Cell[] = []

  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      const [ax, ay] = swirl(x, y, -SWIRL)
      const [bx, by] = swirl(x, y, SWIRL)
      cells.push({
        key: `${x},${y}`,
        left: STAGE / 2 + (x - MID) * PITCH,
        top: STAGE / 2 + (y - MID) * PITCH,
        delay: cellDelay(x, y),
        ax,
        ay,
        bx,
        by,
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
  variant = 'S1',
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
                data-mid={cell.mid ? '' : undefined}
                style={
                  {
                    left: cell.left,
                    top: cell.top,
                    animationDelay: `${cell.delay}ms`,
                    '--orb-ax': `${cell.ax}px`,
                    '--orb-ay': `${cell.ay}px`,
                    '--orb-bx': `${cell.bx}px`,
                    '--orb-by': `${cell.by}px`,
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
