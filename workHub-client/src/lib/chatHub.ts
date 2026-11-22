import * as signalR from '@microsoft/signalr'

import { getStoredAccessToken } from '@/lib/signalr'

let chatConnection: signalR.HubConnection | null = null

function hubUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)
    ?.replace(/\/+$/, '') ?? ''
  return `${base}/hubs/chat`
}

/**
 * Creates (or returns the existing) singleton connection to ChatHub.
 * The token getter is a function so refreshes are picked up without
 * recreating the connection.
 */
export function createChatHubConnection(
  getToken: () => string | null = getStoredAccessToken,
): signalR.HubConnection {
  if (chatConnection) return chatConnection

  chatConnection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl(), {
      // WebSocket upgrades cannot set headers → query-string token,
      // validated by JwtBearerEvents.OnMessageReceived on the API.
      accessTokenFactory: () => getToken() ?? '',
      transport:
        signalR.HttpTransportType.WebSockets |
        signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (ctx) => {
        const delays = [0, 2000, 10000, 30000]
        return delays[ctx.previousRetryCount] ?? 30000
      },
    })
    .configureLogging(
      import.meta.env.DEV
        ? signalR.LogLevel.Information
        : signalR.LogLevel.Warning,
    )
    .build()

  return chatConnection
}

export function getChatHubConnection(): signalR.HubConnection | null {
  return chatConnection
}

export async function disconnectChatHub(): Promise<void> {
  const connection = chatConnection
  chatConnection = null
  if (
    connection &&
    connection.state !== signalR.HubConnectionState.Disconnected
  ) {
    await connection.stop()
  }
}
