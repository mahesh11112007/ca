import { motion } from 'framer-motion'

const dotVariants = {
  animate: (i) => ({
    y: [0, -12, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 0.1,
      delay: i * 0.15,
      ease: 'easeInOut',
    },
  }),
}

export default function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-apple-light">
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={dotVariants}
            animate="animate"
            className="h-3 w-3 rounded-full bg-apple-dark"
          />
        ))}
      </div>
    </div>
  )
}
