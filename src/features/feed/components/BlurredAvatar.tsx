import { cn } from '@/lib/cn'

type Props = {
  src?: string
  hue: string
  /** Intensità della sfocatura in px. Alta di proposito: il volto non si deve capire. */
  blur?: number
  size?: number
  className?: string
}

// Avatar circolare COMPLETAMENTE sfocato: serve solo a incuriosire.
// La sfocatura è applicata a un livello interno più grande del contenitore,
// così i bordi restano netti e il cerchio resta perfetto.
export function BlurredAvatar({ src, hue, blur = 28, size = 168, className }: Props) {
  return (
    <div
      className={cn('relative shrink-0 overflow-hidden rounded-full', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className="absolute -inset-8"
        style={{
          filter: `blur(${blur}px)`,
          background: src
            ? `center/cover no-repeat url(${src})`
            : `radial-gradient(circle at 32% 28%, ${hue} 0%, ${hue} 42%, rgba(255,255,255,0.85) 100%)`,
        }}
      />
      {/* velo leggerissimo per uniformare il contrasto */}
      <div className="absolute inset-0 rounded-full bg-white/5" />
      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/5" />
    </div>
  )
}
