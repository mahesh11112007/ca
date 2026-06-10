import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import ProtectedRoute from '../components/ProtectedRoute'
import LoadingSpinner from '../components/LoadingSpinner'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import SenderDashboard from '../pages/SenderDashboard'
import ReceiverDashboard from '../pages/ReceiverDashboard'

function AuthRedirect({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (user) {
    const path = user.role === 'Receiver' ? '/receiver' : '/sender'
    return <Navigate to={path} replace />
  }

  return children
}

export default function AppRouter() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <>
      {user && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            path="/login"
            element={
              <AuthRedirect>
                <LoginPage />
              </AuthRedirect>
            }
          />

          <Route
            path="/register"
            element={
              <AuthRedirect>
                <RegisterPage />
              </AuthRedirect>
            }
          />

          <Route
            path="/sender"
            element={
              <ProtectedRoute role="Sender">
                <SenderDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receiver"
            element={
              <ProtectedRoute role="Receiver">
                <ReceiverDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
