import type { Context } from 'hono'

// ─── Custom API Error ─────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR'
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static notFound(message = 'Not found') {
    return new ApiError(message, 404, 'NOT_FOUND')
  }

  static badRequest(message = 'Bad request') {
    return new ApiError(message, 400, 'BAD_REQUEST')
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, 401, 'UNAUTHORIZED')
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, 403, 'FORBIDDEN')
  }

  static conflict(message = 'Conflict') {
    return new ApiError(message, 409, 'CONFLICT')
  }
}

// ─── Global Error Handler ────────────────────────────────────────────────────

export function errorHandler(err: Error, c: Context) {
  if (err instanceof ApiError) {
    return c.json(
      { error: err.message, code: err.code },
      err.statusCode as 400 | 401 | 403 | 404 | 409 | 500
    )
  }

  // Nieobsługiwane błędy
  console.error('[API] Unhandled error:', err)
  return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
}
