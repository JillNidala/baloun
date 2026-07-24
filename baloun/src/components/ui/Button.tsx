import type { ComponentProps, ReactNode } from 'react'
import { Pressable } from '@/components/motion/Pressable'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type Props = ComponentProps<typeof Pressable> & {
  variant?: Variant
  children: ReactNode
}

const styles: Record<Variant, string> = {
  primary: 'bg-ink text-cream hover:bg-black',
  secondary: 'bg-paper text-ink hairline',
  ghost: 'bg-transparent text-ink',
  danger: 'bg-balloon text-white hover:bg-balloon-deep',
}

export function Button({ variant = 'primary', className, children, ...props }: Props) {
  return (
    <Pressable
      className={cn(
        'w-full rounded-control px-5 py-3.5 font-mono text-[14px] tracking-wide',
        'disabled:opacity-50 disabled:pointer-events-none transition-colors',
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Pressable>
  )
}
