// Modello di un "Main" così come viene mostrato nel feed.
// NOTA: `interests` è una LISTA, non due campi fissi: per aggiungere in futuro
// altri elementi (film, viaggio, canzone del cuore…) basta aggiungere una voce,
// senza toccare la UI.
export type InterestKind = 'music' | 'food' | 'movie' | 'travel' | 'book'

export type Interest = {
  kind: InterestKind
  /** Testo mostrato, es. "After Hours — The Weeknd" */
  value: string
}

export type Main = {
  id: string
  /** id della stanza del Main: il KEEP entra nella waitlist di questa stanza */
  roomId: string
  name: string
  age: number
  city: string
  /** Foto profilo. Nel feed viene SEMPRE mostrata sfocata. */
  avatarUrl?: string
  /** Colore di fallback quando non c'è foto (resta comunque sfocato). */
  avatarHue: string
  interests: Interest[]
}

export type Decision = 'keep' | 'pop'
