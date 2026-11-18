import { create } from 'zustand'

interface NotificationRealtimeState {
  isConnected: boolean
  setConnected: (value: boolean) => void
}

/**
 * Tracks the live SignalR connection for UI indicators (e.g. the bell dot).
 * Notification data itself stays in TanStack Query so REST and real-time
 * updates share a single cache.
 */
export const useNotificationStore = create<NotificationRealtimeState>((set) => ({
  isConnected: false,
  setConnected: (value) => set({ isConnected: value }),
}))
