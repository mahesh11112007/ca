import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import AnimatedPage from '../components/AnimatedPage'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function RegisterPage() {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Sender')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await register(username, password, role)
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatedPage>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-apple-light via-white to-apple-light px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <div className="glass rounded-3xl p-8 shadow-xl shadow-black/5 sm:p-10">
            <motion.div variants={itemVariants} className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-apple-dark">
                Create Account
              </h1>
              <p className="text-sm text-apple-dark/50">Join CA Ledger today</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div variants={itemVariants}>
                <label htmlFor="register-username" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-apple-dark/40">
                  Username
                </label>
                <input
                  id="register-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Choose a username"
                  className="w-full rounded-xl border border-apple-mid bg-white/50 px-4 py-3 text-apple-dark placeholder-apple-dark/30 transition-all focus:border-apple-dark/30 focus:ring-2 focus:ring-apple-dark/10"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label htmlFor="register-password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-apple-dark/40">
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                  className="w-full rounded-xl border border-apple-mid bg-white/50 px-4 py-3 text-apple-dark placeholder-apple-dark/30 transition-all focus:border-apple-dark/30 focus:ring-2 focus:ring-apple-dark/10"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-apple-dark/40">
                  Role
                </label>
                <div className="flex gap-3">
                  {['Sender', 'Receiver'].map((r) => (
                    <motion.button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all ${
                        role === r
                          ? 'bg-apple-dark text-white shadow-lg shadow-apple-dark/20'
                          : 'bg-apple-mid/50 text-apple-dark/60 hover:bg-apple-mid'
                      }`}
                    >
                      {r}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="rounded-xl bg-status-rejected/10 px-4 py-3 text-sm text-status-rejected">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl bg-apple-dark py-3.5 text-sm font-semibold text-white transition-colors hover:bg-apple-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      />
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </motion.button>
              </motion.div>
            </form>

            <motion.p variants={itemVariants} className="mt-6 text-center text-sm text-apple-dark/40">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-apple-dark transition-colors hover:text-apple-black">
                Sign in
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  )
}
