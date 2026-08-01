import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { classifyError } from './errors'
import { showErrorToast, dismissOfflineToast } from './toastManager'

// ── Axios instance ─────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,                    // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Track if refresh is in progress ───────────────────────────────
let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject:  (err: unknown)  => void
}> = []

// Process all queued requests with new token
function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  refreshQueue = []
}

// ── Request interceptor ────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach JWT from Zustand persisted state
    const stored = localStorage.getItem('worksphere-auth')
    if (stored) {
      try {
        const state      = JSON.parse(stored)?.state
        const token      = state?.accessToken
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch {
        // Corrupted storage — ignore
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ───────────────────────────────────────────
api.interceptors.response.use(
  // ── Success ──────────────────────────────────────────────────────
  (response) => {
    // If we were offline and got a successful response → dismiss toast
    dismissOfflineToast()
    return response
  },

  // ── Error ────────────────────────────────────────────────────────
  async (error: AxiosError) => {
    const status = error.response?.status
    const config = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // ── 401 — Try token refresh ───────────────────────────────────
    if (status === 401 && !config._retry) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          config.headers.Authorization = `Bearer ${token}`
          return api(config)
        })
      }

      config._retry = true
      isRefreshing  = true

      try {
        // Get refresh token from persisted Zustand state
        const stored = localStorage.getItem('worksphere-auth')
        const state  = JSON.parse(stored ?? '{}')?.state
        const refreshToken = state?.refreshToken

        if (!refreshToken) throw new Error('No refresh token available')

        // Call refresh endpoint directly (bypass interceptor)
        const res = await axios.post('/api/auth/refresh', { refreshToken })
        const { accessToken: newAccess, refreshToken: newRefresh } =
          res.data.data

        // Update Zustand persisted state
        const parsed = JSON.parse(stored!)
        parsed.state.accessToken  = newAccess
        parsed.state.refreshToken = newRefresh
        localStorage.setItem('worksphere-auth', JSON.stringify(parsed))

        // Retry original request + all queued requests
        config.headers.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        isRefreshing = false

        return api(config)
      } catch (refreshError) {
        // Refresh failed → logout user
        processQueue(refreshError, null)
        isRefreshing = false

        // Clear auth state
        localStorage.removeItem('worksphere-auth')

        // Redirect to login
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // ── 403 — Fire forbidden event ────────────────────────────────
    if (status === 403) {
      window.dispatchEvent(
        new CustomEvent('worksphere:forbidden', {
          detail: {
            url:     config.url,
            message: (error.response?.data as { message?: string })?.message,
          },
        })
      )
    }

    // ── Classify and show toast for all other errors ──────────────
    // Don't show toast for:
    // - 401 (handled above or will redirect)
    // - 404 (components handle empty state)
    // - 400/422 (form components show validation errors)
    if (status !== 401 && status !== 404 && status !== 400 && status !== 422) {
      const classified = classifyError(error)
      showErrorToast(classified)
    }

    return Promise.reject(error)
  }
)

// ── Online/Offline detection ───────────────────────────────────────
window.addEventListener('online',  dismissOfflineToast)
window.addEventListener('offline', () => {
  showErrorToast({
    type:          'network',
    statusCode:    null,
    message:       'No internet connection',
    errors:        [],
    correlationId: null,
    canRetry:      true,
    isUserError:   false,
  })
})

export default api
