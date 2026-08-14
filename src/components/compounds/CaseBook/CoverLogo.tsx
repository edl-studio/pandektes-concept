import { useId, type ReactNode } from 'react'

/**
 * Applies the cover-mark treatment from Figma: a 1px/1px-blur black
 * drop-shadow at 25% plus a matching white inner-shadow at 25%, which
 * together produce the bevelled/engraved look on whatever SVG is passed in.
 */
export function CoverLogo({ children }: { children: ReactNode }) {
  const rawId = useId()
  const filterId = `pk-case-book-logo-${rawId.replace(/:/g, '')}`

  return (
    <div className="pk-case-book__icon">
      <svg aria-hidden className="pk-case-book__icon-filter-defs" width="0" height="0">
        <defs>
          <filter
            id={filterId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="1" />
            <feGaussianBlur stdDeviation="0.5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="1" />
            <feGaussianBlur stdDeviation="0.5" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
            <feBlend mode="normal" in2="shape" result="effect2_innerShadow" />
          </filter>
        </defs>
      </svg>
      <div className="pk-case-book__icon-mark" style={{ filter: `url(#${filterId})` }}>
        {children}
      </div>
    </div>
  )
}
