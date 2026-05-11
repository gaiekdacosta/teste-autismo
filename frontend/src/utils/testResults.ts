import type { Resposta, Teste } from '../services/testes'

type TesteScoreData = Pick<Teste, 'pontuacao_total'> & {
  respostas?: Resposta[] | null
}

function getNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function calculateResponseScore(respostas: Resposta[] = []): number {
  return respostas.reduce((total, resposta) => {
    const valor = getNumber(resposta.valor) ?? getNumber(resposta.alternativa?.valor) ?? 0
    return total + valor
  }, 0)
}

export function getTesteScore(teste: TesteScoreData): number {
  if (teste.respostas?.length) {
    return calculateResponseScore(teste.respostas)
  }

  return getNumber(teste.pontuacao_total) ?? 0
}
