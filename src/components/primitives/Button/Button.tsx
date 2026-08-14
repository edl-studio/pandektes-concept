import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { twMerge } from 'tailwind-merge'
import { button, type ButtonVariants } from './button.variants'
import './button.css'

export interface PkButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  asChild?: boolean
  testId?: string
}

export const PkButton = forwardRef<HTMLButtonElement, PkButtonProps>(
  ({ className, variant, size, asChild, disabled, testId, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={twMerge(button({ variant, size }), className)}
        disabled={disabled}
        data-disabled={disabled ? '' : undefined}
        data-testid={testId}
        {...props}
      />
    )
  },
)

PkButton.displayName = 'PkButton'
