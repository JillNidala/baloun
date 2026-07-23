import { useState } from 'react'
import { Eye, Home } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Pressable } from '@/components/motion/Pressable'
import {
  usePromptCatalog,
  useMyPrompts,
  useSavePrompt,
  type MyPrompt,
} from '@/features/profile/api/editor'
import { cn } from '@/lib/cn'

export function PromptEditor({ userId }: { userId: string | undefined }) {
  const { data: catalog } = usePromptCatalog()
  const { data: mine } = useMyPrompts(userId)
  const save = useSavePrompt(userId)

  const [open, setOpen] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const answers = new Map(mine?.map((p) => [p.prompt_id, p]))
  const roomCount = mine?.filter((p) => p.in_room).length ?? 0
  const feedCount = mine?.filter((p) => p.in_feed).length ?? 0

  const startEdit = (id: string) => {
    setOpen(id)
    setDraft(answers.get(id)?.answer ?? '')
  }

  const commit = (id: string) => {
    const existing = answers.get(id)
    save.mutate({
      prompt_id: id,
      answer: draft,
      in_room: existing?.in_room ?? false,
      in_feed: existing?.in_feed ?? false,
    })
    setOpen(null)
  }

  const toggleFlag = (prompt: MyPrompt, field: 'in_room' | 'in_feed') => {
    save.mutate({ ...prompt, [field]: !prompt[field] })
  }

  return (
    <section>
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-bold">Spunti</h2>
        <span className="caption">
          {roomCount}/5 stanza · {feedCount}/2 feed
        </span>
      </div>
      <p className="caption mb-4">
        Rispondi a quelli che vuoi. Poi scegli quali mostrare nella stanza e quali
        nel feed anonimo.
      </p>

      <div className="flex flex-col gap-2.5">
        {catalog?.map((tpl) => {
          const mineOne = answers.get(tpl.id)
          const isEditing = open === tpl.id

          return (
            <Card key={tpl.id} className="p-4">
              <button onClick={() => startEdit(tpl.id)} className="w-full text-left">
                <p className="kicker mb-1.5">{tpl.label}</p>
                <p
                  className={cn(
                    'font-display text-[17px] leading-snug',
                    !mineOne && 'text-muted',
                  )}
                >
                  {mineOne?.answer ?? 'Tocca per rispondere'}
                </p>
              </button>

              {isEditing && (
                <div className="mt-3">
                  <textarea
                    rows={2}
                    maxLength={200}
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="La tua risposta…"
                    className="w-full resize-none rounded-control bg-cream px-3.5 py-2.5 hairline outline-none focus:border-ink"
                  />
                  <div className="mt-2 flex gap-2">
                    <Pressable
                      onClick={() => commit(tpl.id)}
                      className="flex-1 rounded-control bg-ink py-2.5 font-mono text-[12px] text-cream"
                    >
                      Salva
                    </Pressable>
                    <Pressable
                      onClick={() => setOpen(null)}
                      className="rounded-control bg-paper px-4 py-2.5 font-mono text-[12px] hairline"
                    >
                      Annulla
                    </Pressable>
                  </div>
                </div>
              )}

              {mineOne && !isEditing && (
                <div className="mt-3 flex gap-2">
                  <Pressable
                    onClick={() => toggleFlag(mineOne, 'in_room')}
                    disabled={!mineOne.in_room && roomCount >= 5}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em]',
                      mineOne.in_room ? 'bg-ink text-cream' : 'bg-cream text-muted hairline',
                      !mineOne.in_room && roomCount >= 5 && 'opacity-40',
                    )}
                  >
                    <Home size={12} strokeWidth={2} /> Stanza
                  </Pressable>

                  <Pressable
                    onClick={() => toggleFlag(mineOne, 'in_feed')}
                    disabled={!mineOne.in_feed && feedCount >= 2}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em]',
                      mineOne.in_feed ? 'bg-blush text-white' : 'bg-cream text-muted hairline',
                      !mineOne.in_feed && feedCount >= 2 && 'opacity-40',
                    )}
                  >
                    <Eye size={12} strokeWidth={2} /> Feed
                  </Pressable>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {save.isError && (
        <p className="mt-3 font-mono text-[12px] text-balloon">
          Hai raggiunto il massimo consentito.
        </p>
      )}
    </section>
  )
}
