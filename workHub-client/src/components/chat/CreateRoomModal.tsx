import { useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'

import { cn } from '@/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useActiveMembers } from '@/hooks/useOrganization'
import { useCreateRoom, useOpenDm } from '@/hooks/useChat'
import type { ChatRoom } from '@/types/chat'

interface CreateRoomModalProps {
  open: boolean
  mode: 'room' | 'dm'
  onClose: () => void
  onCreated: (room: ChatRoom) => void
}

export function CreateRoomModal({
  open,
  mode,
  onClose,
  onCreated,
}: CreateRoomModalProps) {
  const members = useActiveMembers()
  const createRoom = useCreateRoom()
  const openDm = useOpenDm()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')

  if (!open) return null

  const filtered = members.data.filter((member) =>
    `${member.fullName} ${member.email}`.toLowerCase().includes(search.toLowerCase()))

  const toggleMember = (id: string) => {
    setSelected((current) => mode === 'dm'
      ? (current.includes(id) ? [] : [id])
      : (current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id]))
  }

  const isSubmitting = createRoom.isPending || openDm.isPending
  const canSubmit = mode === 'dm'
    ? selected.length === 1
    : name.trim().length > 0

  const submit = () => {
    if (!canSubmit || isSubmitting) return

    if (mode === 'dm') {
      openDm.mutate(selected[0], {
        onSuccess: (room) => { onCreated(room); onClose() },
      })
      return
    }

    createRoom.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      type: 'Custom',
      memberIds: selected,
    }, {
      onSuccess: (room) => { onCreated(room); onClose() },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md bg-surface-900 border border-surface-700
                      rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4
                        border-b border-surface-800">
          <div>
            <h2 className="font-semibold text-surface-100">
              {mode === 'dm' ? 'New message' : 'Create room'}
            </h2>
            <p className="text-xs text-surface-500 mt-0.5">
              {mode === 'dm'
                ? 'Choose a teammate to chat with'
                : 'Name your room and add members'}
            </p>
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

        <div className="px-5 py-4 space-y-3 overflow-y-auto">
          {mode === 'room' && (
            <>
              <label className="block">
                <span className="text-xs font-medium text-surface-400">Room name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. design-review"
                  className="mt-1 w-full rounded-lg bg-surface-800 border border-surface-700
                             px-3 py-2 text-sm text-surface-100 outline-none
                             focus:border-primary-500"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-surface-400">Description</span>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 w-full rounded-lg bg-surface-800 border border-surface-700
                             px-3 py-2 text-sm text-surface-100 outline-none
                             focus:border-primary-500"
                />
              </label>
            </>
          )}

          <div>
            <span className="text-xs font-medium text-surface-400">
              {mode === 'dm' ? 'Teammates' : 'Members'}
            </span>
            <div className="mt-1 flex items-center gap-2 rounded-lg bg-surface-800
                            border border-surface-700 px-3">
              <Search className="w-4 h-4 text-surface-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people..."
                className="flex-1 bg-transparent py-2 text-sm text-surface-100
                           outline-none placeholder:text-surface-500"
              />
            </div>

            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {filtered.map((member) => {
                const checked = selected.includes(member.id)
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors',
                      checked ? 'bg-primary-600/15' : 'hover:bg-surface-800',
                    )}
                  >
                    <Avatar name={member.fullName} size="sm" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-surface-100 truncate">
                        {member.fullName}
                      </span>
                      <span className="block text-xs text-surface-500 truncate">
                        {member.email}
                      </span>
                    </span>
                    <span className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center text-[10px]',
                      checked
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-surface-600',
                    )}>
                      {checked ? '✓' : ''}
                    </span>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="text-xs text-surface-500 py-4 text-center">
                  No teammates found
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-surface-800">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            {mode === 'dm' ? 'Start chat' : 'Create room'}
          </Button>
        </div>
      </div>
    </div>
  )
}
