import { Logo } from '@/components/ui/Logo'

export function Loading() {
  return (
    <div className="flex min-h-[70dvh] flex-1 items-center justify-center">
      <Logo className="h-16 w-auto animate-pulse" />
    </div>
  )
}
