type Props = { className?: string; title?: string }

// Il palloncino BALOUN: rosso, con l'ago che lo trapassa in NEGATIVO
// (dove passa l'ago si vede lo sfondo). L'id della mask è unico per istanza.
export function Logo({ className, title = 'BALOUN' }: Props) {
  const id = 'pierce-' + Math.random().toString(36).slice(2, 8)
  return (
    <svg viewBox="0 0 120 150" className={className} role="img" aria-label={title}>
      <mask id={id}>
        <rect x="0" y="0" width="120" height="150" fill="white" />
        <circle cx="68" cy="30" r="5.5" fill="black" />
        <path d="M63.5 31 L73 28.5 L49 90 Z" fill="black" />
      </mask>
      <g mask={`url(#${id})`}>
        <ellipse cx="60" cy="52" rx="40" ry="46" fill="#E23744" />
        <path d="M54 95 L66 95 L60 105 Z" fill="#E23744" />
      </g>
      <path
        d="M60 105 C60 116 66 120 62 128 C58 136 62 140 60 146"
        stroke="#E23744"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
