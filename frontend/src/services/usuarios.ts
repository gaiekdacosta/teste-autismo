import { request } from './api'
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
  birthDate: string | null
  gender: string | null
  avatarUrl: string | null
  created_at: string
  updated_at: string | null
  last_sign_in_at: string | null
  avaliados: UsuarioAvaliado[]
  testes: Teste[]
}

export function listUsuarios() {
  return request<UsuarioSistema[]>('/usuarios')
}
