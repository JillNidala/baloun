import { useEffect, type ReactNode } from 'react'
import { supabase } from '@/services/supabase/client'
import { useSession } from '@/store/session'
import { fetchMyProfile } from '@/features/profile/api/profile'

// Tiene allineata la sessione Supabase con lo store, e carica il profilo.
export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSession, setProfile } = useSession()

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setProfile(null)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [setSession, setProfile])

  const session = useSession((s) => s.session)

  // Carica il profilo dell'utente collegato.
  useEffect(() => {
    if (!session) return
    let active = true
    fetchMyProfile()
      .then((p) => active && setProfile(p))
      .catch(() => active && setProfile(null))
    return () => {
      active = false
    }
  }, [session, setProfile])

  return <>{children}</>
}
