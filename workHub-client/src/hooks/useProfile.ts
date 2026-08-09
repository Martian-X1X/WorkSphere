import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { queryKeys } from '@/lib/queryKeys'
import { getApiError } from '@/utils'
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '@/types'

// ── useProfile ─────────────────────────────────────────────────────
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn:  () => authService.getProfile(),
    staleTime: 1000 * 60 * 5,   // 5 minutes
    select: (data) => data.data.data,
  })
}

// ── useUpdateProfile ───────────────────────────────────────────────
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user, setAuth, accessToken, refreshToken } = useAuthStore()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      authService.updateProfile(data),

    onSuccess: (res) => {
      const updated = res.data.data

      // Update Zustand store so sidebar/header reflect the new name
      if (user && accessToken && refreshToken) {
        setAuth(
          {
            ...user,
            firstName:         updated.firstName,
            lastName:          updated.lastName,
            fullName:          updated.fullName,
            profilePictureUrl: updated.profilePictureUrl,
          },
          accessToken,
          refreshToken
        )
      }

      // Invalidate profile + auth context caches
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() })
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.context() })

      toast.success('Profile updated successfully!')
    },

    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useChangePassword ──────────────────────────────────────────────
export function useChangePassword() {
  const { logout } = useAuthStore()

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      authService.changePassword(data),

    onSuccess: () => {
      toast.success(
        'Password changed! Please sign in again with your new password.',
        { duration: 5000 }
      )
      // Backend invalidated all refresh tokens — sign the user out
      setTimeout(() => logout(), 2000)
    },
  })
}
