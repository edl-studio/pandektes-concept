import { useId } from 'react'
import hojesteret from '@/assets/court-logos/hojesteret.svg?raw'
import ostreLandsret from '@/assets/court-logos/ostre-landsret.svg?raw'
import soHandelsretten from '@/assets/court-logos/so-og-handelsretten.svg?raw'

/** Inlines a court-mark SVG so `currentColor` inherits the cover treatment. */
function InlineLogo({ svg }: { svg: string }) {
  const uid = useId().replace(/:/g, '')
  const html = svg.replace(/id="([^"]+)"/g, `id="$1-${uid}"`).replace(/url\(#([^)]+)\)/g, `url(#$1-${uid})`)

  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />
}

export function HojesteretLogo() {
  return <InlineLogo svg={hojesteret} />
}

export function OstreLandsretLogo() {
  return <InlineLogo svg={ostreLandsret} />
}

export function SoHandelsrettenLogo() {
  return <InlineLogo svg={soHandelsretten} />
}
