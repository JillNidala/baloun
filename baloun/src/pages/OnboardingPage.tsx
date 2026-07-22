import { useNavigate } from 'react-router-dom'
import { Camera, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/store/session'
import { PATHS } from '@/routes/paths'

const INTERESTS = ['Arte', 'Musica', 'Viaggi', 'Cinema', 'Cucina', 'Sport', 'Libri', 'Fotografia']

// STEP 2: struttura visiva dell'onboarding. Lo Step 3 la collega a Supabase
// (upload foto su Storage, insert su profiles + profile_interests).
export function OnboardingPage() {
  const navigate = useNavigate()
  const completeOnboarding = useSession((s) => s.completeOnboarding)

  const finish = () => {
    completeOnboarding()
    navigate(PATHS.home, { replace: true })
  }

  return (
    <div className="flex min-h-full flex-1 flex-col py-10">
      <p className="kicker mb-2">Passo 1 di 1</p>
      <h1 className="mb-8 font-display text-4xl font-bold">Crea il profilo</h1>

      <div className="mb-6 flex gap-3">
        <button className="flex aspect-square w-24 flex-col items-center justify-center gap-1 rounded-card bg-paper text-muted hairline">
          <Camera size={22} strokeWidth={1.75} />
          <span className="font-mono text-[10px]">Foto</span>
        </button>
        <button className="flex aspect-square w-24 flex-col items-center justify-center gap-1 rounded-card bg-paper text-muted hairline">
          <Plus size={22} strokeWidth={1.75} />
          <span className="font-mono text-[10px]">Aggiungi</span>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="caption">Bio</span>
          <textarea
            rows={3}
            maxLength={300}
            className="resize-none rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
            placeholder="Raccontati in due righe…"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="caption">Età</span>
            <input
              type="number"
              inputMode="numeric"
              className="rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
              placeholder="24"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="caption">Città</span>
            <input
              className="rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
              placeholder="Milano"
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="caption">Interessi</span>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                key={i}
                className="rounded-full bg-paper px-3.5 py-1.5 font-mono text-[12px] hairline transition-colors active:bg-blush-soft"
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Button onClick={finish}>Inizia</Button>
      </div>
    </div>
  )
}
