import { Outlet } from 'react-router-dom'
import { TabBar } from '@/components/layout/TabBar'

// Guscio con tab bar. Nessun padding orizzontale: lo decide ogni pagina,
// così il feed può usare tutta la larghezza.
export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
