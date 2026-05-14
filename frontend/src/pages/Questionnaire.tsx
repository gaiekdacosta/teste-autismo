import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Button } from '../components/ui/Button'
import { ApiError } from '../services/api'
import { getStoredSession } from '../services/auth'
import { getActiveQuestionario } from '../services/questionarios'
import type { QuestionarioCompleto } from '../services/questionarios'
import {
    completeExistingTeste,
    createAvaliado,
    createTeste,
    getTeste,
    listTestes,
    saveTesteRespostas,
} from '../services/testes'

type Answers = Record<string, string>

function getErrorMessage(error: unknown) {
    if (error instanceof ApiError && error.status === 404) {
        return 'Nenhum questionário ativo foi encontrado.'
    }

    if (error instanceof Error) {
        return error.message
    }

    return 'Não foi possível carregar o questionário.'
}

export function QuestionnairePage() {
    const navigate = useNavigate()
    const [questionario, setQuestionario] = useState<QuestionarioCompleto | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Answers>({})
    const [testeId, setTesteId] = useState('')
    const [avaliadoId, setAvaliadoId] = useState('')
    const [showCompletion, setShowCompletion] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSavingAnswer, setIsSavingAnswer] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [submitErrorMessage, setSubmitErrorMessage] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        async function loadQuestionario() {
            try {
                setIsLoading(true)
                setErrorMessage('')
                const [activeQuestionario, userTestes] = await Promise.all([
                    getActiveQuestionario(controller.signal),
                    listTestes(),
                ])

                const draft = userTestes.find((teste) =>
                    teste.status === 'em_andamento' &&
                    teste.id_questionario === activeQuestionario.id
                )

                setQuestionario(activeQuestionario)

                if (draft) {
                    const draftDetails = await getTeste(draft.id)
                    const restoredAnswers = draftDetails.respostas.reduce<Answers>((currentAnswers, resposta) => ({
                        ...currentAnswers,
                        [resposta.id_questao]: resposta.id_alternativa,
                    }), {})
                    const firstPendingIndex = activeQuestionario.questoes.findIndex((questao) => !restoredAnswers[questao.id])

                    setTesteId(draftDetails.id)
                    setAvaliadoId(draftDetails.id_avaliado ?? '')
                    setAnswers(restoredAnswers)
                    setCurrentQuestionIndex(firstPendingIndex >= 0 ? firstPendingIndex : 0)
                }
            } catch (error) {
                if (controller.signal.aborted) return
                setErrorMessage(getErrorMessage(error))
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        void loadQuestionario()

        return () => controller.abort()
    }, [])

    const questions = useMemo(() => questionario?.questoes ?? [], [questionario])
    const currentQuestion = questions[currentQuestionIndex]
    const answeredCount = Object.keys(answers).length
    const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0

    const selectedAlternatives = useMemo(() => {
        return questions.flatMap((question) => {
            const answerId = answers[question.id]
            const alternativa = question.alternativas.find((item) => item.id === answerId)
            return alternativa ? [alternativa] : []
        })
    }, [answers, questions])

    async function getOrCreateTesteId() {
        if (testeId) {
            return testeId
        }

        if (!questionario) {
            throw new Error('Questionário não carregado.')
        }

        const idAvaliado = await getAvaliadoId()
        const teste = await createTeste({
            id_questionario: questionario.id,
            id_avaliado: idAvaliado,
        })

        setTesteId(teste.id)

        return teste.id
    }

    async function handleAnswer(alternativaId: string) {
        if (!currentQuestion) return

        setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion.id]: alternativaId }))
        setSubmitErrorMessage('')

        try {
            setIsSavingAnswer(true)
            const currentTesteId = await getOrCreateTesteId()
            await saveTesteRespostas(currentTesteId, {
                respostas: [
                    {
                        id_questao: currentQuestion.id,
                        id_alternativa: alternativaId,
                    },
                ],
            })
        } catch (error) {
            setSubmitErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível salvar sua resposta.',
            )
        } finally {
            setIsSavingAnswer(false)
        }
    }

    function handlePrevious() {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((currentIndex) => currentIndex - 1)
        }
    }

    async function getAvaliadoId() {
        if (avaliadoId) {
            return avaliadoId
        }

        const session = getStoredSession()
        const user = session?.user

        if (!user?.name) {
            throw new Error('Usuário não autenticado.')
        }

        const avaliado = await createAvaliado({
            nome: user.name,
            data_nascimento: user.birthDate || undefined,
            genero: user.gender || undefined,
        })

        setAvaliadoId(avaliado.id)

        return avaliado.id
    }

    async function handleNext() {
        if (!currentQuestion) return

        setSubmitErrorMessage('')

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((currentIndex) => currentIndex + 1)
            return
        }

        if (!questionario || answeredCount < questions.length) {
            setSubmitErrorMessage('Responda todas as perguntas antes de finalizar.')
            return
        }

        const respostas = questions.map((question) => {
            const idAlternativa = answers[question.id]

            if (!idAlternativa) {
                throw new Error('Responda todas as perguntas antes de finalizar.')
            }

            return {
                id_questao: question.id,
                id_alternativa: idAlternativa,
            }
        })

        try {
            setIsSubmitting(true)
            const currentTesteId = await getOrCreateTesteId()
            await saveTesteRespostas(currentTesteId, {
                respostas,
            })
            await completeExistingTeste(currentTesteId)
            setShowCompletion(true)
        } catch (error) {
            setSubmitErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível salvar as respostas.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    function calculateScore() {
        return selectedAlternatives.reduce((score, alternativa) => score + alternativa.valor, 0)
    }

    useEffect(() => {
        if (!showCompletion) return

        const timer = setTimeout(() => {
            navigate('/meus-testes')
        }, 3000)

        return () => clearTimeout(timer)
    }, [showCompletion, navigate])

    function goToQuestion(index: number) {
        setCurrentQuestionIndex(index)
    }

    return (
        <div className="min-h-screen bg-(--background)">
            <Navbar />

            <main className="w-full md:pt-6 md:pl-[280px] min-h-screen">
                <div className="h-16 md:hidden" />

                <div className="p-6 w-full">
                    <div className="max-w-5xl mx-auto">
                        {isLoading && (
                            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 text-center text-(--muted)">
                                Carregando questionário...
                            </div>
                        )}

                        {!isLoading && errorMessage && (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                                <h2 className="text-lg font-semibold text-red-300">Erro ao carregar</h2>
                                <p className="mt-2 text-sm text-red-200">{errorMessage}</p>
                            </div>
                        )}

                        {!isLoading && !errorMessage && currentQuestion && (
                            <>
                                <div className="mb-8">
                                    <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h1 className="text-xl font-semibold text-(--foreground)">
                                                {questionario?.titulo}
                                            </h1>
                                            <p className="mt-1 text-sm text-(--muted)">
                                                {questionario?.descricao}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-(--muted)">
                                            {answeredCount} de {questions.length} respondidas ({progress}%)
                                        </span>
                                    </div>

                                    <div className="h-2 rounded-full bg-(--surface-secondary) overflow-hidden">
                                        <div
                                            className="h-full bg-(--primary) transition-all duration-300 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {showCompletion ? (
                                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 md:p-8 mb-8 text-center">
                                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-(--primary)/10 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-(--primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-semibold text-(--foreground) mb-4">
                                            Questionário concluído
                                        </h3>
                                        <p className="text-(--muted) text-lg mb-6">
                                            Sua pontuação preliminar foi {calculateScore()}.
                                        </p>
                                        <p className="text-sm text-(--muted)">
                                            Redirecionando para o seu teste...
                                        </p>
                                    </div>
                                ) : (
                                    <>

                                        <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 md:p-8 mb-8">
                                            <div className="mb-6">
                                                <span className="text-sm font-medium text-(--muted)">
                                                    Pergunta {currentQuestionIndex + 1} de {questions.length}
                                                </span>
                                            </div>

                                            <h3 className="text-xl md:text-2xl font-semibold text-(--foreground) mb-8 leading-relaxed">
                                                {currentQuestion.pergunta}
                                            </h3>

                                            <div className="space-y-3">
                                                {currentQuestion.alternativas.map((alternativa) => {
                                                    const isSelected = answers[currentQuestion.id] === alternativa.id

                                                    return (
                                                        <button
                                                            key={alternativa.id}
                                                            type="button"
                                                            onClick={() => void handleAnswer(alternativa.id)}
                                                            disabled={isSavingAnswer || isSubmitting}
                                                            className={`
                                                                w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200
                                                                flex items-center gap-4 disabled:cursor-not-allowed disabled:opacity-70
                                                                ${isSelected
                                                                    ? 'border-(--primary) bg-(--primary)/10'
                                                                    : 'border-(--border) bg-(--surface-secondary) hover:border-(--border) hover:bg-(--surface)'
                                                                }
                                                            `}
                                                        >
                                                            <div className={`
                                                                w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                                                ${isSelected
                                                                    ? 'border-(--primary) bg-(--primary)'
                                                                    : 'border-(--muted)'
                                                                }
                                                            `}>
                                                                {isSelected && (
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                                                )}
                                                            </div>
                                                            <span className={`
                                                                font-medium
                                                                ${isSelected ? 'text-(--foreground)' : 'text-(--muted)'}
                                                            `}>
                                                                {alternativa.texto}
                                                            </span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!showCompletion && (
                                    <>
                                        {submitErrorMessage && (
                                            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                                {submitErrorMessage}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between gap-4">
                                            <Button
                                                variant="secondary"
                                                onClick={handlePrevious}
                                                disabled={currentQuestionIndex === 0}
                                                className="flex-1 sm:flex-none"
                                            >
                                                Anterior
                                            </Button>

                                            <div className="hidden sm:flex items-center justify-center gap-1.5 flex-1 flex-wrap">
                                                {questions.map((question, index) => (
                                                    <button
                                                        key={question.id}
                                                        type="button"
                                                        onClick={() => goToQuestion(index)}
                                                        className={`
                                                            w-2 h-2 rounded-full transition-all duration-200 flex-shrink-0
                                                            ${index === currentQuestionIndex
                                                                ? 'bg-(--primary) w-4'
                                                                : answers[question.id]
                                                                    ? 'bg-(--primary)'
                                                                    : 'bg-(--surface-secondary)'
                                                            }
                                                        `}
                                                        aria-label={`Ir para pergunta ${index + 1}`}
                                                    />
                                                ))}
                                            </div>

                                            <Button
                                                onClick={handleNext}
                                                disabled={
                                                    isSubmitting ||
                                                    isSavingAnswer ||
                                                    !answers[currentQuestion.id] ||
                                                    (currentQuestionIndex === questions.length - 1 &&
                                                        answeredCount < questions.length)
                                                }
                                                className="flex-1 sm:flex-none"
                                            >
                                                {isSubmitting
                                                    ? 'Salvando...'
                                                    : isSavingAnswer
                                                        ? 'Salvando resposta...'
                                                    : currentQuestionIndex === questions.length - 1
                                                        ? 'Finalizar'
                                                        : 'Próxima'}
                                            </Button>
                                        </div>

                                        <div className="flex sm:hidden items-center justify-center gap-1.5 mt-4 flex-wrap py-2">
                                            {questions.map((question, index) => (
                                                <button
                                                    key={question.id}
                                                    type="button"
                                                    onClick={() => goToQuestion(index)}
                                                    className={`
                                                        w-2 h-2 rounded-full transition-all duration-200 flex-shrink-0
                                                        ${index === currentQuestionIndex
                                                            ? 'bg-(--primary) w-4'
                                                            : answers[question.id]
                                                                ? 'bg-(--primary)'
                                                                : 'bg-(--surface-secondary)'
                                                        }
                                                    `}
                                                    aria-label={`Ir para pergunta ${index + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
