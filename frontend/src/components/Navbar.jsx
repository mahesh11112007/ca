import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass sticky top-0 z-50 border-b border-white/20"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight text-apple-dark">
          CA Ledger
        </h1>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm font-medium text-apple-dark">
              {user.username}
            </span>
            <span className="rounded-full bg-apple-dark/10 px-2.5 py-0.5 text-xs font-medium text-apple-dark">
              {user.role}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="rounded-xl bg-apple-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-apple-black"
          >
            Sign Out
          </motion.button>
        </div>
      </div>
    </motion.nav>
  )
}
