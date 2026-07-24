import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { signUp, signIn, authErrorMessage } from '@/features/auth/api/auth'
import { PATHS } from '@/routes/paths'

const schema = z
  .object({
    email: z.string().email('Inserisci una email valida'),
    password: z.string().min(6, 'Minimo 6 caratteri'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Le password non coincidono',
    path: ['confirm'],
  })
type Form = z.infer<typeof schema>

export function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setServerError(null)
    try {
      await signUp(data.email, data.password)
      // Se la conferma email è disattivata, entriamo subito.
      try {
        await signIn(data.email, data.password)
      } catch {
        setNeedsConfirm(true)
      }
    } catch (err) {
      setServerError(authErrorMessage(err))
    }
  }

  if (needsConfirm)
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center py-10 text-center">
        <Logo className="mx-auto mb-8 h-20 w-auto" />
        <h1 className="mb-3 font-display text-3xl font-bold">Controlla la tua email</h1>
        <p className="caption mb-8">Ti abbiamo inviato un link per confermare l'account.</p>
        <Link to={PATHS.login} className="caption text-balloon underline underline-offset-2">
          Torna al login
        </Link>
      </div>
    )

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-10">
      <Logo className="mb-6 h-16 w-auto self-start" />
      <p className="kicker mb-2">Nuovo qui</p>
      <h1 className="mb-8 font-display text-4xl font-bold">Crea il tuo account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="caption">Email</span>
          <input
            type="email"
            autoComplete="email"
            className="rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
            placeholder="tu@email.com"
            {...register('email')}
          />
          {errors.email && <span className="font-mono text-[12px] text-balloon">{errors.email.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="caption">Password</span>
          <input
            type="password"
            autoComplete="new-password"
            className="rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
            placeholder="••••••"
            {...register('password')}
          />
          {errors.password && (
            <span className="font-mono text-[12px] text-balloon">{errors.password.message}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="caption">Conferma password</span>
          <input
            type="password"
            autoComplete="new-password"
            className="rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
            placeholder="••••••"
            {...register('confirm')}
          />
          {errors.confirm && (
            <span className="font-mono text-[12px] text-balloon">{errors.confirm.message}</span>
          )}
        </label>

        {serverError && <p className="font-mono text-[12px] text-balloon">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? 'Attendi…' : 'Crea account'}
        </Button>
      </form>

      <p className="caption mt-6 text-center">
        Hai già un account?{' '}
        <Link to={PATHS.login} className="text-balloon underline underline-offset-2">
          Accedi
        </Link>
      </p>
    </div>
  )
}
