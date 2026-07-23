import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/store/session'
import { saveProfile } from '@/features/profile/api/profile'
import { uploadAvatar } from '@/services/storage/avatar'

const schema = z.object({
  displayName: z.string().min(2, 'Almeno 2 caratteri').max(30, 'Massimo 30 caratteri'),
  birthDate: z.string().refine((v) => {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return false
    const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000)
    return age >= 18 && age < 120
  }, 'Devi avere almeno 18 anni'),
  city: z.string().min(2, 'Inserisci la tua città'),
  bio: z.string().max(300, 'Massimo 300 caratteri').optional(),
  song: z.string().min(1, 'Scrivi la tua canzone preferita').max(80),
  food: z.string().min(1, 'Scrivi il tuo cibo preferito').max(80),
})
type Form = z.infer<typeof schema>

export function OnboardingPage() {
  const session = useSession((s) => s.session)
  const setProfile = useSession((s) => s.setProfile)
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const onSubmit = async (data: Form) => {
    const userId = session?.user.id
    if (!userId) return
    setServerError(null)
    try {
      const avatar = file ? await uploadAvatar(userId, file) : undefined
      const profile = await saveProfile(userId, {
        displayName: data.displayName,
        birthDate: data.birthDate,
        city: data.city,
        bio: data.bio,
        avatarPath: avatar?.small,
        avatarFullPath: avatar?.full,
        interests: [
          { kind: 'music', value: data.song },
          { kind: 'food', value: data.food },
        ],
      })
      setProfile(profile) // le guardie di rotta portano alla Home
    } catch {
      setServerError('Non sono riuscito a salvare il profilo. Riprova.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-full flex-1 flex-col py-10">
      <p className="kicker mb-2">Ultimo passo</p>
      <h1 className="mb-8 font-display text-4xl font-bold">Crea il profilo</h1>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mb-8 flex items-center gap-4 self-start"
      >
        <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-paper hairline">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera size={22} strokeWidth={1.5} className="text-muted" />
          )}
        </span>
        <span className="caption">{preview ? 'Cambia foto' : 'Aggiungi una foto'}</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" />

      <div className="flex flex-col gap-4">
        <Field label="Nome" error={errors.displayName?.message}>
          <input
            className="w-full rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
            placeholder="Giulia"
            {...register('displayName')}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data di nascita" error={errors.birthDate?.message}>
            <input
              type="date"
              className="w-full rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
              {...register('birthDate')}
            />
          </Field>
          <Field label="Città" error={errors.city?.message}>
            <input
              className="w-full rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
              placeholder="Milano"
              {...register('city')}
            />
          </Field>
        </div>

        <Field label="Canzone preferita" error={errors.song?.message}>
          <input
            className="w-full rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
            placeholder="After Hours — The Weeknd"
            {...register('song')}
          />
        </Field>

        <Field label="Cibo preferito" error={errors.food?.message}>
          <input
            className="w-full rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
            placeholder="Sushi"
            {...register('food')}
          />
        </Field>

        <Field label="Bio (facoltativa)" error={errors.bio?.message}>
          <textarea
            rows={3}
            className="w-full resize-none rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
            placeholder="Raccontati in due righe…"
            {...register('bio')}
          />
        </Field>
      </div>

      {serverError && <p className="mt-4 font-mono text-[12px] text-balloon">{serverError}</p>}

      <div className="mt-auto pt-8">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvo…' : 'Inizia'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="caption">{label}</span>
      {children}
      {error && <span className="font-mono text-[12px] text-balloon">{error}</span>}
    </label>
  )
}
