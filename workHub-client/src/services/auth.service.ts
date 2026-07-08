import api from '@/lib/api'
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  AuthContext,
} from '@/types'

export const authService = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken }),

  revoke: (refreshToken: string) =>
    api.post<ApiResponse<null>>('/auth/revoke', { refreshToken }),

  getContext: () =>
    api.get<ApiResponse<AuthContext>>('/auth/context'),
}