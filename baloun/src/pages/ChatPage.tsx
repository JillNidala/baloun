import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ArrowUp } from 'lucide-react'
import { useMessages, useSendMessage, useMessagesRealtime } from '@/features/chat/api/chat'
import { useMyMatches } from '@/features/match/api/match'
import { useSession } from '@/store/session'
import { Pressable } from '@/components/motion/Pressable'
import { PATHS } from '@/routes/paths'
import { cn } from '@/lib/cn'

export function ChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const myId = useSession((s) => s.session?.user.id)

  const { data: messages, isLoading } = useMessages(id)
  const { data: matches } = useMyMatches()
  const send = useSendMessage(id)
  useMessagesRealtime(id)

  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const match = matches?.find((m) => m.match_id === id)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const submit = () => {
    const body = text.trim()
    if (!body || send.isPending) return
    setText('')
    send.mutate(body)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="safe-top sticky top-0 z-20 flex items-center gap-3 border-b border-hairline bg-cream/85 px-4 pb-3 backdrop-blur-xl">
        <button onClick={() => navigate(PATHS.matches)} aria-label="Indietro">
          <ChevronLeft size={22} strokeWidth={1.75} className="text-muted" />
        </button>
        <div className="h-9 w-9 overflow-hidden rounded-full bg-blush-soft">
          {match?.photoUrl && (
            <img src={match.photoUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <p className="font-display text-[19px]">{match?.other_name ?? 'Chat'}</p>
      </header>

      <div className="flex-1 px-4 py-5">
        {isLoading && <p className="caption text-center">Carico…</p>}

        {!isLoading && (messages?.length ?? 0) === 0 && (
          <p className="caption py-10 text-center">
            Nessun messaggio. Scrivi tu per primə.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {messages?.map((m) => {
            const mine = m.sender_id === myId
            return (
              <div
                key={m.id}
                className={cn(
                  'max-w-[78%] rounded-card px-4 py-2.5',
                  mine
                    ? 'self-end bg-ink text-cream'
                    : 'self-start bg-paper text-ink hairline',
                )}
              >
                <p className="font-body text-[15px] leading-relaxed">{m.body}</p>
              </div>
            )
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="safe-bottom sticky bottom-0 flex items-end gap-2 border-t border-hairline bg-cream/85 px-4 pt-3 backdrop-blur-xl">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Scrivi un messaggio"
          className="max-h-32 flex-1 resize-none rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
        />
        <Pressable
          onClick={submit}
          disabled={!text.trim() || send.isPending}
          aria-label="Invia"
          className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-cream disabled:opacity-40"
        >
          <ArrowUp size={19} strokeWidth={2} />
        </Pressable>
      </div>
    </div>
  )
}
