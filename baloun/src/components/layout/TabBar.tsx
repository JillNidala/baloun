import { NavLink } from 'react-router-dom'
import { Home, Radio, User } from 'lucide-react'
import { PATHS } from '@/routes/paths'
import { cn } from '@/lib/cn'

const tabs = [
  { to: PATHS.home, label: 'Home', icon: Home },
  { to: PATHS.myRoom, label: 'La mia stanza', icon: Radio },
  { to: PATHS.profile, label: 'Profilo', icon: User },
]

export function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-cream/80 backdrop-blur-xl"
      style={{ paddingBottom: 'max(0.5rem, var(--safe-bottom))' }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-1.5 transition-colors',
                  isActive ? 'text-balloon' : 'text-muted',
                )
              }
            >
              <Icon size={22} strokeWidth={1.75} />
              <span className="font-mono text-[10px] tracking-wide">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
