import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/Logo'
import { BRAND } from '@/config/limits'
import { useSession } from '@/store/session'
import { PATHS } from '@/routes/paths'
import { spring } from '@/components/motion/springs'

export function SplashPage() {
  const session = useSession((s) => s.session)
  const profile = useSession((s) => s.profile)
  const [minTimePassed, setMinTimePassed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 1400)
    return () => clearTimeout(t)
  }, [])

  const ready = minTimePassed && session !== undefined
  if (ready) {
    if (session === null) return <Navigate to={PATHS.login} replace />
    if (profile?.onboarded) return <Navigate to={PATHS.home} replace />
    if (profile) return <Navigate to={PATHS.onboarding} replace />
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6">
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={spring}
      >
        <Logo className="h-32 w-auto" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="font-display text-5xl font-black tracking-tight"
      >
        BALOUN
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="caption text-center"
      >
        {BRAND.tagline}
      </motion.p>
    </div>
  )
}
