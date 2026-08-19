// Adapted from beui.dev/components/motion/shared-layout-bg

import {
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  useReducedMotion,
  type Variants,
} from 'framer-motion'
import {
  Children,
  cloneElement,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  useId,
  useState,
} from 'react'
import { cn } from '@/lib/utils'
import './shared-layout-bg.css'

export interface SharedLayoutBgProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  children: ReactNode
  /** Semantic container used for the children. */
  as?: 'div' | 'ul'
  /** Class applied to the moving pill. */
  pillClassName?: string
  /** Horizontal inset of the pill relative to each row (px). Default 20. */
  inset?: number
  /** Optional positioning override for the pill wrapper inside each item. */
  pillContainerClassName?: string
  /** Item index where the pill rests when no item is hovered. */
  activeIndex?: number
}

const SPRING_LAYOUT = { type: 'spring' as const, stiffness: 360, damping: 32, mass: 0.6 }

const variants: Variants = {
  initial: { opacity: 0, filter: 'blur(6px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: (isActive: boolean) =>
    !isActive ? { opacity: 0, filter: 'blur(6px)' } : {},
}

const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: (isActive: boolean) => (!isActive ? { opacity: 0 } : {}),
}

export const SharedLayoutBg = forwardRef<HTMLElement, SharedLayoutBgProps>(
  function SharedLayoutBg(
    {
      children,
      as = 'div',
      className,
      onMouseLeave,
      pillClassName,
      pillContainerClassName,
      activeIndex,
      inset = 20,
      ...props
    },
    forwardedRef,
  ) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const uid = useId()
    const reduce = useReducedMotion()
    const items = Children.toArray(children).filter(isValidElement)
    const selectedId =
      activeIndex !== undefined && activeIndex >= 0 && activeIndex < items.length
        ? String(items[activeIndex].key ?? `item-${activeIndex}`)
        : null
    const activeId = hoveredId ?? selectedId

    const renderedChildren = items.map((child, index) => {
      const el = child as ReactElement<{
        className?: string
        onMouseEnter?: (event: MouseEvent<HTMLElement>) => void
        children?: ReactNode
      }>
      const childKey = el.key ? String(el.key) : `item-${index}`
      return cloneElement(
        el,
        {
          key: childKey,
          className: cn('pk-shared-layout-bg-item', el.props.className),
          onMouseEnter: (event: MouseEvent<HTMLElement>) => {
            el.props.onMouseEnter?.(event)
            setHoveredId(childKey)
          },
        },
        <>
          <AnimatePresence custom={activeId !== null}>
            {activeId !== null ? (
              <motion.div
                variants={reduce ? reducedVariants : variants}
                initial="initial"
                animate="animate"
                exit="exit"
                custom={activeId !== null}
                className={cn('pk-shared-layout-bg-pill-wrap', pillContainerClassName)}
                style={{ left: -inset, right: -inset }}
              >
                {activeId === childKey ? (
                  <motion.div
                    layoutId={`shared-bg-${uid}`}
                    transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                    className={cn('pk-shared-layout-bg-pill', pillClassName)}
                  />
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div className="pk-shared-layout-bg-content">{el.props.children}</div>
        </>,
      )
    })

    const handleMouseLeave = (event: MouseEvent<HTMLElement>) => {
      setHoveredId(null)
      onMouseLeave?.(event)
    }

    // layoutRoot scopes the pill's layout projection to this list, so fixed or
    // scrolled ancestors can't smear scroll offsets into its movement.
    return as === 'ul' ? (
      <motion.ul
        {...(props as HTMLMotionProps<'ul'>)}
        ref={forwardedRef as Ref<HTMLUListElement>}
        layoutRoot
        onMouseLeave={handleMouseLeave}
        className={cn('pk-shared-layout-bg', className)}
      >
        {renderedChildren}
      </motion.ul>
    ) : (
      <motion.div
        {...(props as HTMLMotionProps<'div'>)}
        ref={forwardedRef as Ref<HTMLDivElement>}
        layoutRoot
        onMouseLeave={handleMouseLeave}
        className={cn('pk-shared-layout-bg', className)}
      >
        {renderedChildren}
      </motion.div>
    )
  },
)
