import { Navbar } from '../components/Navbar'
import { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiCalendar, FiCheckCircle, FiMessageCircle, FiShoppingCart } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { listAgendamentos, type Agendamento } from '../services/agendamentos'
import { getContato, listTestes, type Contato, type Teste } from '../services/testes'

const defaultWhatsapp = '(11) 99999-9999'

function formatDate(value?: string | null) {
  if (!value) return 'Data não informada'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data não informada'

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function formatTime(value?: string | null) {
  if (!value) return 'Horário não informado'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Horário não informado'

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getStatusStyles(status: string) {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus === 'concluido' || normalizedStatus === 'concluído') {
    return 'bg-green-500/20 text-green-400'
  }

  if (normalizedStatus === 'em_andamento' || normalizedStatus === 'agendado' || normalizedStatus === 'confirmado') {
    return 'bg-blue-500/20 text-blue-400'
  }

  return 'bg-gray-500/20 text-gray-400'
}

function formatWhatsappUrlNumber(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, '')

  if (digits.startsWith('55')) {
    return digits
  }

  return `55${digits}`
}

export function Home() {
  const navigate = useNavigate()
  const [testes, setTestes] = useState<Teste[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [contact, setContact] = useState<Pick<Contato, 'whatsapp'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const whatsapp = contact?.whatsapp?.trim() || defaultWhatsapp
  const whatsappUrl = useMemo(() => {
    const message = encodeURIComponent('Olá, gostaria de mais informações sobre testes e agendamentos.')
    return `https://wa.me/${formatWhatsappUrlNumber(whatsapp)}?text=${message}`
  }, [whatsapp])
  const hasUserRecords = testes.length > 0 || agendamentos.length > 0

  useEffect(() => {
    let isMounted = true

    async function loadHomeData() {
      try {
        setIsLoading(true)
        setError(null)

        const [testesData, agendamentosData, contatoData] = await Promise.all([
          listTestes(),
          listAgendamentos(),
          getContato().catch(() => null),
        ])

        if (isMounted) {
          setTestes(testesData)
          setAgendamentos(agendamentosData)
          setContact(contatoData)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar seus dados.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadHomeData()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      <main className="md:ml-[280px] min-h-screen">
        <div className="h-16 md:hidden" />
        
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Cabeçalho */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Bem-vindo de volta!
              </h1>
              <p className="text-[var(--muted)] font-medium">
                Acompanhe seu progresso e próximos passos
              </p>
            </div>

            {isLoading && (
              <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm font-medium text-[var(--muted)]">
                Carregando seus testes e agendamentos...
              </div>
            )}

            {!isLoading && error && (
              <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
                <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {!isLoading && !error && !hasUserRecords && (
              <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">
                      Você ainda não possui testes ou agendamentos
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                      Escolha um serviço para iniciar sua avaliação ou solicitar uma consulta.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/nossos-servicos')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] sm:w-auto"
                  >
                    <FiShoppingCart className="h-4 w-4" />
                    Ver serviços
                  </button>
                </div>
              </section>
            )}

            {!isLoading && !error && hasUserRecords && (
              <>
                <section className="mb-8">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[var(--primary)]/20 p-3">
                        <FiCheckCircle className="h-6 w-6 text-[var(--primary)]" />
                      </div>
                      <h2 className="text-xl font-semibold text-[var(--foreground)]">Meus Testes</h2>
                    </div>
                    <button
                      onClick={() => navigate('/meus-testes')}
                      className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-[var(--primary)]/90"
                    >
                      Detalhes
                    </button>
                  </div>

                  <div className="space-y-4">
                    {testes.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
                        Nenhum teste realizado ainda.
                      </div>
                    )}

                    {testes.slice(0, 3).map((teste) => (
                      <div key={teste.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
                              {teste.questionario?.titulo || 'Teste de rastreio'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <span className="font-medium text-[var(--muted)]">
                                {formatDate(teste.finished_at ?? teste.updated_at ?? teste.created_at)}
                              </span>
                              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusStyles(teste.status)}`}>
                                {formatStatus(teste.status)}
                              </span>
                              {teste.classificacao && (
                                <span className="font-medium text-[var(--muted)]">
                                  {teste.classificacao}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mb-8">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[var(--primary)]/20 p-3">
                        <FiCalendar className="h-6 w-6 text-[var(--primary)]" />
                      </div>
                      <h2 className="text-xl font-semibold text-[var(--foreground)]">Agendamentos</h2>
                    </div>
                    <button
                      onClick={() => navigate('/meus-agendamentos')}
                      className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-[var(--primary)]/90"
                    >
                      Detalhes
                    </button>
                  </div>

                  <div className="space-y-4">
                    {agendamentos.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
                        Nenhum agendamento encontrado.
                      </div>
                    )}

                    {agendamentos.slice(0, 3).map((agendamento) => (
                      <div key={agendamento.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
                              Consulta especializada
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
                              <span className="font-medium">{formatDate(agendamento.data_agendamento)}</span>
                              <span className="font-medium">{formatTime(agendamento.data_agendamento)}</span>
                              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusStyles(agendamento.status)}`}>
                                {formatStatus(agendamento.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Contato via WhatsApp */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[var(--primary)]/20 p-3">
                    <FiMessageCircle className="h-6 w-6 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">Contato Rápido</h2>
                </div>
              </div>
              
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Fale conosco pelo WhatsApp</h3>
                    <p className="text-[var(--muted)] font-medium mb-4">
                      Tire suas dúvidas, agende consultas ou receba suporte rápido da nossa equipe
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-[var(--muted)] font-medium">Atendimento de segunda a sexta</span>
                      <span className="text-[var(--muted)] font-medium">8h às 18h</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors duration-200"
                    >
                      <FiMessageCircle className="h-5 w-5" />
                      Abrir WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}
