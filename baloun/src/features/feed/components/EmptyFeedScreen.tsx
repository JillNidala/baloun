import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { PATHS } from '@/routes/paths'

// Schermata di fine sessione. Nessun refresh automatico: la sessione riparte
// quando l'utente riapre l'app.
export function EmptyFeedScreen() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-8 text-center">
      <Logo className="mb-9 h-20 w-auto opacity-90" />

      <h1 className="mb-3 font-display text-[27px] font-bold leading-tight tracking-tight">
        Hai finito i Main disponibili per ora.
      </h1>
      <p className="caption mb-10 max-w-[15rem] leading-relaxed">
        Torna più tardi per nuove selezioni.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button onClick={() => navigate(PATHS.myRoom)}>Controlla la tua stanza</Button>
        <Button variant="secondary" onClick={() => navigate(PATHS.profile)}>
          Vai al tuo profilo
        </Button>
      </div>
    </div>
  )
}
