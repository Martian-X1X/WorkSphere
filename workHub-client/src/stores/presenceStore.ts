import { create } from 'zustand'

interface PresenceState {
  onlineUserIds: Set<string>

  setOnlineUsers: (ids: string[]) => void
  setUserOnline: (userId: string) => void
  setUserOffline: (userId: string) => void
  clear: () => void
  isOnline: (userId: string) => boolean
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUserIds: new Set(),

  setOnlineUsers: (ids) => set({ onlineUserIds: new Set(ids) }),

  setUserOnline: (userId) => set((s) => {
    if (s.onlineUserIds.has(userId)) return s
    const next = new Set(s.onlineUserIds)
    next.add(userId)
    return { onlineUserIds: next }
  }),

  setUserOffline: (userId) => set((s) => {
    if (!s.onlineUserIds.has(userId)) return s
    const next = new Set(s.onlineUserIds)
    next.delete(userId)
    return { onlineUserIds: next }
  }),

  clear: () => set({ onlineUserIds: new Set() }),

  isOnline: (userId) => get().onlineUserIds.has(userId),
}))
