import { Logo } from '@/components/ui/Logo'

// Mostrata se mancano le variabili d'ambiente: meglio di una pagina bianca.
export function ConfigNeeded() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-8 text-center safe-top safe-bottom">
      <Logo className="mb-8 h-20 w-auto" />
      <h1 className="mb-3 font-display text-2xl font-bold">Manca la configurazione</h1>
      <p className="caption leading-relaxed">
        Le variabili VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY non sono impostate.
        Aggiungile su Netlify e rilancia il deploy.
      </p>
    </div>
  )
}
