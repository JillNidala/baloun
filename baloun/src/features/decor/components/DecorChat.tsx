import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, Shirt, PaintRoller, Armchair, RotateCcw } from 'lucide-react'
import { Pressable } from '@/components/motion/Pressable'
import {
  useGenerateDecor,
  useResetDecor,
  verificaDecor,
  type DecorKind,
} from '@/features/decor/api/decor'
import { cn } from '@/lib/cn'

const KINDS: { id: DecorKind; label: string; icon: typeof Shirt; hint: string }[] = [
  { id: 'wall', label: 'Muro', icon: PaintRoller, hint: 'carta da parati blu con piccoli quadri' },
  { id: 'decoration', label: 'Arredo', icon: Armchair, hint: 'una pianta alta in un vaso di terracotta' },
  { id: 'outfit', label: 'Vestito', icon: Shirt, hint: 'una giacca di jeans e sciarpa rossa' },
]

type Props = { roomId: string }

/**
 * La chat che personalizza la stanza. Si può cambiare solo il muro,
 * l'abito dell'omino e tre arredi sul pavimento: tenda e parquet restano.
 */
export function DecorChat({ roomId }: Props) {
  const [kind, setKind] = useState<DecorKind>('wall')
  const [slot, setSlot] = useState(0)
  const [text, setText] = useState('')
  const generate = useGenerateDecor()
  const [diagnosi, setDiagnosi] = useState<string | null>(null)
  const reset = useResetDecor()

  const current = KINDS.find((k) => k.id === kind)!

  const submit = () => {
    const prompt = text.trim()
    if (!prompt || generate.isPending) return
    generate.mutate(
      { kind, prompt, slot: kind === 'decoration' ? slot : undefined },
      { onSuccess: () => setText('') },
    )
  }

  return (
    <section className="rounded-card bg-paper p-4 hairline">
      <div className="mb-3 flex items-center gap-2">
        <Wand2 size={16} strokeWidth={1.75} className="text-blush" />
        <p className="kicker">Personalizza la stanza</p>
      </div>

      {/* Cosa si cambia */}
      <div className="mb-3 flex gap-2">
        {KINDS.map(({ id, label, icon: Icon }) => (
          <Pressable
            key={id}
            onClick={() => setKind(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 font-mono text-[11px] uppercase tracking-[0.1em]',
              kind === id ? 'bg-ink text-cream' : 'bg-cream text-muted hairline',
            )}
          >
            <Icon size={13} strokeWidth={2} />
            {label}
          </Pressable>
        ))}
      </div>

      {/* Quale delle tre posizioni sul pavimento */}
      {kind === 'decoration' && (
        <div className="mb-3 flex items-center gap-2">
          <span className="caption">Posizione</span>
          {[0, 1, 2].map((s) => (
            <Pressable
              key={s}
              onClick={() => setSlot(s)}
              className={cn(
                'h-7 w-7 rounded-full font-mono text-[11px]',
                slot === s ? 'bg-blush text-white' : 'bg-cream text-muted hairline',
              )}
            >
              {s + 1}
            </Pressable>
          ))}
        </div>
      )}

      <textarea
        rows={2}
        maxLength={120}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={`Es. ${current.hint}`}
        className="w-full resize-none rounded-control bg-cream px-3.5 py-2.5 hairline outline-none focus:border-ink"
      />

      <div className="mt-2 flex items-center gap-2">
        <Pressable
          onClick={submit}
          disabled={!text.trim() || generate.isPending}
          className="flex-1 rounded-control bg-ink py-2.5 font-mono text-[12px] text-cream disabled:opacity-40"
        >
          {generate.isPending ? 'Sto generando…' : 'Genera'}
        </Pressable>

        <Pressable
          onClick={() => reset.mutate({ roomId, what: 'all' })}
          disabled={reset.isPending}
          aria-label="Rimetti com'era"
          className="flex h-10 w-10 items-center justify-center rounded-control bg-cream text-muted hairline"
        >
          <RotateCcw size={15} strokeWidth={2} />
        </Pressable>
      </div>

      <AnimatePresence>
        {generate.isError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 font-mono text-[12px] text-balloon"
          >
            {(generate.error as Error).message}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        onClick={async () => setDiagnosi(await verificaDecor())}
        className="caption mt-3 underline underline-offset-4"
      >
        Verifica il collegamento
      </button>
      {diagnosi && <p className="caption mt-1.5 leading-relaxed">{diagnosi}</p>}

      <p className="caption mt-3 leading-relaxed">
        Tenda e pavimento restano sempre gli stessi. Gli arredi vanno al centro
        della stanza, così non coprono te né i palloncini.
      </p>
    </section>
  )
}
