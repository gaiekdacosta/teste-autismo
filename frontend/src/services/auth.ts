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
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterCredentials = {
  name: string
  email: string
  phone: string
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

export function mapAuthError(message: string) {
  const errors: Record<string, string> = {
    'invalid login credentials': 'E-mail ou senha inválidos.',
    'email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'phone not confirmed': 'Confirme seu telefone antes de continuar.',
    'user already registered': 'Este e-mail já está cadastrado.',
    'a user with this phone number has already been registered':
      'Este telefone já está cadastrado.',
    'password should be at least 6 characters':
      'A senha deve ter pelo menos 6 caracteres.',
    'signup is disabled': 'Cadastro desativado no momento.',
    'email rate limit exceeded': 'Muitas tentativas. Tente novamente mais tarde.',
    'phone rate limit exceeded': 'Muitas tentativas com este telefone. Tente novamente mais tarde.',
  }

  const normalizedMessage = message.trim().toLowerCase();
  return errors[normalizedMessage] || 'Erro de autenticação.'
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

// Garante que o telefone fique disponível em user_metadata (fonte de verdade
// do app). Não grava no campo nativo auth.users.phone para não disparar a
// verificação por SMS/OTP do Supabase.
async function ensurePhoneInMetadata(user?: User | null) {
  if (!user) return

  const metadataPhone = getMetadataValue(user, 'phone')
  const phone = metadataPhone ?? user.phone

  // Nada a sincronizar, ou o metadata já está preenchido.
  if (!phone || metadataPhone === phone) return

  const { error } = await supabase.auth.updateUser({
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

  await ensurePhoneInMetadata(data.session?.user)

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

export async function forgotPassword(email: string, redirectTo?: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) throw new Error(mapAuthError(error.message))

  return data
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

  // O telefone vive apenas em user_metadata (não no campo nativo) para não
  // disparar a verificação por SMS/OTP do Supabase. O e-mail continua sendo
  // atualizado no campo nativo, pois é uma operação de auth legítima.
  const { error } = await supabase.auth.updateUser({
    email: updates.email,
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
