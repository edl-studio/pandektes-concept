import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { ChevronDown } from 'lucide-react'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import './accordion.css'

type AccordionGroupProps<Value = string> =
  AccordionPrimitive.Root.Props<Value> & {
    type?: 'single' | 'multiple'
  }

export function AccordionGroup<Value = string>({
  type = 'single',
  className,
  ...props
}: AccordionGroupProps<Value>) {
  return (
    <AccordionPrimitive.Root
      className={cn('pk-accordion', className)}
      multiple={type === 'multiple'}
      {...props}
    />
  )
}

type AccordionItemProps = AccordionPrimitive.Item.Props & {
  index?: number
}

export function AccordionItem({
  index,
  className,
  style,
  ...props
}: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item
      className={cn('pk-accordion-item', className)}
      style={{
        ...style,
        '--pk-accordion-index': index ?? 0,
      } as CSSProperties}
      {...props}
    />
  )
}

export function AccordionTrigger({
  children,
  className,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="pk-accordion-header">
      <AccordionPrimitive.Trigger
        className={cn('pk-accordion-trigger', className)}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className="pk-accordion-chevron"
          size={12}
          strokeWidth={1}
          absoluteStrokeWidth
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

export function AccordionContent({
  children,
  className,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      className={cn('pk-accordion-content', className)}
      {...props}
    >
      <div className="pk-accordion-content-inner">{children}</div>
    </AccordionPrimitive.Panel>
  )
}
