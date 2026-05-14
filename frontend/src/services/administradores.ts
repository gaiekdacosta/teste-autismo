import { jsonRequest, request } from './api'

const ADMIN_ACCESS_STORAGE_KEY = 'auth.adminAccess'

export type NivelAdministrador = 'admin' | 'super_admin'

export type Administrador = {
  id: string
  id_user: string
  email: string
  ativo: boolean
  nivel: NivelAdministrador
  created_at: string
  updated_at: string
}

export type CreateAdministradorInput = {
  email: string
  ativo?: boolean
}

export type UpdateAdministradorInput = Partial<CreateAdministradorInput>

export function getCachedAdminAccess() {
  if (typeof window === 'undefined') return null

  const cachedValue = localStorage.getItem(ADMIN_ACCESS_STORAGE_KEY)

  if (cachedValue === 'true') return true
  if (cachedValue === 'false') return false

  return null
}

export function setCachedAdminAccess(hasAccess: boolean) {
  if (typeof window === 'undefined') return

  localStorage.setItem(ADMIN_ACCESS_STORAGE_KEY, String(hasAccess))
}

export function clearCachedAdminAccess() {
  if (typeof window === 'undefined') return

  localStorage.removeItem(ADMIN_ACCESS_STORAGE_KEY)
}

export async function getAdministradorAtual() {
  try {
    const administrador = await request<Administrador>('/administradores/me')
    setCachedAdminAccess(true)
    return administrador
  } catch (error) {
    setCachedAdminAccess(false)
    throw error
  }
}

export function listAdministradores(signal?: AbortSignal) {
  return request<Administrador[]>('/administradores', { signal })
}

export function createAdministrador(body: CreateAdministradorInput) {
  return jsonRequest<Administrador>('/administradores', {
    method: 'POST',
    body,
  })
}

export function updateAdministrador(id: string, body: UpdateAdministradorInput) {
  return jsonRequest<Administrador>(`/administradores/${id}`, {
    method: 'PUT',
    body,
  })
}

export function deleteAdministrador(id: string) {
  return request<void>(`/administradores/${id}`, {
    method: 'DELETE',
  })
}
