import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { organizationService } from '@/services/organization.service'
import { queryKeys } from '@/lib/queryKeys'
import { getApiError } from '@/utils'

// ── useOrganization ────────────────────────────────────────────────
export function useOrganization() {
  return useQuery({
    queryKey: queryKeys.org.detail(),
    queryFn:  () => organizationService.getMyOrg(),
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data.data,  // ← unwrap ApiResponse
  })
}

// ── useMembers ─────────────────────────────────────────────────────
export function useMembers() {
  return useQuery({
    queryKey: queryKeys.org.members(),
    queryFn:  () => organizationService.getMembers(1, 100),
    staleTime: 1000 * 60,
    select: (data) => data.data.data?.items ?? [],
  })
}

// ── useActiveMembers ───────────────────────────────────────────────
export function useActiveMembers() {
  const query = useMembers()
  return {
    ...query,
    data: query.data?.filter(m => m.isActive) ?? [],
  }
}

// ── useInvites ─────────────────────────────────────────────────────
export function useInvites(enabled = true) {
  return useQuery({
    queryKey: queryKeys.org.invites(),
    queryFn:  () => organizationService.getInvites(),
    enabled,
    staleTime: 1000 * 30,
    select: (data) => data.data.data ?? [],
  })
}

// ── useCreateInvite ────────────────────────────────────────────────
export function useCreateInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { email: string; role: 'Owner' | 'Admin' | 'Member' }) =>
      organizationService.createInvite(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.org.invites() })
      queryClient.invalidateQueries({ queryKey: queryKeys.org.detail() })
      toast.success(`Invite sent to ${variables.email}`)
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useCancelInvite ────────────────────────────────────────────────
export function useCancelInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inviteId: string) => organizationService.cancelInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.org.invites() })
      toast.success('Invite cancelled')
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useChangeMemberRole ────────────────────────────────────────────
export function useChangeMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: string
      role: 'Owner' | 'Admin' | 'Member'
    }) => organizationService.changeMemberRole(memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.org.members() })
      toast.success('Role updated successfully')
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}

// ── useDeactivateMember ────────────────────────────────────────────
export function useDeactivateMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) =>
      organizationService.deactivateMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.org.members() })
      queryClient.invalidateQueries({ queryKey: queryKeys.org.detail() })
      toast.success('Member deactivated')
    },
    onError: (error) => toast.error(getApiError(error)),
  })
}