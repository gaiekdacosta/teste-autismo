import { Navbar } from '../components/Navbar'
import { FiCheckCircle, FiCalendar, FiMessageCircle, FiArrowRight } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import type { Todo } from '../App'
import { FaInfo } from 'react-icons/fa'

type HomeProps = {
  todos: Todo[]
}

const mockTests = [
  // finalizar informações de resultado
  { id: 1, name: 'Avaliação Cognitiva', status: 'Concluído', date: '15/04/2024', resultado: '' },
]

const mockAppointments = [
  { id: 2, title: 'Consulta com Psicólogo', date: '15/04/2024', time: '10:00', status: 'Concluído' }
]

export function Home({ todos }: HomeProps) {
  const navigate = useNavigate()
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

            {/* Testes */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[var(--primary)]/20 p-3">
                    <FiCheckCircle className="h-6 w-6 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">Meus Testes</h2>
                </div>
                <button
                  onClick={() => navigate('/meus-testes')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Detalhes
                </button>
              </div>
              
              <div className="space-y-4">
                {mockTests.map((test) => (
                  <div key={test.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{test.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="text-[var(--muted)] font-medium">{test.date}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            test.status === 'Concluído' ? 'bg-green-500/20 text-green-400' :
                            test.status === 'Em andamento' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {test.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[var(--primary)]/20 p-3">
                    <FiCalendar className="h-6 w-6 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">Agendamentos</h2>
                </div>
                <button
                  onClick={() => navigate('/meus-agendamentos')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Detalhes
                </button>
              </div>
              
              <div className="space-y-4">
                {mockAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{appointment.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
                          <span className="font-medium">{appointment.date}</span>
                          <span className="font-medium">{appointment.time}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            appointment.status === 'Concluído' ? 'bg-green-500/20 text-green-400' :
                            appointment.status === 'Agendado' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

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
                      href="https://wa.me/5511999999999"
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

            {/* Todos (mantido para compatibilidade) */}
            {todos.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Tarefas</h2>
                <div className="space-y-3">
                  {todos.map((todo) => (
                    <div key={todo.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                      <p className="text-[var(--foreground)] font-medium">{todo.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}