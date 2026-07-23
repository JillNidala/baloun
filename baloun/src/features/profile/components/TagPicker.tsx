import { Eye } from 'lucide-react'
import { Pressable } from '@/components/motion/Pressable'
import { tagIcon } from '@/features/profile/tagIcons'
import { useTagCatalog, useMyTags, useToggleTag, useToggleTagInFeed } from '@/features/profile/api/editor'
import { cn } from '@/lib/cn'

export function TagPicker({ userId }: { userId: string | undefined }) {
  const { data: catalog } = useTagCatalog()
  const { data: mine } = useMyTags(userId)
  const toggle = useToggleTag(userId)
  const toggleFeed = useToggleTagInFeed(userId)

  const selected = new Map(mine?.map((t) => [t.tag_slug, t.in_feed]))
  const inFeedCount = mine?.filter((t) => t.in_feed).length ?? 0

  return (
    <section>
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-bold">Interessi</h2>
        <span className="caption">{selected.size}/5</span>
      </div>
      <p className="caption mb-4">
        Scegline fino a 5. Tocca l'occhio per decidere i 2 visibili nel feed anonimo.
      </p>

      <div className="flex flex-wrap gap-2">
        {catalog?.map((tag) => {
          const isSelected = selected.has(tag.slug)
          const inFeed = selected.get(tag.slug) ?? false
          const Icon = tagIcon(tag.icon)
          const blocked = !isSelected && selected.size >= 5

          return (
            <div key={tag.slug} className="flex items-stretch">
              <Pressable
                onClick={() => toggle.mutate({ slug: tag.slug, selected: isSelected })}
                disabled={blocked || toggle.isPending}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2.5 font-mono text-[12px] transition-colors',
                  isSelected ? 'bg-ink text-cream' : 'bg-paper text-ink hairline',
                  isSelected ? 'rounded-l-full' : 'rounded-full',
                  blocked && 'opacity-35',
                )}
              >
                <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
                {tag.label}
              </Pressable>

              {isSelected && (
                <Pressable
                  onClick={() => toggleFeed.mutate({ slug: tag.slug, inFeed })}
                  disabled={(!inFeed && inFeedCount >= 2) || toggleFeed.isPending}
                  aria-label={inFeed ? 'Togli dal feed' : 'Mostra nel feed'}
                  className={cn(
                    'flex items-center rounded-r-full border-l border-cream/20 px-3',
                    inFeed ? 'bg-blush text-white' : 'bg-ink text-cream/45',
                    !inFeed && inFeedCount >= 2 && 'opacity-40',
                  )}
                >
                  <Eye size={14} strokeWidth={2} />
                </Pressable>
              )}
            </div>
          )
        })}
      </div>

      {toggle.isError && (
        <p className="mt-3 font-mono text-[12px] text-balloon">
          Hai già raggiunto il massimo.
        </p>
      )}
    </section>
  )
}
