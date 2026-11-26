import { useCallback, useEffect, useRef } from 'react'
import { HubConnectionState } from '@microsoft/signalr'

import { getChatHubConnection } from '@/lib/chatHub'
import { useAuthStore } from '@/stores/authStore'
import { useTypingStore } from '@/stores/typingStore'

const TYPING_DEBOUNCE_MS = 400
const TYPING_THROTTLE_MS = 2000
const TYPING_STOP_MS = 3000

interface TypingUser {
  userId: string
  userName: string
}

interface UseTypingReturn {
  onKeyActivity: () => void
  onStopTyping: () => void
  getTypers: (roomId: string) => TypingUser[]
}

/** Sends typing events for the active room and expires them after silence. */
export function useTyping(roomId: string): UseTypingReturn {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const getTypers = useTypingStore((s) => s.getTypers)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentRef = useRef(0)
  const isTypingRef = useRef(false)

  const clearTimers = useCallback(() => {
    [debounceRef, throttleRef, stopRef].forEach((ref) => {
      if (ref.current) {
        clearTimeout(ref.current)
        ref.current = null
      }
    })
  }, [])

  const sendStartTyping = useCallback(async () => {
    const hub = getChatHubConnection()
    if (!hub || hub.state !== HubConnectionState.Connected) return

    try {
      await hub.invoke('StartTyping', roomId)
      lastSentRef.current = Date.now()
      isTypingRef.current = true
    } catch {
      // Typing is best-effort — never interrupt message sending.
    }
  }, [roomId])

  const sendStopTyping = useCallback(async () => {
    if (!isTypingRef.current) return
    isTypingRef.current = false

    const hub = getChatHubConnection()
    if (!hub || hub.state !== HubConnectionState.Connected) return

    try {
      await hub.invoke('StopTyping', roomId)
    } catch {
      // Ignore — the server expires typing events too.
    }
  }, [roomId])

  const scheduleStartTyping = useCallback(() => {
    const elapsed = Date.now() - lastSentRef.current

    if (lastSentRef.current === 0 || elapsed >= TYPING_THROTTLE_MS) {
      void sendStartTyping()
      return
    }

    if (!throttleRef.current) {
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null
        void sendStartTyping()
      }, TYPING_THROTTLE_MS - elapsed)
    }
  }, [sendStartTyping])

  /** Call on every keystroke. First event is debounced by 400ms. */
  const onKeyActivity = useCallback(() => {
    if (!debounceRef.current) {
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        scheduleStartTyping()
      }, TYPING_DEBOUNCE_MS)
    }

    if (stopRef.current) clearTimeout(stopRef.current)
    stopRef.current = setTimeout(() => {
      stopRef.current = null

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
        throttleRef.current = null
      }

      void sendStopTyping()
    }, TYPING_STOP_MS)
  }, [scheduleStartTyping, sendStopTyping])

  /** Call on send, input clear, or room change. */
  const onStopTyping = useCallback(() => {
    clearTimers()
    void sendStopTyping()
  }, [clearTimers, sendStopTyping])

  useEffect(() => () => {
    clearTimers()

    if (isTypingRef.current) {
      const hub = getChatHubConnection()
      if (hub?.state === HubConnectionState.Connected) {
        void hub.invoke('StopTyping', roomId).catch(() => {})
      }
      isTypingRef.current = false
    }

    lastSentRef.current = 0
  }, [roomId, clearTimers])

  const getTypersFiltered = useCallback((rid: string) => (
    getTypers(rid).filter((t) => t.userId !== currentUserId)
  ), [getTypers, currentUserId])

  return { onKeyActivity, onStopTyping, getTypers: getTypersFiltered }
}
