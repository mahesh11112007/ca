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

const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 },
  },
}

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || 'Invalid credentials. Please try again.'
      setError(message)
      setShake(true)
      setTimeout(() => setShake(false), 600)
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
          <motion.div
            variants={shakeVariants}
            animate={shake ? 'shake' : ''}
            className="glass rounded-3xl p-8 shadow-xl shadow-black/5 sm:p-10"
          >
            <motion.div variants={itemVariants} className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-apple-dark">
                CA Ledger
              </h1>
              <p className="text-sm text-apple-dark/50">Sign in to your account</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div variants={itemVariants}>
                <label htmlFor="login-username" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-apple-dark/40">
                  Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  className="w-full rounded-xl border border-apple-mid bg-white/50 px-4 py-3 text-apple-dark placeholder-apple-dark/30 transition-all focus:border-apple-dark/30 focus:ring-2 focus:ring-apple-dark/10"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-apple-dark/40">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-apple-mid bg-white/50 px-4 py-3 text-apple-dark placeholder-apple-dark/30 transition-all focus:border-apple-dark/30 focus:ring-2 focus:ring-apple-dark/10"
                />
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
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>
              </motion.div>
            </form>


          </motion.div>
        </motion.div>
      </div>
    </AnimatedPage>
  )
}
