import { tagIcon } from '@/features/profile/tagIcons'
import type { Tag } from '@/services/supabase/types'

// Gli interessi come piccole pastiglie con icona.
export function TagChips({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {tags.map((tag) => {
        const Icon = tagIcon(tag.icon)
        return (
          <span
            key={tag.slug}
            className="flex items-center gap-2 rounded-full bg-paper px-3.5 py-2 hairline"
          >
            <Icon size={15} strokeWidth={1.75} className="text-muted" aria-hidden="true" />
            <span className="font-mono text-[12px]">{tag.label}</span>
          </span>
        )
      })}
    </div>
  )
}
