import { jsonRequest, request } from './api'
import type { ServicePurchase } from './servicos'
import type { Teste } from './testes'

export type UsuarioAvaliado = {
  id: string
  id_user: string
  nome: string
  created_at: string
  updated_at: string
}

export type UsuarioSistema = {
  id: string
  email: string | null
  name: string | null
  phone: string | null
  avatarUrl: string | null
  created_at: string
  updated_at: string | null
  last_sign_in_at: string | null
  avaliados: UsuarioAvaliado[]
  testes: Teste[]
  compras: ServicePurchase[]
  contatado: boolean
  contatado_em: string | null
}

export type ContatadoStatus = {
  id: string
  contatado: boolean
  contatado_em: string | null
}

export function listUsuarios() {
  return request<UsuarioSistema[]>('/usuarios')
}

export function setUsuarioContatado(id: string, contatado: boolean) {
  return jsonRequest<ContatadoStatus>(`/usuarios/${id}/contatado`, {
    method: 'PATCH',
    body: { contatado },
  })
}

export function deleteUsuario(id: string) {
  return request<void>(`/usuarios/${id}`, {
    method: 'DELETE',
  })
}
