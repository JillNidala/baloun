import { motion } from 'framer-motion'
import type { ComponentProps } from 'react'

// Feedback immediato al tocco (scala sul press), come le UI native iOS.
export function Pressable(props: ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
      {...props}
    />
  )
}
