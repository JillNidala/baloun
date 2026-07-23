import type { Prompt, Tag } from '@/services/supabase/types'

// Modello di un "Main" così come viene mostrato nel feed anonimo.
export type Main = {
  id: string
  /** id della stanza: il KEEP entra nella waitlist di questa stanza */
  roomId: string
  name: string
  age: number
  city: string
  /** Foto profilo, mostrata SEMPRE sfocata nel feed. */
  avatarUrl?: string
  /** Colore di riserva quando non c'è foto. */
  avatarHue: string
  /** Massimo 2: quelli che il Main ha scelto di mostrare. */
  tags: Tag[]
  /** Massimo 2. */
  prompts: Prompt[]
}

export type Decision = 'keep' | 'pop'
