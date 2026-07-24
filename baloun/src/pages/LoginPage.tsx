import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { signIn, authErrorMessage } from '@/features/auth/api/auth'
import { PATHS } from '@/routes/paths'

const schema = z.object({
  email: z.string().email('Inserisci una email valida'),
  password: z.string().min(6, 'Minimo 6 caratteri'),
})
type Form = z.infer<typeof schema>

export function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  // Il redirect avviene da solo: AuthProvider aggiorna la sessione e le
  // guardie di rotta portano l'utente dove deve andare.
  const onSubmit = async (data: Form) => {
    setServerError(null)
    try {
      await signIn(data.email, data.password)
    } catch (err) {
      setServerError(authErrorMessage(err))
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-10">
      <Logo className="mb-6 h-16 w-auto self-start" />
      <p className="kicker mb-2">Bentornatə</p>
      <h1 className="mb-8 font-display text-4xl font-bold">Entra in BALOUN</h1>

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
            autoComplete="current-password"
            className="rounded-control bg-paper px-4 py-3 hairline outline-none focus:border-ink"
            placeholder="••••••"
            {...register('password')}
          />
          {errors.password && (
            <span className="font-mono text-[12px] text-balloon">{errors.password.message}</span>
          )}
        </label>

        {serverError && <p className="font-mono text-[12px] text-balloon">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? 'Attendi…' : 'Accedi'}
        </Button>
      </form>

      <p className="caption mt-6 text-center">
        Non hai un account?{' '}
        <Link to={PATHS.register} className="text-balloon underline underline-offset-2">
          Registrati
        </Link>
      </p>
    </div>
  )
}
