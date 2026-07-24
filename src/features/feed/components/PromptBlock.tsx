import type { Prompt } from '@/services/supabase/types'

// Uno spunto: la domanda in piccolo, la risposta in evidenza.
export function PromptBlock({ prompt }: { prompt: Prompt }) {
  return (
    <div className="py-6">
      <p className="kicker mb-2.5">{prompt.label}</p>
      <p className="font-display text-[21px] leading-snug">{prompt.answer}</p>
    </div>
  )
}
