import { Outlet } from 'react-router-dom'
import { TabBar } from '@/components/layout/TabBar'

// Guscio con tab bar per le schermate principali.
export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <main className="safe-top flex-1 px-5 pb-28">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
