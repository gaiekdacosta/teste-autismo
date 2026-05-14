import { jsonRequest, request } from './api'

export type Teste = {
  id: string
  id_user: string
  id_avaliado: string | null
  id_questionario: string
  status: string
  pontuacao_total: number
  classificacao: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
  questionario: {
    id: string
    titulo: string
    descricao: string | null
    versao: number
  } | null
  avaliado: {
    id: string
  } | null
  respostas: Resposta[]
}

export type Resposta = {
  id: string
  id_teste: string
  id_questao: string
  id_alternativa: string
  valor: number
  created_at: string
  questao: {
    id: string
    posicao: number
    pergunta: string
  } | null
  alternativa: {
    id: string
    posicao: number
    texto: string
    valor: number
  } | null
}

export type Avaliado = {
  id: string
  id_user: string
  nome: string
  data_nascimento: string | null
  genero: string | null
  created_at: string
  updated_at: string
}

export type Contato = {
  id: string
  whatsapp: string
  email: string
  created_at: string
  updated_at: string
}

export function listTestes() {
  return request<Teste[]>('/testes')
}

export function getTeste(id: string) {
  return request<Teste>(`/testes/${id}`)
}

export function createTeste(data: { id_questionario: string; id_avaliado?: string }) {
  return jsonRequest<Teste>('/testes', {
    method: 'POST',
    body: data,
  })
}

export function completeTeste(data: {
  id_questionario: string
  id_avaliado?: string
  respostas: Array<{
    id_questao: string
    id_alternativa: string
  }>
}) {
  return jsonRequest<Teste>('/testes/concluir', {
    method: 'POST',
    body: data,
  })
}

export function saveTesteRespostas(id: string, data: {
  respostas: Array<{
    id_questao: string
    id_alternativa: string
  }>
}) {
  return jsonRequest<Teste>(`/testes/${id}/respostas`, {
    method: 'PUT',
    body: data,
  })
}

export function completeExistingTeste(id: string) {
  return jsonRequest<Teste>(`/testes/${id}/concluir`, {
    method: 'POST',
  })
}

export function updateTeste(id: string, data: Partial<{
  status: string
  pontuacao_total: number
  classificacao: string
  started_at: string
  finished_at: string
}>) {
  return jsonRequest<Teste>(`/testes/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export function listAvaliados() {
  return request<Avaliado[]>('/avaliados')
}

export function getAvaliado(id: string) {
  return request<Avaliado>(`/avaliados/${id}`)
}

export function createAvaliado(data: { nome: string; data_nascimento?: string; genero?: string }) {
  return jsonRequest<Avaliado>('/avaliados', {
    method: 'POST',
    body: data,
  })
}

export function updateAvaliado(id: string, data: Partial<{ nome: string; data_nascimento: string; genero: string }>) {
  return jsonRequest<Avaliado>(`/avaliados/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export function getContato() {
  return request<Contato>('/contato')
}

export function createContato(data: { whatsapp: string; email: string }) {
  return jsonRequest<Contato>('/contato', {
    method: 'POST',
    body: data,
  })
}

export function updateContato(data: Partial<{ whatsapp: string; email: string }>) {
  return jsonRequest<Contato>('/contato', {
    method: 'PUT',
    body: data,
  })
}
