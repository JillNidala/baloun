type Props = { className?: string; title?: string }

// Il palloncino SENZA filo: serve nei pulsanti, dove deve avere
// la stessa dimensione visiva del cuore.
export function BalloonIcon({ className, title = 'Palloncino' }: Props) {
  const id = 'pierce-btn-' + Math.random().toString(36).slice(2, 8)
  return (
    <svg viewBox="0 0 100 112" className={className} role="img" aria-label={title}>
      <mask id={id}>
        <rect x="0" y="0" width="100" height="112" fill="white" />
        <circle cx="65" cy="18" r="5" fill="black" />
        <path d="M60.5 19 L70 16.5 L40 84 Z" fill="black" />
      </mask>
      <g mask={`url(#${id})`}>
        <ellipse cx="50" cy="46" rx="44" ry="46" fill="#E23744" />
        <path d="M43 92 L57 92 L50 104 Z" fill="#E23744" />
      </g>
    </svg>
  )
}
