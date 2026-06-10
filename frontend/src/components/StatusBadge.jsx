import { motion } from 'framer-motion'

const statusStyles = {
  pending: 'bg-status-pending/15 text-status-pending',
  approved: 'bg-status-approved/15 text-status-approved',
  rejected: 'bg-status-rejected/15 text-status-rejected',
}

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase() || 'pending'
  const style = statusStyles[key] || statusStyles.pending

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${style}`}
    >
      {status || 'Pending'}
    </motion.span>
  )
}
