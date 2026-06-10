import { motion } from 'framer-motion'

export default function GlassCard({
  children,
  className = '',
  padding = 'p-6',
  hover = false,
  onClick,
  ...props
}) {
  return (
    <motion.div
      className={`glass rounded-2xl ${padding} ${className}`}
      whileHover={hover ? { scale: 1.02, boxShadow: '0 20px 60px rgba(0,0,0,0.08)' } : {}}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  )
}
