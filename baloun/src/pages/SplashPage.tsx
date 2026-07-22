import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/Logo'
import { BRAND } from '@/config/limits'
import { useSession } from '@/store/session'
import { PATHS } from '@/routes/paths'
import { spring } from '@/components/motion/springs'

export function SplashPage() {
  const navigate = useNavigate()
  const { user, onboarded } = useSession()

  useEffect(() => {
    const t = setTimeout(() => {
      if (user && onboarded) navigate(PATHS.home, { replace: true })
      else if (user) navigate(PATHS.onboarding, { replace: true })
      else navigate(PATHS.login, { replace: true })
    }, 1700)
    return () => clearTimeout(t)
  }, [navigate, user, onboarded])

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
