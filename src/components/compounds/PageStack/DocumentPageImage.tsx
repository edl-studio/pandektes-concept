/**
 * Flat "picture of a document" for the revealed first page — deliberately
 * NOT real DOM text sized via our type tokens. The sheet stack is scaled up
 * as a unit via CSS transform for the open/reorganize choreography, and
 * real UI text nested inside that transform renders at the wrong effective
 * size (a 12px label ends up ~40px on screen). An image has no such
 * expectation — scaling it as a unit is exactly how images work — so this
 * renders as inline SVG: vector (stays crisp at any scale), still gets our
 * loaded fonts for the one short/safe line of real text (the case number),
 * and uses abstract formatted bars for the title/body instead of hand-
 * wrapping long text across SVG lines.
 */
export function DocumentPageImage({ caseNumber }: { caseNumber: string }) {
  return (
    <svg viewBox="0 0 180 233" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="90" cy="26" r="13" fill="none" stroke="var(--pk-color-accent-base)" strokeOpacity="0.3" strokeWidth="1.5" />

      <text
        x="90"
        y="52"
        textAnchor="middle"
        fontSize="5"
        fontFamily="var(--pk-font-family-base)"
        fill="var(--pk-color-content-tertiary)"
      >
        {caseNumber}
      </text>

      {/* Headline — a few bold-weight bars standing in for the wrapped title */}
      <rect x="20" y="64" width="140" height="6" rx="2" fill="var(--pk-color-content-primary)" fillOpacity="0.85" />
      <rect x="20" y="76" width="150" height="6" rx="2" fill="var(--pk-color-content-primary)" fillOpacity="0.85" />
      <rect x="20" y="88" width="100" height="6" rx="2" fill="var(--pk-color-content-primary)" fillOpacity="0.85" />

      {/* Body paragraphs — thinner, lighter bars grouped with paragraph gaps */}
      {[108, 138, 168].map((groupY, groupIndex) =>
        [0, 1, 2, 3].map((lineIndex) => {
          const widths = [140, 150, 130, groupIndex === 2 && lineIndex === 3 ? 90 : 145]
          return (
            <rect
              key={`${groupY}-${lineIndex}`}
              x="20"
              y={groupY + lineIndex * 6.5}
              width={widths[lineIndex]}
              height="3.5"
              rx="1.5"
              fill="var(--pk-color-content-quaternary)"
              fillOpacity="0.6"
            />
          )
        }),
      )}

      <circle cx="90" cy="210" r="13" fill="none" stroke="var(--pk-color-accent-base)" strokeOpacity="0.3" strokeWidth="1.5" />
    </svg>
  )
}
