import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Button } from '../components/ui/Button'

type Question = {
    id: number
    pergunta: string
    pontua_1_se: 'concordo' | 'discordo'
}

type AnswerOption = 'concordo_totalmente' | 'concordo_parcialmente' | 'discordo_parcialmente' | 'discordo_totalmente'

const questionsData: Question[] = [
    {
        id: 1,
        pergunta: 'Muitas vezes percebo pequenos sons quando os outros não percebem.',
        pontua_1_se: 'concordo'
    },
    {
        id: 2,
        pergunta: 'Normalmente concentro-me mais na imagem completa do que nos pequenos detalhes.',
        pontua_1_se: 'discordo'
    },
    {
        id: 3,
        pergunta: 'Acho difícil entender as intenções das pessoas.',
        pontua_1_se: 'concordo'
    },
    {
        id: 4,
        pergunta: 'Acho difícil entender o que um personagem de uma história está pensando.',
        pontua_1_se: 'concordo'
    },
    {
        id: 5,
        pergunta: 'Acho fácil ler nas entrelinhas quando alguém está falando comigo.',
        pontua_1_se: 'discordo'
    },
    {
        id: 6,
        pergunta: 'Sei perceber se alguém que está me ouvindo está ficando entediado.',
        pontua_1_se: 'discordo'
    },
    {
        id: 7,
        pergunta: 'Acho fácil fazer mais de uma coisa ao mesmo tempo.',
        pontua_1_se: 'discordo'
    },
    {
        id: 8,
        pergunta: 'Acho fácil descobrir o que alguém está pensando ou sentindo.',
        pontua_1_se: 'discordo'
    },
    {
        id: 9,
        pergunta: 'Acho fácil imaginar como seria ser outra pessoa.',
        pontua_1_se: 'discordo'
    },
    {
        id: 10,
        pergunta: 'Acho fácil me ajustar a novas situações sociais.',
        pontua_1_se: 'discordo'
    }
]

const answerOptions: { value: AnswerOption; label: string }[] = [
    { value: 'concordo_totalmente', label: 'Concordo Totalmente' },
    { value: 'concordo_parcialmente', label: 'Concordo em Parte' },
    { value: 'discordo_parcialmente', label: 'Discordo em Parte' },
    { value: 'discordo_totalmente', label: 'Discordo Totalmente' }
]

export function QuestionnairePage() {
    const navigate = useNavigate()
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, AnswerOption>>({})
    const [showCompletion, setShowCompletion] = useState(false)

    const currentQuestion = questionsData[currentQuestionIndex]
    const answeredCount = Object.keys(answers).length
    const progress = Math.round((answeredCount / questionsData.length) * 100)

    function handleAnswer(answer: AnswerOption) {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))
    }

    function handlePrevious() {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }

    function handleNext() {
        if (currentQuestionIndex < questionsData.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            calculateAndShowResult()
        }
    }

    function calculateScore() {
        let score = 0

        questionsData.forEach(question => {
            const answer = answers[question.id]
            if (!answer) return

            const isAgree = answer === 'concordo_totalmente' || answer === 'concordo_parcialmente'
            const isDisagree = answer === 'discordo_parcialmente' || answer === 'discordo_totalmente'

            if (question.pontua_1_se === 'concordo' && isAgree) {
                score += 1
            } else if (question.pontua_1_se === 'discordo' && isDisagree) {
                score += 1
            }
        })

        return score
    }

    function calculateAndShowResult() {
        const score = calculateScore()
        console.log('Score:', score)
        setShowCompletion(true)
    }

    useEffect(() => {
        if (showCompletion) {
            const timer = setTimeout(() => {
                navigate('/meus-testes')
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [showCompletion, navigate])

    function goToQuestion(index: number) {
        setCurrentQuestionIndex(index)
    }

    return (
        <div className="min-h-screen bg-(--background)">
            <Navbar />

            <main className="md:ml-(280px) min-h-screen">
                <div className="h-16 md:hidden" />

                <div className="p-6">
                    <div className="max-w-5xl mx-auto">
                        {/* Progress Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-(--foreground)">
                                    Progresso do Teste
                                </h2>
                                <span className="text-sm font-medium text-(--muted)">
                                    {answeredCount} de {questionsData.length} respondidas ({progress}%)
                                </span>
                            </div>

                            {/* Progress Bar */}
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
                                    Parabéns!
                                </h3>
                                <p className="text-(--muted) text-lg mb-6">
                                    Você concluiu o questionário com sucesso.
                                </p>
                                <p className="text-sm text-(--muted)">
                                    Redirecionando para o seu teste...
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 md:p-8 mb-8">
                                <div className="mb-6">
                                    <span className="text-sm font-medium text-(--muted)">
                                        Pergunta {currentQuestionIndex + 1} de {questionsData.length}
                                    </span>
                                </div>

                                <h3 className="text-xl md:text-2xl font-semibold text-(--foreground) mb-8 leading-relaxed">
                                    {currentQuestion.pergunta}
                                </h3>

                                {/* Answer Options */}
                                <div className="space-y-3">
                                    {answerOptions.map((option) => {
                                        const isSelected = answers[currentQuestion.id] === option.value

                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => handleAnswer(option.value)}
                                                className={`
                            w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200
                            flex items-center gap-4
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
                                                    {option.label}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {!showCompletion && (
                            <>
                                {/* Navigation */}
                                <div className="flex items-center justify-between gap-4">
                                    <Button
                                        variant="secondary"
                                        onClick={handlePrevious}
                                        disabled={currentQuestionIndex === 0}
                                        className="flex-1 sm:flex-none"
                                    >
                                        Anterior
                                    </Button>

                                    {/* Progress Dots */}
                                    <div className="hidden sm:flex items-center gap-2 flex-1 justify-center">
                                        {questionsData.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => goToQuestion(index)}
                                                className={`
                          w-2.5 h-2.5 rounded-full transition-all duration-200
                          ${index === currentQuestionIndex
                                                        ? 'bg-(--primary) w-6'
                                                        : answers[questionsData[index].id]
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
                                        disabled={!answers[currentQuestion.id]}
                                        className="flex-1 sm:flex-none"
                                    >
                                        {currentQuestionIndex === questionsData.length - 1 ? 'Finalizar' : 'Próxima'}
                                    </Button>
                                </div>

                                {/* Mobile Progress Dots */}
                                <div className="flex sm:hidden items-center justify-center gap-2 mt-4 overflow-x-auto py-2">
                                    {questionsData.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToQuestion(index)}
                                            className={`
                        w-2.5 h-2.5 rounded-full transition-all duration-200 flex-shrink-0
                        ${index === currentQuestionIndex
                                                    ? 'bg-(--primary) w-6'
                                                    : answers[questionsData[index].id]
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
                    </div>
                </div>
            </main>
        </div>
    )
}
