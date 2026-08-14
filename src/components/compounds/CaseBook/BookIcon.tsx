/**
 * Embossed cover monogram. A single stroked path carries both effects
 * (from the Figma layer): a 1px/1px-blur black drop-shadow at 25% and a
 * matching 1px/1px-blur white inner-shadow at 25%, which together produce
 * the bevelled/engraved look — no duplicated shadow layer needed.
 */
export function BookIcon() {
  return (
    <svg width="40" height="44" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#pk-case-book-icon-filter)">
        <path
          d="M18.666 18.334C20.7514 20.4194 23.4913 22.538 23.5549 22.5871M18.666 18.334C16.5908 16.2588 14.4828 13.5356 14.4137 13.4463M18.666 18.334L12 25M23.5549 22.5871L23.556 22.588L27.364 18.778M23.5549 22.5871L27.364 18.778M23.5549 22.5871L22.92 23.222M27.364 18.778C27.364 18.778 25.22 15.998 23.112 13.888C21.0427 11.8226 18.3322 9.72081 18.2234 9.63662M27.364 18.778L28 18.142M18.2234 9.63662C18.2211 9.63488 18.22 9.634 18.22 9.634L14.412 13.444L14.4137 13.4463M18.2234 9.63662L18.86 9M18.2234 9.63662L14.4137 13.4463M14.4137 13.4463L13.78 14.08M12 33H28M2 25V17C2 9.458 2 5.686 4.344 3.344C6.688 1.002 10.458 1 18 1H22C29.542 1 33.314 1 35.656 3.344C37.998 5.688 38 9.458 38 17V25C38 32.542 38 36.314 35.656 38.656C33.312 40.998 29.542 41 22 41H18C10.458 41 6.686 41 4.344 38.656C2.002 36.312 2 32.542 2 25Z"
          stroke="#872639"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <filter
          id="pk-case-book-icon-filter"
          x="0"
          y="0"
          width="40"
          height="44"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="0.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="0.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="shape" result="effect2_innerShadow" />
        </filter>
      </defs>
    </svg>
  )
}
