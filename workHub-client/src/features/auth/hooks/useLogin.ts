import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '@/features/auth/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/router/routes'
import { getApiError } from '@/shared/utils'
import type { LoginRequest } from '@/types'

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } = response.data.data
      setAuth(user, accessToken, refreshToken)
      toast.success(`Welcome back, ${user.firstName}!`)
      navigate(ROUTES.DASHBOARD, { replace: true })
    },
    onError: (error) => {
      toast.error(getApiError(error))
    },
  })
}
