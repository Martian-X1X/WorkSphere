import * as signalR from '@microsoft/signalr'

let connection: signalR.HubConnection | null = null

/**
 * Returns the newest access token. The axios interceptor refreshes tokens
 * directly in localStorage, so the Zustand snapshot can be stale.
 */
export function getStoredAccessToken(): string | null {
  try {
    const stored = localStorage.getItem('worksphere-auth')
    if (!stored) return null
    return JSON.parse(stored)?.state?.accessToken ?? null
  } catch {
    return null
  }
}

function hubUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)
    ?.replace(/\/+$/, '') ?? ''
  return `${base}/hubs/notifications`
}

/**
 * Creates (or returns the existing) SignalR connection to NotificationHub.
 * Call after the user is authenticated.
 */
export function createHubConnection(
  getToken: () => string | null = getStoredAccessToken,
): signalR.HubConnection {
  if (connection) return connection

  connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl(), {
      // WebSocket upgrades cannot set headers → SignalR sends this as a
      // query-string token, which the API validates in OnMessageReceived.
      accessTokenFactory: () => getToken() ?? '',
      transport:
        signalR.HttpTransportType.WebSockets |
        signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        const delays = [0, 2000, 10000, 30000]
        return delays[retryContext.previousRetryCount] ?? 30000
      },
    })
    .configureLogging(
      import.meta.env.DEV
        ? signalR.LogLevel.Information
        : signalR.LogLevel.Warning,
    )
    .build()

  return connection
}

export function getHubConnection(): signalR.HubConnection | null {
  return connection
}

export async function disconnectHub(): Promise<void> {
  if (
    connection &&
    connection.state !== signalR.HubConnectionState.Disconnected
  ) {
    await connection.stop()
  }
  connection = null
}
