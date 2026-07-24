import { useRef, useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { Pressable } from '@/components/motion/Pressable'
import {
  useMyPhotos,
  useAddPhoto,
  useRemovePhoto,
  useSetProfilePhoto,
  type PhotoRow,
} from '@/features/profile/api/editor'
import { cn } from '@/lib/cn'

const SLOTS = [0, 1, 2, 3, 4, 5]

type Props = {
  userId: string | undefined
  currentAvatarPath: string | null | undefined
}

export function PhotoGrid({ userId, currentAvatarPath }: Props) {
  const { data: photos } = useMyPhotos(userId)
  const addPhoto = useAddPhoto(userId)
  const removePhoto = useRemovePhoto(userId)
  const setProfile = useSetProfilePhoto(userId)

  const inputRef = useRef<HTMLInputElement>(null)
  const [slot, setSlot] = useState<number | null>(null)

  const pick = (position: number) => {
    setSlot(position)
    inputRef.current?.click()
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && slot !== null) addPhoto.mutate({ file, position: slot })
    e.target.value = ''
  }

  const byPosition = new Map(photos?.map((p) => [p.position, p]))

  return (
    <section>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-2.5">
        {SLOTS.map((position) => {
          const photo = byPosition.get(position)
          const isProfile = Boolean(photo && photo.small_path === currentAvatarPath)

          if (!photo) {
            return (
              <Pressable
                key={position}
                onClick={() => pick(position)}
                disabled={addPhoto.isPending}
                className="flex aspect-[3/4] items-center justify-center rounded-card bg-paper text-muted hairline disabled:opacity-50"
                aria-label={`Aggiungi foto ${position + 1}`}
              >
                <Plus size={20} strokeWidth={1.75} />
              </Pressable>
            )
          }

          return (
            <div
              key={position}
              className={cn(
                'relative aspect-[3/4] overflow-hidden rounded-card bg-blush-soft',
                isProfile ? 'ring-2 ring-balloon' : 'hairline',
              )}
            >
              {photo.url && (
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
              )}

              <button
                onClick={() => removePhoto.mutate(photo as PhotoRow)}
                aria-label="Rimuovi foto"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-cream/90 text-ink backdrop-blur-sm"
              >
                <X size={13} strokeWidth={2.2} />
              </button>

              <button
                onClick={() => setProfile.mutate(photo as PhotoRow)}
                className={cn(
                  'absolute inset-x-1.5 bottom-1.5 flex items-center justify-center gap-1 rounded-full py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] backdrop-blur-sm',
                  isProfile ? 'bg-balloon text-white' : 'bg-cream/90 text-ink',
                )}
              >
                {isProfile ? (
                  <>
                    <Check size={11} strokeWidth={2.5} /> Profilo
                  </>
                ) : (
                  'Usa'
                )}
              </button>
            </div>
          )
        })}
      </div>

      <p className="caption mt-3">
        La foto profilo è quella che appare sfocata nel feed. Le altre si vedono
        quando la stanza si apre.
      </p>
    </section>
  )
}
