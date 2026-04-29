import { Navbar } from '../components/Navbar'
import { useNavigate } from 'react-router-dom'
import { FiDownload, FiCheckCircle, FiCalendar, FiClock, FiFileText, FiAlertTriangle, FiUser, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useState } from 'react'

type TestResult = {
  id: number
  name: string
  date: string
  time: string
  status: string
  preliminaryResult: string
  resultDescription: string
  duration: string
  specialist: string
  nextSteps: string[]
  recommendations: string[]
}

const mockTestResults: TestResult[] = [
  {
    id: 1,
    name: 'Avaliação Cognitiva - TEA',
    date: '15/04/2024',
    time: '14:30',
    status: 'Concluído',
    preliminaryResult: 'Indícios Leves',
    resultDescription: 'A avaliação indicou alguns traços associados ao espectro autista que merecem atenção especial. Recomendamos consulta com especialista para análise detalhada.',
    duration: '45 minutos',
    specialist: 'Dr. Tiago Marinho',
    nextSteps: [
      'Agendar consulta com especialista em neurodesenvolvimento',
      'Levar relatório completo para análise clínica',
      'Considerar avaliação complementar se necessário'
    ],
    recommendations: [
      'Buscar acompanhamento psicológico',
      'Pesquisar sobre estratégias de adaptação',
      'Conversar com família sobre os resultados'
    ]
  },
]

export function MyTestsPage() {
  const navigate = useNavigate()
  const [expandedSection, setExpandedSection] = useState<'details' | 'next-steps' | 'recommendations' | null>(null)

  const handleDownloadPDF = (testId: number, testName: string) => {
    console.log(`Baixando PDF do teste ${testId}: ${testName}`)
    // Simulação de download
    const link = document.createElement('a')
    link.href = '#'
    link.download = `resultado-${testName.toLowerCase().replace(/\s+/g, '-')}-${testId}.pdf`
    link.click()
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      <main className="md:ml-[280px] min-h-screen">
        <div className="h-16 md:hidden" />
        
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Cabeçalho */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Meus Testes
              </h1>
              <p className="text-[var(--muted)]">
                Acompanhe seus testes e avaliações realizadas
              </p>
            </div>

            {/* Teste Realizado - Layout Ampliado */}
            <div className="space-y-6">
              {mockTestResults.map((test) => (
                <div key={test.id} className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface)]/80 p-4 sm:p-6 lg:p-8 shadow-xl">
                  {/* Cabeçalho Principal */}
                  <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3 sm:p-4 border border-green-500/30">
                          <FiCheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-2">
                            {test.name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                              {test.status}
                            </span>
                            <span className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border ${
                              test.preliminaryResult === 'Indícios Leves' 
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            }`}>
                              {test.preliminaryResult}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações Básicas */}
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <FiCalendar className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
                        <span className="text-xs sm:text-sm font-medium text-[var(--muted)]">Data</span>
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-[var(--foreground)]">{test.date}</p>
                    </div>
                    
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <FiClock className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
                        <span className="text-xs sm:text-sm font-medium text-[var(--muted)]">Horário & Duração</span>
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-[var(--foreground)]">{test.time} • {test.duration}</p>
                    </div>
                    
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <FiUser className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
                        <span className="text-xs sm:text-sm font-medium text-[var(--muted)]">Especialista</span>
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-[var(--foreground)]">{test.specialist}</p>
                    </div>
                  </div>

                  {/* Resultado Detalhado */}
                  <div className="mb-6 sm:mb-8">
                    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--background)] to-[var(--background)]/80 p-4 sm:p-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <FiFileText className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--primary)]" />
                        <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)]">Análise do Resultado</h3>
                      </div>
                      
                      <div className="mb-4 sm:mb-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="rounded-full bg-yellow-500/20 p-1.5 sm:p-2 mt-0.5 sm:mt-1 border border-yellow-500/30">
                            <FiAlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-2">Resultado Preliminar</h4>
                            <p className="text-sm sm:text-base text-[var(--foreground)] leading-relaxed mb-3 sm:mb-4">
                              {test.resultDescription}
                            </p>
                            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 sm:p-4">
                              <p className="text-xs sm:text-sm text-yellow-400 font-medium">
                                <strong>Importante:</strong> Este é um resultado preliminar e não substitui uma avaliação clínica completa. 
                                Consulte um especialista para interpretação adequada dos resultados.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seções Expansíveis */}
                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    {/* Próximos Passos */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedSection(expandedSection === 'next-steps' ? null : 'next-steps')}
                        className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-[var(--surface)]/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="rounded-full bg-blue-500/20 p-1.5 sm:p-2 border border-blue-500/30">
                            <FiCalendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Próximos Passos</h3>
                        </div>
                        {expandedSection === 'next-steps' ? (
                          <FiChevronUp className="h-5 w-5 text-[var(--muted)]" />
                        ) : (
                          <FiChevronDown className="h-5 w-5 text-[var(--muted)]" />
                        )}
                      </button>
                      
                      {expandedSection === 'next-steps' && (
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                          <ul className="space-y-2 sm:space-y-3">
                            {test.nextSteps.map((step, index) => (
                              <li key={index} className="flex items-start gap-2 sm:gap-3">
                                <span className="rounded-full bg-blue-500/20 text-blue-400 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </span>
                                <span className="text-sm sm:text-base text-[var(--foreground)]">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Recomendações */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedSection(expandedSection === 'recommendations' ? null : 'recommendations')}
                        className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-[var(--surface)]/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="rounded-full bg-purple-500/20 p-1.5 sm:p-2 border border-purple-500/30">
                            <FiAlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Recomendações</h3>
                        </div>
                        {expandedSection === 'recommendations' ? (
                          <FiChevronUp className="h-5 w-5 text-[var(--muted)]" />
                        ) : (
                          <FiChevronDown className="h-5 w-5 text-[var(--muted)]" />
                        )}
                      </button>
                      
                      {expandedSection === 'recommendations' && (
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                          <ul className="space-y-2 sm:space-y-3">
                            {test.recommendations.map((recommendation, index) => (
                              <li key={index} className="flex items-start gap-2 sm:gap-3">
                                <span className="text-purple-400 text-lg sm:text-xl leading-none mt-1">•</span>
                                <span className="text-sm sm:text-base text-[var(--foreground)]">{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-4 sm:pt-6 border-t border-[var(--border)]">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(test.id, test.name)}
                        className="flex-1 inline-flex items-center justify-center gap-3 px-5 py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-black font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                      >
                        <FiDownload className="h-4 w-4 sm:h-5 sm:w-5" />
                        Baixar Relatório PDF
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => navigate('/nossos-servicos')}
                        className="flex-1 inline-flex items-center justify-center gap-3 px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                      >
                        <FiCalendar className="h-4 w-4 sm:h-5 sm:w-5" />
                        Agendar Consulta
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}