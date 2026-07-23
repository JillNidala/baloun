// Piccola utility per unire classi condizionali senza dipendenze extra.
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
