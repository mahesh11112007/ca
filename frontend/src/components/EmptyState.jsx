import { motion } from 'framer-motion'

export default function EmptyState({
  icon = '📋',
  title = 'No data yet',
  subtitle = 'Items will appear here once available.',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <span className="mb-4 text-5xl">{icon}</span>
      <h3 className="mb-2 text-lg font-semibold text-apple-dark">{title}</h3>
      <p className="max-w-sm text-sm text-apple-dark/50">{subtitle}</p>
    </motion.div>
  )
}
