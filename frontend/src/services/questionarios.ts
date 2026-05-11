import { jsonRequest, request } from './api'

export type Alternativa = {
  id: string
  posicao: number
  texto: string
  valor: number
}

export type Questao = {
  id: string
  posicao: number
  pergunta: string
  alternativas: Alternativa[]
}

export type QuestionarioCompleto = {
  id: string
  titulo: string
  descricao: string
  versao: number
  ativo: boolean
  questoes: Questao[]
}

export type QuestionarioResumo = Omit<QuestionarioCompleto, 'questoes'>

export type AlternativaInput = {
  posicao: number
  texto: string
  valor: number
}

export type QuestaoInput = {
  posicao: number
  pergunta: string
  alternativas: AlternativaInput[]
}

export type CreateQuestionarioInput = {
  titulo: string
  descricao: string
  versao: number
  ativo?: boolean
  questoes: QuestaoInput[]
}

export type UpdateQuestionarioInput = Partial<{
  titulo: string
  descricao: string
  versao: number
  ativo: boolean
  questoes: QuestaoInput[]
}>

export function listQuestionarios() {
  return request<QuestionarioResumo[]>('/questionarios')
}

export function getActiveQuestionario(signal?: AbortSignal) {
  return request<QuestionarioCompleto>('/questionarios/ativo', { signal })
}

export function getQuestionario(id: string, signal?: AbortSignal) {
  return request<QuestionarioCompleto>(`/questionarios/${id}`, { signal })
}

export function createQuestionario(body: CreateQuestionarioInput) {
  return jsonRequest<QuestionarioCompleto>('/questionarios', {
    method: 'POST',
    body,
  })
}

export function updateQuestionario(id: string, body: UpdateQuestionarioInput) {
  return jsonRequest<QuestionarioCompleto>(`/questionarios/${id}`, {
    method: 'PUT',
    body,
  })
}
