import { forwardRef, useCallback, useEffect, useRef, useState, type HTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, LegalDocument01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import './input-copy.css'

const ICON_SIZE = 12
const ICON_STROKE = 1

const iconTransition = { type: 'spring' as const, duration: 0.08, bounce: 0 }

export interface InputCopyProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value: string
  onCopy?: () => void
  disabled?: boolean
}

export const InputCopy = forwardRef<HTMLDivElement, InputCopyProps>(
  ({ value, onCopy, disabled, className, ...props }, ref) => {
    const [copied, setCopied] = useState(false)
    const [hovered, setHovered] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const copyViaExecCommand = useCallback(() => {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      let ok = false
      try {
        ok = document.execCommand('copy')
      } catch {
        ok = false
      }
      document.body.removeChild(textarea)
      return ok
    }, [value])

    const handleCopy = useCallback(async () => {
      if (disabled) return
      let ok = true
      try {
        await navigator.clipboard.writeText(value)
      } catch {
        ok = copyViaExecCommand()
      }
      if (!ok) return
      setCopied(true)
      onCopy?.()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    }, [value, disabled, onCopy, copyViaExecCommand])

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
    }, [])

    const iconKey = copied ? 'check' : hovered ? 'copy' : 'doc'
    const icon = copied ? Tick02Icon : hovered ? Copy01Icon : LegalDocument01Icon

    return (
      <div
        ref={ref}
        className={cn('pk-input-copy', disabled && 'pk-input-copy--disabled', className)}
        {...props}
      >
        <button
          type="button"
          className="pk-input-copy__button"
          onClick={handleCopy}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          disabled={disabled}
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        >
          <span className="pk-input-copy__action" aria-hidden="true">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={iconKey}
                className="pk-input-copy__icon"
                initial={{ opacity: 0, scale: iconKey === 'check' ? 0.6 : 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={iconTransition}
              >
                <HugeiconsIcon
                  icon={icon}
                  size={ICON_SIZE}
                  color="currentColor"
                  strokeWidth={ICON_STROKE}
                  absoluteStrokeWidth
                />
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="pk-input-copy__value">{value}</span>
        </button>
      </div>
    )
  },
)

InputCopy.displayName = 'InputCopy'
