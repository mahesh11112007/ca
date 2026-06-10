import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config && error.config.url && error.config.url.includes('/api/auth/login')
      if (!isLoginRequest) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const login = (username, password) =>
  api.post('/api/auth/login', { username, password })

export const register = (username, password, role) =>
  api.post('/api/auth/register', { username, password, role })

export const getMe = () => api.get('/api/auth/me')

export const getTransactions = () => api.get('/api/transactions/')

export const createTransaction = (data) =>
  api.post('/api/transactions/', data)

export const approveTransaction = (id) =>
  api.patch(`/api/transactions/${id}/approve`)

export const rejectTransaction = (id) =>
  api.patch(`/api/transactions/${id}/reject`)

export const getDashboardStats = () => api.get('/api/dashboard/stats')

export const getQrCode = () => api.get('/api/auth/qr')

export const uploadQrCode = (base64Str) => 
  api.put('/api/auth/qr', { qr_code: base64Str })

export const getVapidPublicKey = () => api.get('/api/auth/vapid-public-key')

export const savePushSubscription = (subscription) =>
  api.post('/api/auth/subscribe', { subscription })

export default api
