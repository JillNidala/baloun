import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { router } from '@/routes/router'
import { isSupabaseConfigured } from '@/services/supabase/client'
import { ConfigNeeded } from '@/components/feedback/ConfigNeeded'

export function App() {
  if (!isSupabaseConfigured) return <ConfigNeeded />

  return (
    <AppProviders>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AppProviders>
  )
}
