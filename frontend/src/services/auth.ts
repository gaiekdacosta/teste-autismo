import { API_URL, jsonRequest, request } from './api'

export type AuthTokens = {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

export type AuthUser = {
  id: string
  email: string
  name?: string
  avatarUrl?: string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterCredentials = {
  name: string
  email: string
  password: string
}

export type LoginResponse = {
  tokens?: AuthTokens
  user?: AuthUser
}

type GoogleAuthUrlResponse = {
  authorizationUrl?: string
  url?: string
}

const AUTH_STORAGE_KEY = 'auth.session'

export async function loginWithPassword(credentials: LoginCredentials) {
  const response = await jsonRequest<LoginResponse>('/auth/login', {
    body: credentials,
    method: 'POST',
  })

  persistSession(response)
  return response
}

export async function registerWithPassword(credentials: RegisterCredentials) {
  const response = await jsonRequest<LoginResponse>('/auth/register', {
    body: credentials,
    method: 'POST',
  })

  persistSession(response)
  return response
}

export async function loginWithGoogleToken(idToken: string) {
  const response = await jsonRequest<LoginResponse>('/auth/google', {
    body: { idToken },
    method: 'POST',
  })

  persistSession(response)
  return response
}

export async function getGoogleAuthorizationUrl(redirectTo?: string) {
  const searchParams = new URLSearchParams()

  if (redirectTo) {
    searchParams.set('redirectTo', redirectTo)
  }

  const endpoint = `/auth/google/url${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const response = await request<GoogleAuthUrlResponse | string>(endpoint)

  if (typeof response === 'string' && response.length > 0) {
    return response
  }

  const authorizationUrl =
    typeof response === 'string' ? undefined : response.authorizationUrl ?? response.url

  if (!authorizationUrl) {
    throw new Error(`O backend em ${API_URL} nao retornou a URL de autenticacao do Google.`)
  }

  return authorizationUrl
}

export function persistSession(session: LoginResponse) {
  if (typeof window === 'undefined' || !session.tokens?.accessToken) {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function getStoredSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const storedSession = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!storedSession) {
    return null
  }

  try {
    return JSON.parse(storedSession) as LoginResponse
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function clearStoredSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
