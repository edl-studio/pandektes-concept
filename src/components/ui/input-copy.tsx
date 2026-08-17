import { forwardRef, useCallback, useEffect, useRef, useState, type HTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import './input-copy.css'

export interface InputCopyProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value: string
  onCopy?: () => void
  disabled?: boolean
}

export const InputCopy = forwardRef<HTMLDivElement, InputCopyProps>(
  ({ value, onCopy, disabled, className, ...props }, ref) => {
    const [copied, setCopied] = useState(false)
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
          disabled={disabled}
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        >
          <span className="pk-input-copy__value">{value}</span>
          <span className="pk-input-copy__action" aria-hidden="true">
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="check"
                  className="pk-input-copy__icon"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', duration: 0.08, bounce: 0 }}
                >
                  <HugeiconsIcon icon={Tick02Icon} size={12} color="currentColor" strokeWidth={1} absoluteStrokeWidth />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  className="pk-input-copy__icon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', duration: 0.08, bounce: 0 }}
                >
                  <HugeiconsIcon icon={Copy01Icon} size={12} color="currentColor" strokeWidth={1} absoluteStrokeWidth />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </button>
      </div>
    )
  },
)

InputCopy.displayName = 'InputCopy'
