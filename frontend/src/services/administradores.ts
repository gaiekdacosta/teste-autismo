import { jsonRequest, request } from './api'

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

export function getAdministradorAtual() {
  return request<Administrador>('/administradores/me')
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
