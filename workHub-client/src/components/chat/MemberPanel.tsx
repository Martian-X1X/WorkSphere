import { useMemo, useState } from 'react'
import { Search, UserMinus, UserPlus, X } from 'lucide-react'

import { cn } from '@/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAuthStore } from '@/stores/authStore'
import { useActiveMembers } from '@/hooks/useOrganization'
import { useAddMembers, useChatMembers, useRemoveMember } from '@/hooks/useChat'

interface MemberPanelProps {
  roomId: string
  currentUserId: string
  onClose: () => void
}

export function MemberPanel({ roomId, currentUserId, onClose }: MemberPanelProps) {
  const membersQuery = useChatMembers(roomId)
  const orgMembers = useActiveMembers()
  const removeMember = useRemoveMember(roomId)
  const addMembers = useAddMembers(roomId)
  const isAdminOrOwner = useAuthStore((s) => s.isAdminOrOwner)

  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [orgSearch, setOrgSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null)

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data])
  const filtered = members.filter((member) =>
    member.fullName.toLowerCase().includes(search.toLowerCase()))

  const existingIds = useMemo(
    () => new Set(members.map((member) => member.userId)),
    [members],
  )

  const addable = orgMembers.data.filter((member) =>
    !existingIds.has(member.id)
    && `${member.fullName} ${member.email}`
      .toLowerCase()
      .includes(orgSearch.toLowerCase()))

  const confirmRemove = () => {
    if (!pendingRemoval) return
    removeMember.mutate(pendingRemoval, {
      onSuccess: () => setPendingRemoval(null),
    })
  }

  return (
    <aside className="w-64 lg:w-72 flex-shrink-0 flex flex-col min-h-0
                      border-l border-surface-800 bg-surface-900">
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-4
                      border-b border-surface-800">
        <div>
          <h2 className="text-sm font-semibold text-surface-100">Members</h2>
          <p className="text-[11px] text-surface-500">{members.length} people</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100
                     hover:bg-surface-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 rounded-lg bg-surface-800
                        border border-surface-700 px-2.5">
          <Search className="w-3.5 h-3.5 text-surface-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find member..."
            className="flex-1 bg-transparent py-1.5 text-xs text-surface-100
                       outline-none placeholder:text-surface-600"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {filtered.map((member) => {
          const canRemove = member.userId === currentUserId || isAdminOrOwner()
          return (
            <div key={member.userId}
                 className="group flex items-center gap-2.5 px-2 py-2 rounded-lg
                            hover:bg-surface-800">
              <UserAvatar
                userId={member.userId}
                name={member.fullName}
                avatarUrl={member.avatarUrl}
                size="sm"
                showPresence
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-surface-200 truncate">
                  {member.fullName}
                  {member.userId === currentUserId && (
                    <span className="text-surface-500 font-normal"> (you)</span>
                  )}
                </p>
                <p className="text-[10px] text-surface-500 capitalize">
                  {member.role}
                </p>
              </div>
              {canRemove && (
                <button
                  type="button"
                  title={member.userId === currentUserId ? 'Leave room' : 'Remove member'}
                  onClick={() => setPendingRemoval(member.userId)}
                  className="p-1 rounded text-surface-500 opacity-0
                             group-hover:opacity-100 hover:text-red-400
                             focus:opacity-100 transition-opacity"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-xs text-surface-500 text-center py-6">
            No members found
          </p>
        )}
      </div>

      <div className="border-t border-surface-800 p-3 flex-shrink-0">
        {!showAdd ? (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2
                       rounded-lg border border-dashed border-surface-700
                       text-xs text-surface-400 hover:text-surface-200
                       hover:border-surface-600 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add members
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-surface-800
                            border border-surface-700 px-2.5">
              <Search className="w-3.5 h-3.5 text-surface-500" />
              <input
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                placeholder="Search teammates..."
                className="flex-1 bg-transparent py-1.5 text-xs text-surface-100
                           outline-none placeholder:text-surface-600"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {addable.map((member) => {
                const checked = selected.includes(member.id)
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelected((current) => current.includes(member.id)
                      ? current.filter((id) => id !== member.id)
                      : [...current, member.id])}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left',
                      checked ? 'bg-primary-600/15' : 'hover:bg-surface-800',
                    )}
                  >
                    <Avatar name={member.fullName} size="sm" />
                    <span className="flex-1 text-xs text-surface-200 truncate">
                      {member.fullName}
                    </span>
                    <span className={cn(
                      'w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px]',
                      checked
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-surface-600',
                    )}>
                      {checked ? '✓' : ''}
                    </span>
                  </button>
                )
              })}
              {addable.length === 0 && (
                <p className="text-[11px] text-surface-500 text-center py-3">
                  Everyone is already here
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1"
                onClick={() => { setShowAdd(false); setSelected([]) }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={selected.length === 0 || addMembers.isPending}
                onClick={() => addMembers.mutate(selected, {
                  onSuccess: () => { setSelected([]); setShowAdd(false) },
                })}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={pendingRemoval !== null}
        title={pendingRemoval === currentUserId ? 'Leave this room?' : 'Remove member?'}
        message="They will no longer be able to see messages in this room."
        confirmLabel={pendingRemoval === currentUserId ? 'Leave' : 'Remove'}
        danger
        loading={removeMember.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemoval(null)}
      />
    </aside>
  )
}
