import { create } from 'zustand'

interface TypingUser {
  userId: string
  userName: string
  addedAt: number
}

interface TypingState {
  typing: Record<string, TypingUser[]>

  addTyping: (roomId: string, userId: string, userName: string) => void
  removeTyping: (roomId: string, userId: string) => void
  clearRoom: (roomId: string) => void
  clear: () => void
  getTypers: (roomId: string) => TypingUser[]
}

export const useTypingStore = create<TypingState>((set, get) => ({
  typing: {},

  addTyping: (roomId, userId, userName) => set((s) => {
    const current = s.typing[roomId] ?? []
    const withoutUser = current.filter((t) => t.userId !== userId)
    return {
      typing: {
        ...s.typing,
        [roomId]: [
          ...withoutUser,
          { userId, userName, addedAt: Date.now() },
        ],
      },
    }
  }),

  removeTyping: (roomId, userId) => set((s) => ({
    typing: {
      ...s.typing,
      [roomId]: (s.typing[roomId] ?? []).filter((t) => t.userId !== userId),
    },
  })),

  clearRoom: (roomId) => set((s) => ({
    typing: { ...s.typing, [roomId]: [] },
  })),

  clear: () => set({ typing: {} }),

  getTypers: (roomId) => get().typing[roomId] ?? [],
}))
