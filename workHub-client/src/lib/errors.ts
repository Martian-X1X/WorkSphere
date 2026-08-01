import type { AxiosError } from 'axios'

// ── Error types ────────────────────────────────────────────────────
export type ApiErrorType =
  | 'auth'          // 401 — not authenticated
  | 'forbidden'     // 403 — no permission
  | 'not_found'     // 404 — resource missing
  | 'conflict'      // 409 — duplicate/conflict
  | 'validation'    // 400/422 — invalid input
  | 'rate_limit'    // 429 — too many requests
  | 'server'        // 500 — server error
  | 'unavailable'   // 503 — service unavailable
  | 'timeout'       // request timeout
  | 'network'       // no internet / CORS
  | 'unknown'       // anything else

// ── Classified error ───────────────────────────────────────────────
export interface ClassifiedError {
  type:          ApiErrorType
  statusCode:    number | null
  message:       string
  errors:        string[]        // field-level errors from backend
  correlationId: string | null   // X-Correlation-ID from response header
  canRetry:      boolean
  isUserError:   boolean         // true = user's fault, false = system
}

// ── Main classifier ────────────────────────────────────────────────
export function classifyError(error: unknown): ClassifiedError {
  const axiosError = error as AxiosError<{
    message?: string
    errors?:  string[]
    success?: boolean
  }>

  const response      = axiosError.response
  const statusCode    = response?.status ?? null
  const data          = response?.data
  const correlationId = (response?.headers?.['x-correlation-id'] as string) ?? null

  // ── Network error (no response) ───────────────────────────────────
  if (!response) {
    if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
      return {
        type:          'timeout',
        statusCode:    null,
        message:       'Request timed out. The server may be busy — please try again.',
        errors:        [],
        correlationId: null,
        canRetry:      true,
        isUserError:   false,
      }
    }
    return {
      type:          'network',
      statusCode:    null,
      message:       'No internet connection. Check your network and try again.',
      errors:        [],
      correlationId: null,
      canRetry:      true,
      isUserError:   false,
    }
  }

  // ── Extract message from backend ApiResponse<T> ───────────────────
  const backendMessage = data?.message ?? ''
  const backendErrors  = data?.errors  ?? []

  // ── 400 / 422 — Validation ────────────────────────────────────────
  if (statusCode === 400 || statusCode === 422) {
    const errorList = backendErrors.length > 0
      ? backendErrors
      : backendMessage
      ? [backendMessage]
      : ['Invalid input. Please check your data.']

    return {
      type:          'validation',
      statusCode,
      message:       errorList[0],
      errors:        errorList,
      correlationId,
      canRetry:      false,
      isUserError:   true,
    }
  }

  // ── 401 — Unauthenticated ─────────────────────────────────────────
  if (statusCode === 401) {
    return {
      type:          'auth',
      statusCode:    401,
      message:       'Your session has expired. Please sign in again.',
      errors:        [],
      correlationId,
      canRetry:      false,
      isUserError:   false,
    }
  }

  // ── 403 — Forbidden ───────────────────────────────────────────────
  if (statusCode === 403) {
    return {
      type:          'forbidden',
      statusCode:    403,
      message:       backendMessage || 'You do not have permission to do that.',
      errors:        [],
      correlationId,
      canRetry:      false,
      isUserError:   false,
    }
  }

  // ── 404 — Not Found ───────────────────────────────────────────────
  if (statusCode === 404) {
    return {
      type:          'not_found',
      statusCode:    404,
      message:       backendMessage || 'The requested resource was not found.',
      errors:        [],
      correlationId,
      canRetry:      false,
      isUserError:   false,
    }
  }

  // ── 409 — Conflict ────────────────────────────────────────────────
  if (statusCode === 409) {
    return {
      type:          'conflict',
      statusCode:    409,
      message:       backendMessage || 'This action conflicts with existing data.',
      errors:        backendErrors,
      correlationId,
      canRetry:      false,
      isUserError:   true,
    }
  }

  // ── 429 — Rate Limited ────────────────────────────────────────────
  if (statusCode === 429) {
    return {
      type:          'rate_limit',
      statusCode:    429,
      message:       'Too many requests. Please slow down and try again.',
      errors:        [],
      correlationId,
      canRetry:      true,
      isUserError:   false,
    }
  }

  // ── 500 — Server Error ────────────────────────────────────────────
  if (statusCode && statusCode >= 500 && statusCode < 503) {
    const hint = correlationId
      ? ` (Error ID: ${correlationId})`
      : ''
    return {
      type:          'server',
      statusCode,
      message:       `Something went wrong on our end.${hint}`,
      errors:        [],
      correlationId,
      canRetry:      true,
      isUserError:   false,
    }
  }

  // ── 503 — Service Unavailable ─────────────────────────────────────
  if (statusCode === 503) {
    return {
      type:          'unavailable',
      statusCode:    503,
      message:       'The service is temporarily unavailable. Please try again soon.',
      errors:        [],
      correlationId,
      canRetry:      true,
      isUserError:   false,
    }
  }

  // ── Unknown ───────────────────────────────────────────────────────
  return {
    type:          'unknown',
    statusCode,
    message:       backendMessage || 'An unexpected error occurred.',
    errors:        backendErrors,
    correlationId,
    canRetry:      true,
    isUserError:   false,
  }
}

// ── Convenience: get user-facing message ──────────────────────────
export function getErrorMessage(error: unknown): string {
  return classifyError(error).message
}

// ── Convenience: get all validation errors ─────────────────────────
export function getValidationErrors(error: unknown): string[] {
  const classified = classifyError(error)
  return classified.type === 'validation' ? classified.errors : []
}
