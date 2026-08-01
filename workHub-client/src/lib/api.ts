import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

// ── Base URL — Vite proxy handles /api → localhost:5210 ────────────
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ── Request interceptor — attach JWT token ─────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor — handle 401, refresh tokens ─────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // ✅ Token expired — try refresh
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          // No refresh token — force logout
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(error)
        }

        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken,
        })

        const newToken = data.data.accessToken
        const newRefresh = data.data.refreshToken

        localStorage.setItem('accessToken', newToken)
        localStorage.setItem('refreshToken', newRefresh)

        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        // Refresh failed — force logout
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    // ── 403 — Permission denied ─────────────────────────────────
    // Don't redirect here — let components handle it
    // The global queryClient error handler will show a toast
    if (error.response?.status === 403) {
      // Fire a custom event that components can listen to
      window.dispatchEvent(new CustomEvent('worksphere:forbidden', {
        detail: { url: original.url }
      }))
    }

    // ── 404 — Not found ─────────────────────────────────────────
    // Silently ignore — components show their own empty states

    return Promise.reject(error)
  }
)

export default api