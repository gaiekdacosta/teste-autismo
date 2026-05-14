import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase'
import { clearCachedAdminAccess } from './administradores'
import { jsonRequest } from './api'

export type AuthTokens = {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

export type AuthUser = {
  id: string
  email?: string
  name?: string
  phone?: string
  avatarUrl?: string
  birthDate?: string
  gender?: string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterCredentials = {
  name: string
  email: string
  phone: string
  birthDate: string
  gender: string
  password: string
}

export type VerifyPhoneChangeCredentials = {
  phone: string
  token: string
}

export type LoginResponse = {
  tokens?: AuthTokens
  user?: AuthUser
}

const AUTH_STORAGE_KEY = 'auth.session'

function mapAuthError(message: string) {
  const errors: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha inválidos.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'Phone not confirmed': 'Confirme seu telefone antes de continuar.',
    'User already registered': 'Este e-mail já está cadastrado.',
    'A user with this phone number has already been registered':
      'Este telefone já está cadastrado.',
    'Password should be at least 6 characters':
      'A senha deve ter pelo menos 6 caracteres.',
    'Signup is disabled': 'Cadastro desativado no momento.',
    'Email rate limit exceeded': 'Muitas tentativas. Tente novamente mais tarde.',
    'Phone rate limit exceeded': 'Muitas tentativas com este telefone. Tente novamente mais tarde.',
  }

  return errors[message] || 'Erro de autenticação.'
}

function getMetadataValue(user: User, key: string) {
  const value = user.user_metadata?.[key]
  return typeof value === 'string' ? value : undefined
}

function mapAuthUser(user?: User | null): AuthUser | undefined {
  if (!user) return undefined

  return {
    id: user.id,
    email: user.email ?? getMetadataValue(user, 'email'),
    name: getMetadataValue(user, 'name') ?? getMetadataValue(user, 'full_name'),
    phone: user.phone ?? getMetadataValue(user, 'phone'),
    avatarUrl: getMetadataValue(user, 'avatar_url'),
    birthDate: getMetadataValue(user, 'birthDate'),
    gender: getMetadataValue(user, 'gender'),
  }
}

function mapSession(session?: Session | null): LoginResponse {
  return {
    tokens: session?.access_token
      ? {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresIn: session.expires_in,
        }
      : undefined,
    user: mapAuthUser(session?.user),
  }
}

function persistSession(response: LoginResponse) {
  if (typeof window === 'undefined' || !response.tokens?.accessToken) return
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response))
}

async function syncUserPhoneToProvider(user?: User | null) {
  const phone = user?.phone ?? getMetadataValue(user as User, 'phone')

  if (!user || !phone || user.phone === phone) return

  const { error } = await supabase.auth.updateUser({
    phone,
    data: {
      ...user.user_metadata,
      phone,
    },
  })

  if (error) throw new Error(mapAuthError(error.message))
}

export async function loginWithPassword(credentials: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) throw new Error(mapAuthError(error.message))

  await syncUserPhoneToProvider(data.session?.user)

  const response = await getFreshSession()
  persistSession(response)

  return response
}

export async function registerWithPassword(credentials: RegisterCredentials) {
  const response = await jsonRequest<LoginResponse>('/auth/register', {
    method: 'POST',
    body: credentials,
  })

  if (response.tokens?.accessToken && response.tokens.refreshToken) {
    await supabase.auth.setSession({
      access_token: response.tokens.accessToken,
      refresh_token: response.tokens.refreshToken,
    })
  }

  persistSession(response)

  return response
}

export async function notifyCurrentUserRegistration() {
  return jsonRequest<{ notified: boolean }>('/auth/notify-new-user', {
    method: 'POST',
  })
}

export async function verifyPhoneChange(credentials: VerifyPhoneChangeCredentials) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: credentials.phone,
    token: credentials.token,
    type: 'phone_change',
  })

  if (error) throw new Error(mapAuthError(error.message))

  const response = mapSession(data.session)
  persistSession(response)

  return response
}

export async function getGoogleAuthorizationUrl(redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })

  if (error) throw new Error(mapAuthError(error.message))
  if (!data.url) throw new Error('O Supabase não retornou a URL do Google.')

  return data.url
}

export function getStoredSession() {
  if (typeof window === 'undefined') return null

  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedSession) return null

  try {
    return JSON.parse(storedSession) as LoginResponse
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export async function getFreshSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) throw new Error(mapAuthError(error.message))

  const response = mapSession(data.session)

  if (response.tokens?.accessToken) {
    persistSession(response)
  } else {
    clearStoredSession()
  }

  return response
}

export async function updateUserProfile(updates: {
  name?: string
  email?: string
  phone?: string
}) {
  const { data: currentUserData, error: currentUserError } =
    await supabase.auth.getUser()

  if (currentUserError) throw new Error(mapAuthError(currentUserError.message))

  const currentMetadata = currentUserData.user?.user_metadata ?? {}

  const { error } = await supabase.auth.updateUser({
    email: updates.email,
    phone: updates.phone,
    data: {
      ...currentMetadata,
      ...updates,
    },
  })

  if (error) throw new Error(mapAuthError(error.message))

  const freshSession = await getFreshSession()
  persistSession(freshSession)

  return freshSession
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return

  localStorage.removeItem(AUTH_STORAGE_KEY)
  clearCachedAdminAccess()
  void supabase.auth.signOut()
}
