import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ComponentType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cn } from '@/lib/utils'
import { button, type ButtonVariants } from './button.variants'
import './button.css'

export type PkButtonIcon = ComponentType<{
  size?: number
  strokeWidth?: number
  className?: string
}>

type ButtonSizeCanonical = 'default' | 'compact' | 'icon' | 'icon-compact'

type ButtonSize =
  | ButtonSizeCanonical
  | 'sm'
  | 'md'
  | 'lg'
  | 'icon-sm'
  | 'icon-lg'

const legacySizeAliases: Partial<Record<ButtonSize, ButtonSizeCanonical>> = {
  sm: 'compact',
  md: 'default',
  lg: 'default',
  'icon-sm': 'icon-compact',
  'icon-lg': 'icon',
}

export interface PkButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<ButtonVariants, 'size' | 'iconLeft' | 'iconRight' | 'active' | 'loading'> {
  size?: ButtonSize
  asChild?: boolean
  loading?: boolean
  leadingIcon?: PkButtonIcon
  trailingIcon?: PkButtonIcon
  /** Force the visual pressed/held state (e.g. while a popover is open). */
  active?: boolean
  testId?: string
}

function ButtonSpinner() {
  return (
    <span className="pk-button__spinner">
      <svg className="pk-button__spinner-svg" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          className="pk-button__spinner-path"
          d="M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z"
          pathLength="100"
        />
      </svg>
    </span>
  )
}

export const PkButton = forwardRef<HTMLButtonElement, PkButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      active = false,
      disabled,
      children,
      style,
      testId,
      ...props
    },
    ref,
  ) => {
    const asChildElement =
      asChild && isValidElement(children)
        ? (children as ReactElement<{
            children?: ReactNode
            className?: string
            style?: React.CSSProperties
            ref?: Ref<HTMLButtonElement>
          }>)
        : null
    const label = asChildElement ? asChildElement.props.children : children

    const resolvedSize: ButtonSizeCanonical = size
      ? (legacySizeAliases[size] ?? (size as ButtonSizeCanonical))
      : 'default'
    const isIconOnly = resolvedSize === 'icon' || resolvedSize === 'icon-compact'
    const isCompact = resolvedSize === 'compact' || resolvedSize === 'icon-compact'
    const iconSize = isCompact ? 14 : 16
    const isDisabled = Boolean(disabled || loading)

    const internals = (
      <>
        <span aria-hidden className="pk-button__surface" />
        <span className="pk-button__content">
          {loading ? (
            <>
              <span className="pk-button__cluster pk-button__cluster--hidden">
                {LeadingIcon && !isIconOnly && (
                  <LeadingIcon size={iconSize} strokeWidth={2} className="pk-button__icon" />
                )}
                {label}
                {TrailingIcon && !isIconOnly && (
                  <TrailingIcon size={iconSize} strokeWidth={2} className="pk-button__icon" />
                )}
              </span>
              <ButtonSpinner />
            </>
          ) : isIconOnly ? (
            <span className="pk-button__glyph">{label}</span>
          ) : (
            <>
              {LeadingIcon && (
                <LeadingIcon size={iconSize} strokeWidth={1.5} className="pk-button__icon" />
              )}
              <span className="pk-button__label">{label}</span>
              {TrailingIcon && (
                <TrailingIcon size={iconSize} strokeWidth={1.5} className="pk-button__icon" />
              )}
            </>
          )}
        </span>
      </>
    )

    const rootClassName = cn(
      button({
        variant,
        size: resolvedSize,
        iconLeft: !isIconOnly && !!LeadingIcon,
        iconRight: !isIconOnly && !!TrailingIcon,
        active,
        loading,
      }),
      className,
    )

    if (asChildElement) {
      const childProps = asChildElement.props
      return cloneElement(
        asChildElement,
        {
          ...props,
          ref,
          className: cn(rootClassName, childProps.className),
          style: { ...style, ...childProps.style },
          'data-testid': testId,
          'data-disabled': isDisabled ? '' : undefined,
        } as Record<string, unknown>,
        internals,
      )
    }

    return (
      <ButtonPrimitive
        ref={ref as Ref<HTMLButtonElement>}
        className={rootClassName}
        disabled={isDisabled}
        data-disabled={isDisabled ? '' : undefined}
        data-testid={testId}
        style={style}
        {...props}
      >
        {internals}
      </ButtonPrimitive>
    )
  },
)

PkButton.displayName = 'PkButton'

export type { ButtonSize }
