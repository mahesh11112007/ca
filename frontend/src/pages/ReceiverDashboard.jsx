import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedPage from '../components/AnimatedPage'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { getTransactions, approveTransaction, rejectTransaction, getDashboardStats, uploadQrCode } from '../services/api'
import { formatCurrency, formatDate, formatTime, truncateText } from '../utils/helpers'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

function AnimatedNumber({ value, isCurrency = false }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (typeof value !== 'number') return
    const duration = 800
    const steps = 30
    const increment = value / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(value, Math.round(increment * step))
      setDisplay(current)
      if (step >= steps) {
        setDisplay(value)
        clearInterval(timer)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <span>
      {isCurrency ? formatCurrency(display) : display.toLocaleString('en-IN')}
    </span>
  )
}

export default function ReceiverDashboard() {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
  })
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loadingTxns, setLoadingTxns] = useState(true)
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [uploadingQr, setUploadingQr] = useState(false)

  const handleQrUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingQr(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        await uploadQrCode(reader.result)
        alert('QR Code updated successfully!')
      } catch (err) {
        alert('Failed to update QR code')
      } finally {
        setUploadingQr(false)
        e.target.value = null // reset
      }
    }
    reader.readAsDataURL(file)
  }

  const fetchData = useCallback(async () => {
    try {
      const [txnRes, statsRes] = await Promise.allSettled([
        getTransactions(),
        getDashboardStats(),
      ])

      if (txnRes.status === 'fulfilled') {
        const txnList = txnRes.value.data?.transactions || []
        const sorted = [...txnList].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
        setTransactions(sorted)

        if (statsRes.status === 'fulfilled') {
          const sData = statsRes.value.data
          setStats({
            total: sData.total_requests || 0,
            pending: sData.pending_requests || 0,
            approved: sData.approved_requests || 0,
            rejected: sData.rejected_requests || 0,
            totalAmount: sData.total_amount_approved || 0,
          })
        } else {
          const all = sorted
          setStats({
            total: all.length,
            pending: all.filter((t) => t.status?.toLowerCase() === 'pending').length,
            approved: all.filter((t) => t.status?.toLowerCase() === 'approved').length,
            rejected: all.filter((t) => t.status?.toLowerCase() === 'rejected').length,
            totalAmount: all
              .filter((t) => t.status?.toLowerCase() === 'approved')
              .reduce((sum, t) => sum + (t.amount || 0), 0),
          })
        }
      }
    } catch {
      // silently handle
    } finally {
      setLoadingTxns(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const filteredTransactions = useMemo(() => {
    let result = transactions

    if (filter !== 'All') {
      result = result.filter(
        (t) => t.status?.toLowerCase() === filter.toLowerCase()
      )
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (t) =>
          t.sender_username?.toLowerCase().includes(q) ||
          t.username?.toLowerCase().includes(q) ||
          t.purpose?.toLowerCase().includes(q) ||
          String(t.amount).includes(q) ||
          t.request_id?.toLowerCase().includes(q)
      )
    }

    return result
  }, [transactions, filter, debouncedSearch])

  const handleAction = async (id, action) => {
    setActionLoading(id)
    try {
      if (action === 'approve') {
        await approveTransaction(id)
      } else {
        await rejectTransaction(id)
      }
      await fetchData()
    } catch {
      // handle error
    } finally {
      setActionLoading(null)
      setConfirmAction(null)
    }
  }

  const statCards = [
    { label: 'Total Requests', value: stats.total, color: 'text-apple-dark' },
    { label: 'Pending', value: stats.pending, color: 'text-status-pending' },
    { label: 'Approved', value: stats.approved, color: 'text-status-approved' },
    { label: 'Rejected', value: stats.rejected, color: 'text-status-rejected' },
    { label: 'Total Approved', value: stats.totalAmount, isCurrency: true, color: 'text-status-approved' },
  ]

  const filters = ['All', 'Pending', 'Approved', 'Rejected']

  return (
    <AnimatedPage className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-2xl font-bold tracking-tight text-apple-dark sm:text-3xl"
        >
          Management Console
        </motion.h2>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <GlassCard className="shadow-md shadow-black/5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-apple-dark/40">
                  {card.label}
                </p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.isCurrency ? (
                    <AnimatedNumber value={card.value} isCurrency={true} />
                  ) : (
                    <AnimatedNumber value={card.value} />
                  )}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {/* Settings / QR Card (Col span 1) */}
          <GlassCard padding="p-4" className="shadow-sm shadow-black/5 flex flex-col justify-center">
            <h3 className="mb-3 text-sm font-bold text-apple-dark">Payment Settings</h3>
            <label className="relative flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-apple-mid bg-white/30 py-3 text-sm font-medium text-apple-dark transition-colors hover:bg-white/50">
              {uploadingQr ? 'Uploading...' : 'Upload New QR Code'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleQrUpload} 
                disabled={uploadingQr}
                className="hidden" 
              />
            </label>
          </GlassCard>

          {/* Search & Filters (Col span 2) */}
          <GlassCard padding="p-4" className="flex flex-col justify-center shadow-sm shadow-black/5 lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-apple-dark/30"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  id="search-transactions"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by client, purpose, amount..."
                  className="w-full rounded-xl border border-apple-mid/50 bg-white/50 py-2.5 pl-10 pr-4 text-sm text-apple-dark placeholder-apple-dark/30 transition-all focus:border-apple-dark/30 focus:ring-2 focus:ring-apple-dark/10"
                />
              </div>

              <div className="flex gap-2">
                {filters.map((f) => (
                  <motion.button
                    key={f}
                    onClick={() => setFilter(f)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      filter === f
                        ? 'bg-apple-dark text-white shadow-md shadow-apple-dark/20'
                        : 'bg-apple-mid/40 text-apple-dark/60 hover:bg-apple-mid/70'
                    }`}
                  >
                    {f}
                  </motion.button>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
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
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              icon="📊"
              title="No transactions found"
              subtitle={
                search || filter !== 'All'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Transaction requests will appear here.'
              }
            />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl lg:block">
                <GlassCard padding="p-0" className="shadow-md shadow-black/5">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-apple-mid/30">
                        {['Request ID', 'Client', 'Amount', 'Purpose', 'Date', 'Time', 'Status', 'Actions'].map(
                          (header) => (
                            <th
                              key={header}
                              className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-apple-dark/40"
                            >
                              {header}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredTransactions.map((txn, i) => (
                          <motion.tr
                            key={txn.request_id || i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            layout
                            className="border-b border-apple-mid/10 transition-colors hover:bg-white/40"
                          >
                            <td className="px-5 py-4 font-mono text-xs text-apple-dark/40">
                              {truncateText(txn.request_id || '-', 8)}
                            </td>
                            <td className="px-5 py-4 text-sm font-medium text-apple-dark">
                              {txn.sender_username || txn.username || '-'}
                            </td>
                            <td className="px-5 py-4 text-sm font-bold text-apple-dark">
                              {formatCurrency(txn.amount)}
                            </td>
                            <td className="px-5 py-4 text-sm text-apple-dark/60">
                              {txn.purpose || '—'}
                            </td>
                            <td className="px-5 py-4 text-sm text-apple-dark/50">
                              {formatDate(txn.created_at)}
                            </td>
                            <td className="px-5 py-4 text-sm text-apple-dark/50">
                              {formatTime(txn.created_at)}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={txn.status} />
                            </td>
                            <td className="px-5 py-4">
                              {txn.status?.toLowerCase() === 'pending' && (
                                <div className="flex gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      setConfirmAction({
                                        id: txn.request_id,
                                        action: 'approve',
                                        client: txn.sender_username || txn.username,
                                        amount: txn.amount,
                                      })
                                    }
                                    disabled={actionLoading === txn.request_id}
                                    className="rounded-full bg-status-approved/15 px-3.5 py-1.5 text-xs font-semibold text-status-approved transition-colors hover:bg-status-approved/25 disabled:opacity-50"
                                  >
                                    Approve
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      setConfirmAction({
                                        id: txn.request_id,
                                        action: 'reject',
                                        client: txn.sender_username || txn.username,
                                        amount: txn.amount,
                                      })
                                    }
                                    disabled={actionLoading === txn.request_id}
                                    className="rounded-full bg-status-rejected/15 px-3.5 py-1.5 text-xs font-semibold text-status-rejected transition-colors hover:bg-status-rejected/25 disabled:opacity-50"
                                  >
                                    Reject
                                  </motion.button>
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </GlassCard>
              </div>

              <div className="grid gap-3 lg:hidden">
                {filteredTransactions.map((txn, i) => (
                  <motion.div
                    key={txn.request_id || i}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    layout
                  >
                    <GlassCard padding="p-5" className="shadow-sm shadow-black/5">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-apple-dark">
                            {txn.sender_username || txn.username || '-'}
                          </p>
                          <p className="font-mono text-xs text-apple-dark/30">
                            {truncateText(txn.request_id || '', 8)}
                          </p>
                        </div>
                        <StatusBadge status={txn.status} />
                      </div>

                      <p className="mb-1 text-xl font-bold text-apple-dark">
                        {formatCurrency(txn.amount)}
                      </p>
                      {txn.purpose && (
                        <p className="mb-2 text-sm text-apple-dark/50">{txn.purpose}</p>
                      )}
                      <p className="text-xs text-apple-dark/30">
                        {formatDate(txn.created_at)} · {formatTime(txn.created_at)}
                      </p>

                      {txn.status?.toLowerCase() === 'pending' && (
                        <div className="mt-4 flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              setConfirmAction({
                                id: txn.request_id,
                                action: 'approve',
                                client: txn.sender_username || txn.username,
                                amount: txn.amount,
                              })
                            }
                            className="flex-1 rounded-xl bg-status-approved/15 py-2.5 text-xs font-semibold text-status-approved"
                          >
                            Approve
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              setConfirmAction({
                                id: txn.request_id,
                                action: 'reject',
                                client: txn.sender_username || txn.username,
                                amount: txn.amount,
                              })
                            }
                            className="flex-1 rounded-xl bg-status-rejected/15 py-2.5 text-xs font-semibold text-status-rejected"
                          >
                            Reject
                          </motion.button>
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        <AnimatePresence>
          {confirmAction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
              onClick={() => setConfirmAction(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="glass w-full max-w-sm rounded-3xl p-8 shadow-2xl"
              >
                <h3 className="mb-2 text-lg font-bold text-apple-dark">
                  {confirmAction.action === 'approve' ? 'Approve' : 'Reject'} Payment?
                </h3>
                <p className="mb-6 text-sm text-apple-dark/50">
                  {confirmAction.action === 'approve'
                    ? `Approve ${formatCurrency(confirmAction.amount)} from ${confirmAction.client}?`
                    : `Reject ${formatCurrency(confirmAction.amount)} from ${confirmAction.client}?`}
                </p>
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 rounded-xl bg-apple-mid/50 py-3 text-sm font-medium text-apple-dark"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction(confirmAction.id, confirmAction.action)}
                    disabled={actionLoading}
                    className={`flex-1 rounded-xl py-3 text-sm font-semibold text-white ${
                      confirmAction.action === 'approve'
                        ? 'bg-status-approved'
                        : 'bg-status-rejected'
                    } disabled:opacity-50`}
                  >
                    {actionLoading ? 'Processing...' : confirmAction.action === 'approve' ? 'Approve' : 'Reject'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  )
}
