import { tv, type VariantProps } from 'tailwind-variants'

export const button = tv({
  base: 'pk-button__root',
  variants: {
    variant: {
      primary: 'pk-button--primary',
      outline: 'pk-button--outline',
      ghost: 'pk-button--ghost',
    },
    size: {
      sm: 'pk-button--sm',
      md: 'pk-button--md',
      lg: 'pk-button--lg',
    },
  },
  defaultVariants: {
    variant: 'outline',
    size: 'md',
  },
})

export type ButtonVariants = VariantProps<typeof button>
