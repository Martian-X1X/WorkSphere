import api from '@/lib/api'
import type {
  ApiResponse,
  PagedResult,
  Organization,
  Member,
  Invite,
  CreateInviteRequest,
  ChangeMemberRoleRequest,
} from '@/types'

export const organizationService = {
  // ── Org profile ─────────────────────────────────────────────────
  getMyOrg: () =>
    api.get<ApiResponse<Organization>>('/organizations/me'),

  updateMyOrg: (data: { name: string; description?: string; logoUrl?: string }) =>
    api.put<ApiResponse<Organization>>('/organizations/me', data),

  // ── Members ─────────────────────────────────────────────────────
  getMembers: (page = 1, pageSize = 50) =>
    api.get<ApiResponse<PagedResult<Member>>>(
      `/organizations/me/members?page=${page}&pageSize=${pageSize}`
    ),

  getMemberById: (memberId: string) =>
    api.get<ApiResponse<Member>>(
      `/organizations/me/members/${memberId}`
    ),

  changeMemberRole: (memberId: string, data: ChangeMemberRoleRequest) =>
    api.patch<ApiResponse<Member>>(
      `/organizations/me/members/${memberId}/role`,
      data
    ),

  deactivateMember: (memberId: string) =>
    api.patch<ApiResponse<Member>>(
      `/organizations/me/members/${memberId}/deactivate`,
      {}
    ),

  // ── Invites ─────────────────────────────────────────────────────
  getInvites: () =>
    api.get<ApiResponse<Invite[]>>('/organizations/me/invites'),

  createInvite: (data: CreateInviteRequest) =>
    api.post<ApiResponse<Invite>>('/organizations/me/invites', data),

  cancelInvite: (inviteId: string) =>
    api.delete<ApiResponse<object>>(
      `/organizations/me/invites/${inviteId}`
    ),
}