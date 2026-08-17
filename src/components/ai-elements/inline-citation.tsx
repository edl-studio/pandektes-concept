import { PreviewCard } from '@base-ui/react/preview-card'
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import './inline-citation.css'

export type InlineCitationProps = ComponentProps<'span'>

export function InlineCitation({ className, ...props }: InlineCitationProps) {
  return <span className={cn('pk-inline-citation', className)} {...props} />
}

export type InlineCitationTextProps = ComponentProps<'span'>

export function InlineCitationText({ className, ...props }: InlineCitationTextProps) {
  return <span className={cn('pk-inline-citation-text', className)} {...props} />
}

export function InlineCitationCard({ children }: { children: ReactNode }) {
  return <PreviewCard.Root>{children}</PreviewCard.Root>
}

export type InlineCitationCardTriggerProps = Omit<
  PreviewCard.Trigger.Props,
  'className' | 'render' | 'delay' | 'closeDelay'
> & {
  className?: string
}

export function InlineCitationCardTrigger({
  className,
  children,
  ...props
}: InlineCitationCardTriggerProps) {
  return (
    <PreviewCard.Trigger
      delay={0}
      closeDelay={100}
      className={cn('co-citation', className)}
      render={<button type="button" />}
      {...props}
    >
      {children}
    </PreviewCard.Trigger>
  )
}

export type InlineCitationCardBodyProps = ComponentProps<'div'>

export function InlineCitationCardBody({
  className,
  children,
  ...props
}: InlineCitationCardBodyProps) {
  return (
    <PreviewCard.Portal>
      <PreviewCard.Positioner side="bottom" align="start" sideOffset={8} className="pk-inline-citation-positioner">
        <PreviewCard.Popup className={cn('pk-inline-citation-card', className)} {...props}>
          {children}
        </PreviewCard.Popup>
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  )
}

type CarouselApi = {
  index: number
  count: number
  prev: () => void
  next: () => void
  setCount: (count: number) => void
}

const CarouselApiContext = createContext<CarouselApi | null>(null)

function useCarouselApi() {
  const api = useContext(CarouselApiContext)
  if (!api) {
    throw new Error('InlineCitation carousel parts must be used within InlineCitationCarousel')
  }
  return api
}

export type InlineCitationCarouselProps = ComponentProps<'div'>

export function InlineCitationCarousel({ className, children, ...props }: InlineCitationCarouselProps) {
  const [index, setIndex] = useState(0)
  const [count, setCount] = useState(0)

  const prev = useCallback(() => {
    setIndex((current) => (count === 0 ? 0 : (current - 1 + count) % count))
  }, [count])

  const next = useCallback(() => {
    setIndex((current) => (count === 0 ? 0 : (current + 1) % count))
  }, [count])

  const api = useMemo(
    () => ({ index, count, prev, next, setCount }),
    [index, count, prev, next],
  )

  return (
    <CarouselApiContext.Provider value={api}>
      <div className={cn('pk-inline-citation-carousel', className)} {...props}>
        {children}
      </div>
    </CarouselApiContext.Provider>
  )
}

export type InlineCitationCarouselHeaderProps = ComponentProps<'div'>

export function InlineCitationCarouselHeader({
  className,
  ...props
}: InlineCitationCarouselHeaderProps) {
  return <div className={cn('pk-inline-citation-carousel-header', className)} {...props} />
}

export type InlineCitationCarouselIndexProps = ComponentProps<'div'>

export function InlineCitationCarouselIndex({
  children,
  className,
  ...props
}: InlineCitationCarouselIndexProps) {
  const { index, count } = useCarouselApi()
  return (
    <div className={cn('pk-inline-citation-carousel-index', className)} {...props}>
      {children ?? `${count === 0 ? 0 : index + 1}/${count}`}
    </div>
  )
}

function CarouselChevron({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d={direction === 'prev' ? 'M7.5 2.5 4 6l3.5 3.5' : 'M4.5 2.5 8 6 4.5 9.5'}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type InlineCitationCarouselPrevProps = ComponentProps<'button'>

export function InlineCitationCarouselPrev({
  className,
  ...props
}: InlineCitationCarouselPrevProps) {
  const { prev } = useCarouselApi()
  return (
    <button
      type="button"
      aria-label="Previous source"
      className={cn('pk-inline-citation-carousel-nav', className)}
      onClick={prev}
      {...props}
    >
      <CarouselChevron direction="prev" />
    </button>
  )
}

export type InlineCitationCarouselNextProps = ComponentProps<'button'>

export function InlineCitationCarouselNext({
  className,
  ...props
}: InlineCitationCarouselNextProps) {
  const { next } = useCarouselApi()
  return (
    <button
      type="button"
      aria-label="Next source"
      className={cn('pk-inline-citation-carousel-nav', className)}
      onClick={next}
      {...props}
    >
      <CarouselChevron direction="next" />
    </button>
  )
}

export type InlineCitationCarouselContentProps = ComponentProps<'div'>

export function InlineCitationCarouselContent({
  children,
  className,
  ...props
}: InlineCitationCarouselContentProps) {
  const { index, setCount } = useCarouselApi()
  const items = useMemo(() => Children.toArray(children), [children])

  useLayoutEffect(() => {
    setCount(items.length)
  }, [items.length, setCount])

  if (items.length === 0) return null

  return (
    <div className={cn('pk-inline-citation-carousel-content', className)} {...props}>
      {items[Math.min(index, items.length - 1)]}
    </div>
  )
}

export type InlineCitationCarouselItemProps = ComponentProps<'div'>

export function InlineCitationCarouselItem({
  className,
  ...props
}: InlineCitationCarouselItemProps) {
  return <div className={cn('pk-inline-citation-carousel-item', className)} {...props} />
}

export type InlineCitationSourceProps = ComponentProps<'div'> & {
  title?: string
  url?: string
  description?: string
  thumbnail?: ReactNode
}

export function InlineCitationSource({
  title,
  url,
  description,
  thumbnail,
  className,
  children,
  ...props
}: InlineCitationSourceProps) {
  return (
    <div className={cn('pk-inline-citation-source', className)} {...props}>
      {thumbnail && (
        <div className="pk-inline-citation-source-thumb" aria-hidden="true">
          {thumbnail}
        </div>
      )}
      <div className="pk-inline-citation-source-copy">
        {title && <p className="pk-inline-citation-source-title">{title}</p>}
        {url && <p className="pk-inline-citation-source-url">{url}</p>}
        {description && <p className="pk-inline-citation-source-desc">{description}</p>}
        {children}
      </div>
    </div>
  )
}

export type InlineCitationQuoteProps = ComponentProps<'blockquote'>

export function InlineCitationQuote({ className, ...props }: InlineCitationQuoteProps) {
  return <blockquote className={cn('pk-inline-citation-quote', className)} {...props} />
}
