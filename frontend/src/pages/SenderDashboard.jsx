import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import AnimatedPage from '../components/AnimatedPage'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { getTransactions, createTransaction, getQrCode, getDashboardStats } from '../services/api'
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

const TypeBadge = ({ type }) => {
  const styles = {
    Payment: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    Request: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    Debt: 'bg-red-500/10 text-red-600 border border-red-500/20',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[type] || styles.Payment}`}>
      {type === 'Payment' ? 'Sent Payment' : type === 'Request' ? 'Requested' : 'Debt'}
    </span>
  )
}

export default function SenderDashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [type, setType] = useState('Payment')
  const [stats, setStats] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loadingTxns, setLoadingTxns] = useState(true)
  const [qrCode, setQrCode] = useState(null)
  const [upiLink, setUpiLink] = useState('')
  const [loadingQr, setLoadingQr] = useState(true)
  const [qrAmount, setQrAmount] = useState('')
  const [copied, setCopied] = useState(false)

  const extractUpiId = (link) => {
    if (!link) return '8125703790@ybl';
    const match = link.match(/[?&]pa=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : '8125703790@ybl';
  };

  const handleCopyUpi = () => {
    const upiId = extractUpiId(upiLink);
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchTransactions = async () => {
    try {
      const [qrRes, txnRes, statsRes] = await Promise.allSettled([
        getQrCode(),
        getTransactions(),
        getDashboardStats()
      ])

      if (qrRes.status === 'fulfilled') {
        if (qrRes.value.data.qr_code) {
          setQrCode(qrRes.value.data.qr_code)
        }
        if (qrRes.value.data.upi_link) {
          setUpiLink(qrRes.value.data.upi_link)
        }
      }

      if (txnRes.status === 'fulfilled') {
        const txnList = txnRes.value.data?.transactions || []
        const sorted = [...txnList].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
        setTransactions(sorted)
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data)
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
      await createTransaction({
        amount: parseFloat(amount),
        purpose: purpose || undefined,
        type: type
      })
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
          {user ? `${user.username}'s Dashboard` : 'Sender Dashboard'}
        </motion.h2>

        {/* Dynamic Net Ledger Balance Card */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <GlassCard className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white/80 border border-apple-mid text-apple-dark shadow-xl">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-apple-dark/60">
                  Total Ledger Balance
                </p>
                <h3 className="mt-1 text-3xl font-extrabold tracking-tight text-apple-black">
                  {formatCurrency(stats.net_balance)}
                </h3>
              </div>
              <div className="mt-4 sm:mt-0 flex gap-6 text-sm text-apple-dark/80">
                <div>
                  <span className="block text-xs text-apple-dark/50">Total Payments Sent</span>
                  <span className="font-semibold text-apple-black">{formatCurrency(stats.total_payments_approved)}</span>
                </div>
                <div className="border-l border-apple-mid pl-6">
                  <span className="block text-xs text-apple-dark/50">Total Disbursements Received</span>
                  <span className="font-semibold text-apple-black">{formatCurrency(stats.total_requests_approved)}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="flex flex-col items-center text-center shadow-lg shadow-black/5 justify-center py-8 px-6 min-h-[380px]">
              <h3 className="mb-2 text-lg font-semibold text-apple-dark">
                Direct UPI Payment
              </h3>
              <p className="mb-6 text-xs text-apple-dark/40 max-w-xs">
                Enter the amount below and tap the button to pay directly via your installed UPI payment app.
              </p>
              
              <div className="mb-6 w-full max-w-xs">
                <label className="mb-1.5 block text-left text-xs font-semibold uppercase tracking-wider text-apple-dark/50">
                  Payment Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={qrAmount}
                  onChange={(e) => setQrAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-apple-mid bg-white/50 py-3 text-center text-xl font-bold text-apple-dark placeholder-apple-dark/30 transition-all focus:border-apple-dark/30 focus:ring-2 focus:ring-apple-dark/10"
                />
              </div>

              <a
                href={`${upiLink || "upi://pay?pa=8125703790@ybl&pn=Mahesh&cu=INR"}${qrAmount ? `&am=${qrAmount}` : ''}`}
                className="w-full max-w-xs block mb-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="w-full rounded-xl bg-status-approved py-3.5 text-base font-bold text-white shadow-lg shadow-status-approved/20 hover:bg-emerald-600 transition-colors"
                >
                  PAY
                </motion.button>
              </a>

              <div className="w-full max-w-xs border-t border-apple-mid/30 pt-4 flex flex-col items-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-apple-dark/40 mb-2">
                  Or Pay Manually via UPI ID
                </p>
                <div className="flex w-full items-center justify-between gap-2 rounded-xl bg-apple-light p-2 border border-apple-mid/50">
                  <span className="text-xs font-semibold text-apple-dark truncate select-all px-1">
                    {extractUpiId(upiLink)}
                  </span>
                  <button
                    onClick={handleCopyUpi}
                    type="button"
                    className="rounded-lg bg-apple-dark px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-apple-black transition-colors"
                  >
                    {copied ? 'COPIED!' : 'COPY'}
                  </button>
                </div>
                <p className="text-[10px] text-apple-dark/40 mt-2 text-center leading-normal">
                  Note: UPI rules may block browser payments to personal accounts. If PAY fails, copy the UPI ID above and paste it directly into GPay or PhonePe.
                </p>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="shadow-lg shadow-black/5">
              {/* Type Switcher */}
              <div className="mb-6 flex rounded-xl bg-apple-light p-1">
                <button
                  type="button"
                  onClick={() => setType('Payment')}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${type === 'Payment'
                    ? 'bg-white text-apple-dark shadow-sm'
                    : 'text-apple-dark/40 hover:text-apple-dark/60'
                    }`}
                >
                  Notify Payment
                </button>
                <button
                  type="button"
                  onClick={() => setType('Request')}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${type === 'Request'
                    ? 'bg-white text-apple-dark shadow-sm'
                    : 'text-apple-dark/40 hover:text-apple-dark/60'
                    }`}
                >
                  Request Money
                </button>
              </div>

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
                    Justification / Purpose {type === 'Request' && '(Required)'}
                  </label>
                  <input
                    id="payment-purpose"
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required={type === 'Request'}
                    list="purpose-suggestions"
                    placeholder={type === 'Payment' ? 'e.g., GST Filing' : 'e.g., Client Travel Expenses'}
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
                    type === 'Payment' ? 'Submit Payment' : 'Request Money'
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
                    ✓ {type === 'Payment' ? 'Payment notification sent successfully!' : 'Money request sent successfully!'}
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
          <h3 className="mb-4 text-lg font-semibold text-apple-dark">Transaction History</h3>

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
              title="No transactions yet"
              subtitle="Your transaction history will appear here once you submit a payment or request."
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
                        <div className="flex items-center gap-3">
                          <p className="text-xl font-bold text-apple-dark">
                            {formatCurrency(txn.amount)}
                          </p>
                          <TypeBadge type={txn.type} />
                        </div>
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
