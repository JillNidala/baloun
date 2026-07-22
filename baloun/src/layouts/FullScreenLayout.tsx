import { Outlet } from 'react-router-dom'

// Guscio immersivo (senza tab bar) per la Room: "sei entrato nella competizione".
export function FullScreenLayout() {
  return (
    <div className="mx-auto min-h-full max-w-md">
      <Outlet />
    </div>
  )
}
