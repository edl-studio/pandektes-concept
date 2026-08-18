import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { Field } from '@base-ui/react/field'
import { cn } from '@/lib/utils'
import './input-group.css'

export type InputFieldIcon = ComponentType<{
  size?: string | number
  strokeWidth?: string | number
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}>

interface InputGroupContextValue {
  activeIndex: number | null
  registerItem: (index: number, element: HTMLElement | null) => void
}

const InputGroupContext = createContext<InputGroupContextValue | null>(null)

function useInputGroup() {
  const context = useContext(InputGroupContext)
  if (!context) {
    throw new Error('InputField must be used within InputGroup')
  }
  return context
}

export interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  size?: 'default' | 'compact'
}

export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  ({ children, size = 'default', className, ...props }, forwardedRef) => {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const itemsRef = useRef(new Map<number, HTMLElement>())
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    const registerItem = useCallback(
      (index: number, element: HTMLElement | null) => {
        if (element) itemsRef.current.set(index, element)
        else itemsRef.current.delete(index)
      },
      [],
    )

    const contextValue = useMemo(
      () => ({ activeIndex, registerItem }),
      [activeIndex, registerItem],
    )

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      let nearestIndex: number | null = null
      let nearestDistance = Number.POSITIVE_INFINITY

      itemsRef.current.forEach((element, index) => {
        const rect = element.getBoundingClientRect()
        const distance = Math.abs(event.clientY - (rect.top + rect.height / 2))
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIndex = index
        }
      })

      setActiveIndex(nearestIndex)
    }

    return (
      <InputGroupContext.Provider value={contextValue}>
        <div
          ref={(node) => {
            rootRef.current = node
            if (typeof forwardedRef === 'function') forwardedRef(node)
            else if (forwardedRef) {
              ;(forwardedRef as MutableRefObject<HTMLDivElement | null>).current =
                node
            }
          }}
          className={cn(
            'pk-input-group',
            size === 'compact' && 'pk-input-group--compact',
            className,
          )}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setActiveIndex(null)}
          {...props}
        >
          {children}
        </div>
      </InputGroupContext.Provider>
    )
  },
)

InputGroup.displayName = 'InputGroup'

export interface InputFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'size' | 'value'
  > {
  label: string
  labelHidden?: boolean
  icon?: InputFieldIcon
  index: number
  value: string
  onChange: (value: string) => void
  error?: string
}

export const InputField = forwardRef<HTMLDivElement, InputFieldProps>(
  (
    {
      label,
      labelHidden = false,
      placeholder,
      icon: Icon,
      index,
      value,
      onChange,
      error,
      disabled,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [isFocused, setIsFocused] = useState(false)
    const { activeIndex, registerItem } = useInputGroup()
    const isActive = activeIndex === index
    const iconActive = isActive || isFocused

    useEffect(() => {
      registerItem(index, rootRef.current)
      return () => registerItem(index, null)
    }, [index, registerItem])

    return (
      <Field.Root
        ref={(node) => {
          rootRef.current = node
          if (typeof forwardedRef === 'function') forwardedRef(node)
          else if (forwardedRef) {
            ;(forwardedRef as MutableRefObject<HTMLDivElement | null>).current =
              node
          }
        }}
        invalid={Boolean(error)}
        disabled={disabled}
        className={cn(
          'pk-input-field',
          isActive && 'pk-input-field--active',
          isFocused && 'pk-input-field--focused',
          error && 'pk-input-field--error',
          disabled && 'pk-input-field--disabled',
          className,
        )}
      >
        <Field.Label
          className={cn(
            'pk-input-field__label',
            labelHidden && 'pk-input-field__label--hidden',
          )}
        >
          {label}
        </Field.Label>

        <div
          className="pk-input-field__control"
          onMouseDown={(event) => {
            if (event.target === inputRef.current) return
            event.preventDefault()
            inputRef.current?.focus()
          }}
        >
          {Icon && (
            <Icon
              aria-hidden
              size={16}
              strokeWidth={iconActive ? 2 : 1.5}
              className="pk-input-field__icon"
            />
          )}
          <Field.Control
            {...props}
            ref={inputRef}
            type="text"
            value={value}
            placeholder={placeholder}
            className="pk-input-field__input"
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        {error && (
          <Field.Error match className="pk-input-field__error">
            {error}
          </Field.Error>
        )}
      </Field.Root>
    )
  },
)

InputField.displayName = 'InputField'
