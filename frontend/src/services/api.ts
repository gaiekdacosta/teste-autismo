const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  body?: BodyInit | null
  headers?: HeadersInit
  method?: HttpMethod
  signal?: AbortSignal
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function buildUrl(path: string) {
  return path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
    body: options.body,
    signal: options.signal,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : 'A requisicao ao backend falhou.'

    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}

type JsonRequestOptions = Omit<RequestOptions, 'body'> & {
  body?: unknown
}

export function jsonRequest<T>(path: string, options: JsonRequestOptions = {}) {
  return request<T>(path, {
    ...options,
    body: options.body === undefined ? null : JSON.stringify(options.body),
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
}

export { API_URL }
