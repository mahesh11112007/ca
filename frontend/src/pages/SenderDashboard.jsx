import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedPage from '../components/AnimatedPage'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { getTransactions, createTransaction, getQrCode } from '../services/api'
import { formatCurrency, formatDate, formatTime } from '../utils/helpers'

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
}

const purposeSuggestions = [
  'Income Tax Filing',
  'GST Filing',
  'Audit Fees',
  'Consultancy',
  'Personal Work',
  'TDS Return',
  'Company Registration',
  'ROC Filing',
]

export default function SenderDashboard() {
  const [transactions, setTransactions] = useState([])
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loadingTxns, setLoadingTxns] = useState(true)
  const [qrCode, setQrCode] = useState(null)
  const [loadingQr, setLoadingQr] = useState(true)

  const fetchTransactions = async () => {
    try {
      const [qrRes, txnRes] = await Promise.allSettled([
        getQrCode(),
        getTransactions()
      ])
      
      if (qrRes.status === 'fulfilled' && qrRes.value.data.qr_code) {
        setQrCode(qrRes.value.data.qr_code)
      }

      if (txnRes.status === 'fulfilled') {
        const txnList = txnRes.value.data?.transactions || []
        const sorted = [...txnList].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
        setTransactions(sorted)
      }
    } catch {
      // silently handle
    } finally {
      setLoadingTxns(false)
      setLoadingQr(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setIsSubmitting(true)
    try {
      await createTransaction({ amount: parseFloat(amount), purpose: purpose || undefined })
      setAmount('')
      setPurpose('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      fetchTransactions()
    } catch {
      // handle error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatedPage className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-2xl font-bold tracking-tight text-apple-dark sm:text-3xl"
        >
          Dashboard
        </motion.h2>

        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="flex flex-col items-center text-center shadow-lg shadow-black/5">
              <h3 className="mb-6 text-lg font-semibold text-apple-dark">
                Payment QR Code
              </h3>
              <div className="mb-6 flex h-56 w-56 items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
                {loadingQr ? (
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="h-2.5 w-2.5 rounded-full bg-apple-dark/30"
                      />
                    ))}
                  </div>
                ) : (
                  <img
                    src={qrCode || "/qr-placeholder.png"}
                    alt="Payment QR Code"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML =
                        '<div class="flex h-full w-full items-center justify-center text-apple-dark/20"><svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>'
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-apple-dark/40">Scan to make payment</p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="shadow-lg shadow-black/5">
              <h3 className="mb-6 text-lg font-semibold text-apple-dark">
                Notify Payment
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="payment-amount" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-apple-dark/40">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-apple-dark/40">
                      ₹
                    </span>
                    <input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full rounded-xl border border-apple-mid bg-white/50 py-3 pl-10 pr-4 text-lg font-medium text-apple-dark placeholder-apple-dark/20 transition-all focus:border-apple-dark/30 focus:ring-2 focus:ring-apple-dark/10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="payment-purpose" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-apple-dark/40">
                    Purpose (Optional)
                  </label>
                  <input
                    id="payment-purpose"
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    list="purpose-suggestions"
                    placeholder="e.g., GST Filing"
                    className="w-full rounded-xl border border-apple-mid bg-white/50 px-4 py-3 text-apple-dark placeholder-apple-dark/20 transition-all focus:border-apple-dark/30 focus:ring-2 focus:ring-apple-dark/10"
                  />
                  <datalist id="purpose-suggestions">
                    {purposeSuggestions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl bg-apple-dark py-3.5 text-sm font-semibold text-white transition-colors hover:bg-apple-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Payment'
                  )}
                </motion.button>
              </form>

              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 rounded-xl bg-status-approved/10 px-4 py-3 text-sm font-medium text-status-approved"
                  >
                    ✓ Payment notification sent successfully!
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-4 text-lg font-semibold text-apple-dark">Payment History</h3>

          {loadingTxns ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="h-2.5 w-2.5 rounded-full bg-apple-dark/30"
                  />
                ))}
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon="💸"
              title="No payments yet"
              subtitle="Your payment history will appear here once you submit a payment notification."
            />
          ) : (
            <div className="grid gap-3">
              {transactions.map((txn, i) => (
                <motion.div
                  key={txn.request_id || i}
                  custom={i}
                  variants={listItemVariants}
                  initial="hidden"
                  animate="visible"
                  layout
                >
                  <GlassCard padding="p-5" className="shadow-sm shadow-black/5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <p className="text-xl font-bold text-apple-dark">
                          {formatCurrency(txn.amount)}
                        </p>
                        {txn.purpose && (
                          <p className="mt-1 text-sm text-apple-dark/50">{txn.purpose}</p>
                        )}
                        <p className="mt-1 text-xs text-apple-dark/30">
                          {formatDate(txn.created_at)} · {formatTime(txn.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={txn.status} />
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatedPage>
  )
}
