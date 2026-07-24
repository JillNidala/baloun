import {
  Dumbbell,
  Music,
  Palette,
  Martini,
  UtensilsCrossed,
  Plane,
  Cpu,
  Clapperboard,
  BookOpen,
  Camera,
  Trees,
  ChefHat,
  PawPrint,
  Shirt,
  Gamepad2,
  Mic,
  Tag as TagIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Il catalogo degli interessi vive nel database; qui c'è solo l'icona.
// Per aggiungerne uno: una riga in interest_tags e una riga qui.
const ICONS: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  music: Music,
  palette: Palette,
  martini: Martini,
  utensils: UtensilsCrossed,
  plane: Plane,
  cpu: Cpu,
  clapper: Clapperboard,
  book: BookOpen,
  camera: Camera,
  tree: Trees,
  chef: ChefHat,
  paw: PawPrint,
  shirt: Shirt,
  gamepad: Gamepad2,
  mic: Mic,
}

export function tagIcon(key: string): LucideIcon {
  return ICONS[key] ?? TagIcon
}
