import { Navbar } from '../components/Navbar'
import { useNavigate } from 'react-router-dom'
import {
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiDownload,
  FiFileText,
  FiInfo,
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { generateTestResultPDF } from '../services/generatePDF'
import { listTestes, type Teste } from '../services/testes'
import { supabase } from '../utils/supabase'
import { getTesteScore } from '../utils/testResults'

export function MyTestsPage() {
  const navigate = useNavigate()
  const [testes, setTestes] = useState<Teste[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null)
  const teste = testes[0]
  const score = teste ? getTesteScore(teste) : 0
  const completedAt = teste?.finished_at ?? teste?.updated_at

  useEffect(() => {
    async function loadTestes() {
      try {
        setIsLoading(true)
        setError('')
        const data = await listTestes()
        setTestes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar testes')
      } finally {
        setIsLoading(false)
      }
    }

    loadTestes()
  }, [])

  const handleDownloadPDF = async (teste: Teste) => {
    try {
      setPdfError('')
      setGeneratingPdfId(teste.id ?? null)
      const { data, error: userError } = await supabase.auth.getUser()

      if (userError) {
        throw new Error('Não foi possível carregar os dados do usuário.')
      }

      const metadata = data.user?.user_metadata ?? {}

      generateTestResultPDF(teste, {
        name: getMetadataText(metadata.name) || getMetadataText(metadata.full_name),
        email: data.user?.email,
        phone: data.user?.phone || getMetadataText(metadata.phone),
        birthDate: getMetadataText(metadata.birthDate),
        gender: getMetadataText(metadata.gender),
      })
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
      setPdfError('Não foi possível baixar o PDF. Tente novamente em alguns instantes.')
    } finally {
      setGeneratingPdfId(null)
    }
  }

  function getMetadataText(value: unknown) {
    return typeof value === 'string' ? value : undefined
  }

  function formatDateTime(value?: string | null) {
    if (!value) return 'Não informado'

    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatStatus(status: string) {
    const statusMap: Record<string, string> = {
      concluido: 'Concluído',
      em_andamento: 'Em andamento',
      pendente: 'Pendente',
      cancelado: 'Cancelado',
    }

    return statusMap[status] ?? status
  }

  function getStatusStyles(status: string) {
    if (status === 'concluido') return 'bg-green-500/15 text-green-400 border-green-500/30'
    if (status === 'em_andamento') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'

    return 'bg-[var(--surface-secondary)] text-[var(--muted)] border-[var(--border)]'
  }

  function getClassificationStyles(classificacao?: string | null) {
    const normalized = classificacao?.toLowerCase() ?? ''

    if (normalized.includes('alto') || normalized.includes('elevado')) {
      return 'bg-red-500/15 text-red-300 border-red-500/30'
    }

    if (normalized.includes('moderado') || normalized.includes('limítrofe') || normalized.includes('leves')) {
      return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
    }

    return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  }

  function getNextStep(teste: Teste) {
    if (teste.status !== 'concluido') {
      return 'Finalize o questionário para liberar pontuação, classificação e relatório em PDF.'
    }

    if (!teste.classificacao) {
      return 'Resultado disponível. Agende uma consulta para interpretação clínica individualizada.'
    }

    return 'Use o PDF como apoio e agende uma consulta para discutir os próximos passos.'
  }

  function getResultDescription(teste: Teste) {
    if (teste.status !== 'concluido') {
      return 'Seu questionário foi iniciado, mas ainda precisa ser concluído para gerar a pontuação e o relatório.'
    }

    if (teste.classificacao) {
      return `Seu resultado preliminar foi classificado como ${teste.classificacao}. Esse rastreio organiza sinais observados, mas não substitui avaliação clínica.`
    }

    return 'Seu resultado já está disponível para consulta e pode ser usado como apoio em uma avaliação especializada.'
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      <main className="md:ml-[280px] min-h-screen">
        <div className="h-16 md:hidden" />
        
        <div className="px-4 pb-10 pt-4 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">
                  Meu Teste
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium text-[var(--muted)] sm:text-base">
                  Consulte o resultado do seu questionário, baixe o PDF e veja os próximos passos recomendados.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {pdfError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {pdfError}
                </div>
              )}

              {isLoading && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--muted)]">
                  Carregando seus testes...
                </div>
              )}

              {!isLoading && error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-300">
                  <FiAlertCircle className="mx-auto mb-3 h-6 w-6" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {!isLoading && !error && testes.length === 0 && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
                  <div className="mx-auto max-w-2xl text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]/15">
                      <FiFileText className="h-7 w-7 text-[var(--primary)]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">
                      Nenhum teste realizado ainda
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      Cada usuário realiza um teste. Ao concluir o questionário, esta área exibirá sua pontuação, classificação, dados do teste e acesso ao PDF do resultado.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/questionario')}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)]"
                    >
                      <FiFileText className="h-4 w-4" />
                      Realizar primeiro teste
                    </button>
                  </div>
                </div>
              )}

              {!isLoading && !error && teste && (
                <>
                  <section className="rounded-2xl border border-[var(--border)] bg-[#070707] p-4 sm:p-6">
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(teste.status)}`}>
                            {formatStatus(teste.status)}
                          </span>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getClassificationStyles(teste.classificacao)}`}>
                            {teste.classificacao || 'Classificação não informada'}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-[var(--foreground)] md:text-2xl">
                          {teste.questionario?.titulo || 'Teste de rastreio'}
                        </h2>
                        {teste.questionario?.descricao && (
                          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                            {teste.questionario.descricao}
                          </p>
                        )}
                      </div>

                      <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                        <FiClock className="h-3.5 w-3.5" />
                        {formatDateTime(completedAt)}
                      </span>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                        <p className="text-sm font-medium text-[var(--muted)]">Pontuação total</p>
                        <div className="mt-3 flex items-end gap-2">
                          <span className="text-5xl font-bold text-[var(--foreground)]">{score}</span>
                          <span className="mb-2 text-sm font-medium text-[var(--muted)]">pontos</span>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                          {getResultDescription(teste)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                          <FiInfo className="h-4 w-4 text-[var(--primary)]" />
                          Próximo passo sugerido
                        </div>
                        <p className="text-sm leading-6 text-[var(--muted)]">{getNextStep(teste)}</p>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(teste)}
                            disabled={generatingPdfId === teste.id}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <FiDownload className="h-4 w-4" />
                            {generatingPdfId === teste.id ? 'Gerando PDF...' : 'Baixar PDF'}
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('/nossos-servicos')}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]/50"
                          >
                            <FiCalendar className="h-4 w-4" />
                            Agendar consulta
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                      <p className="text-sm font-medium leading-6 text-yellow-300">
                        Este resultado é preliminar e não possui valor diagnóstico. Para confirmação ou interpretação adequada, procure acompanhamento profissional.
                      </p>
                    </div>
                  </section>

                  
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
