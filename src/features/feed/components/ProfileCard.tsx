import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { BlurredAvatar } from './BlurredAvatar'
import { TagChips } from './TagChips'
import { PromptBlock } from './PromptBlock'
import { DecisionButtons } from './DecisionButtons'
import type { Decision, Main } from '@/features/feed/types/main'

type Props = {
  main: Main
  onDecide: (decision: Decision) => void
  disabled?: boolean
  showHint?: boolean
}

// La card è VOLUTAMENTE più alta dello schermo: per arrivare alla decisione
// bisogna scorrere. È questo che trasforma lo swipe compulsivo in lettura.
export function ProfileCard({ main, onDecide, disabled, showHint }: Props) {
  return (
    <article className="flex min-h-[112dvh] flex-col px-6">
      {/* 1 — Avatar sfocato */}
      <div className="flex justify-center pb-9 pt-14">
        <BlurredAvatar src={main.avatarUrl} hue={main.avatarHue} size={172} />
      </div>

      {/* 2 — Nome • Età • Città */}
      <header className="text-center">
        <h2 className="font-display text-[30px] font-bold leading-tight tracking-tight">
          {main.name}
          <span className="mx-2.5 font-normal text-muted">•</span>
          <span className="font-normal">{main.age}</span>
          <span className="mx-2.5 font-normal text-muted">•</span>
          <span className="font-normal">{main.city}</span>
        </h2>
      </header>

      {/* Suggerimento di scorrimento (sparisce appena si scorre) */}
      <motion.div
        animate={{ opacity: showHint ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-center pt-8"
        aria-hidden="true"
      >
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="text-muted"
        >
          <ChevronDown size={20} strokeWidth={1.5} />
        </motion.span>
      </motion.div>

      {/* 3 — Interessi (massimo 2) */}
      <div className="mx-auto mt-9 w-full max-w-sm">
        <TagChips tags={main.tags} />
      </div>

      {/* 4 — Spunti (massimo 2) */}
      <div className="mx-auto mt-4 w-full max-w-sm divide-y divide-hairline">
        {main.prompts.map((prompt) => (
          <PromptBlock key={prompt.id} prompt={prompt} />
        ))}
      </div>

      {/* Spazio bianco: allontana la decisione, dà tempo di leggere */}
      <div className="min-h-[18dvh] flex-1" />

      {/* 5 — Decisione */}
      <div className="safe-bottom mx-auto w-full max-w-sm pb-4">
        <DecisionButtons onDecide={onDecide} disabled={disabled} />
      </div>
    </article>
  )
}
