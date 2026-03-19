const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    let data: unknown
    try {
      data = await res.json()
    } catch {
      data = undefined
    }
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : res.statusText
    throw new ApiError(res.status, message, data)
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, init?: Omit<RequestInit, 'method'>) =>
    request<T>(path, { ...init, method: 'GET' }),

  post: <T>(path: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(path, { ...init, method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(path, { ...init, method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string, init?: Omit<RequestInit, 'method'>) =>
    request<T>(path, { ...init, method: 'DELETE' }),
}

export { ApiError }
