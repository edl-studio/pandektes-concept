import { tv, type VariantProps } from 'tailwind-variants'

export const button = tv({
  base: 'pk-button__root',
  variants: {
    variant: {
      primary: 'pk-button--primary',
      secondary: 'pk-button--secondary',
      tertiary: 'pk-button--tertiary',
      outline: 'pk-button--tertiary',
      ghost: 'pk-button--ghost',
    },
    size: {
      default: 'pk-button--default',
      compact: 'pk-button--compact',
      icon: 'pk-button--icon',
      'icon-compact': 'pk-button--icon-compact',
    },
    iconLeft: {
      true: 'pk-button--icon-left',
    },
    iconRight: {
      true: 'pk-button--icon-right',
    },
    active: {
      true: 'pk-button--active',
    },
    loading: {
      true: 'pk-button--loading',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default',
  },
})

export type ButtonVariants = VariantProps<typeof button>
