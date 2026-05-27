import { useEffect, useState } from 'react'
import { FiSettings } from 'react-icons/fi'

import { Navbar } from '../../components/Navbar'
import { ApiError } from '../../services/api'
import {
    getActiveQuestionario,
    updateQuestionario,
} from '../../services/questionarios'

import type {
    Alternativa,
    QuestionarioCompleto,
    QuestaoInput,
} from '../../services/questionarios'

import { Contact } from '../../components/admin/Contact'
import { MenuAdministrator } from '../../components/admin/MenuAdministrator'
import { QuestionnaireEdit } from '../../components/admin/QuestionnaireEdit'

import type {
    Question,
    QuestionScoreRule,
} from '../../components/admin/QuestionnaireEdit'

import { ServicesEdit } from '@/components/admin/ServicesEdit'

const inputClassName =
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]'

const sectionClassName =
    'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6'

const defaultAlternativas: Alternativa[] = [
    {
        id: 'concordo-totalmente',
        posicao: 1,
        texto: 'Concordo Totalmente',
        valor: 1,
    },
    {
        id: 'concordo-parcialmente',
        posicao: 2,
        texto: 'Concordo em Parte',
        valor: 1,
    },
    {
        id: 'discordo-parcialmente',
        posicao: 3,
        texto: 'Discordo em Parte',
        valor: 0,
    },
    {
        id: 'discordo-totalmente',
        posicao: 4,
        texto: 'Discordo Totalmente',
        valor: 0,
    },
]

function getErrorMessage(error: unknown) {
    if (error instanceof ApiError && error.status === 404) {
        return 'Nenhum questionário encontrado. Cadastre um questionário para continuar.'
    }

    if (error instanceof Error) {
        return error.message
    }

    return 'Não foi possível conectar com a API.'
}

function getScoreRule(
    alternativas: Alternativa[],
): QuestionScoreRule {
    const firstScoredAlternative = alternativas
        .slice()
        .sort(
            (first, second) =>
                first.posicao - second.posicao,
        )
        .find((alternativa) => alternativa.valor > 0)

    return firstScoredAlternative &&
        firstScoredAlternative.posicao > 2
        ? 'discordo'
        : 'concordo'
}

function mapQuestionarioToQuestions(
    questionario: QuestionarioCompleto,
): Question[] {
    return questionario.questoes.map((questao) => ({
        id: questao.id,
        position: questao.posicao,
        group: 'Questionário ativo',
        text: questao.pergunta,
        scoreRule: getScoreRule(questao.alternativas),
        alternativas:
            questao.alternativas.length > 0
                ? questao.alternativas
                : defaultAlternativas,
    }))
}

function buildAlternativasInput(question: Question) {
    return question.alternativas.map((alternativa) => {
        const shouldScore =
            question.scoreRule === 'concordo'
                ? alternativa.posicao <= 2
                : alternativa.posicao > 2

        return {
            posicao: alternativa.posicao,
            texto: alternativa.texto,
            valor: shouldScore ? 1 : 0,
        }
    })
}

function buildQuestoesInput(
    questions: Question[],
): QuestaoInput[] {
    return questions
        .slice()
        .sort(
            (first, second) =>
                first.position - second.position,
        )
        .map((question) => ({
            posicao: question.position,
            pergunta: question.text,
            alternativas: buildAlternativasInput(question),
        }))
}

export function AdminPage() {
    const [questionario, setQuestionario] =
        useState<QuestionarioCompleto | null>(null)

    const [questions, setQuestions] = useState<Question[]>([])

    const [isLoadingQuestionario, setIsLoadingQuestionario] =
        useState(true)

    const [isSavingQuestionario, setIsSavingQuestionario] =
        useState(false)

    const [errorMessage, setErrorMessage] = useState('')

    const [successMessage, setSuccessMessage] =
        useState('')

    useEffect(() => {
        const controller = new AbortController()

        async function loadQuestionario() {
            try {
                setIsLoadingQuestionario(true)
                setErrorMessage('')

                const activeQuestionario =
                    await getActiveQuestionario(
                        controller.signal,
                    )

                setQuestionario(activeQuestionario)

                setQuestions(
                    mapQuestionarioToQuestions(
                        activeQuestionario,
                    ),
                )
            } catch (error) {
                if (controller.signal.aborted) return

                setErrorMessage(getErrorMessage(error))
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingQuestionario(false)
                }
            }
        }

        void loadQuestionario()

        return () => controller.abort()
    }, [])

    function updateQuestionText(
        questionId: string,
        text: string,
    ) {
        setQuestions((currentQuestions) =>
            currentQuestions.map((question) =>
                question.id === questionId
                    ? { ...question, text }
                    : question,
            ),
        )
    }

    function updateQuestionScoreRule(
        questionId: string,
        scoreRule: QuestionScoreRule,
    ) {
        setQuestions((currentQuestions) =>
            currentQuestions.map((question) =>
                question.id === questionId
                    ? { ...question, scoreRule }
                    : question,
            ),
        )
    }

    async function handleSaveQuestionario() {
        if (!questionario) {
            setErrorMessage(
                'Carregue um questionário ativo antes de salvar.',
            )

            return
        }

        try {
            setIsSavingQuestionario(true)
            setErrorMessage('')
            setSuccessMessage('')

            const updatedQuestionario =
                await updateQuestionario(
                    questionario.id,
                    {
                        titulo: questionario.titulo,
                        descricao: questionario.descricao,
                        versao: questionario.versao,
                        ativo: questionario.ativo,
                        questoes:
                            buildQuestoesInput(
                                questions,
                            ),
                    },
                )

            setQuestionario(updatedQuestionario)

            setQuestions(
                mapQuestionarioToQuestions(
                    updatedQuestionario,
                ),
            )

            setSuccessMessage(
                'Questionário salvo na API.',
            )
        } catch (error) {
            setErrorMessage(getErrorMessage(error))
        } finally {
            setIsSavingQuestionario(false)
        }
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <Navbar />

            <main className="px-4 pb-10 pt-20 md:ml-[280px] md:px-8 md:py-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <section className={sectionClassName}>
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-start gap-3">
                                <FiSettings className="mt-1 h-5 w-5 text-[var(--foreground)]" />

                                <div>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--primary)]">
                                        Administração
                                    </span>

                                    <h1 className="mt-2 text-xl font-bold text-[var(--foreground)] md:text-2xl">
                                        Central de controle
                                    </h1>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                                        Ajuste os dados de
                                        contato, valores dos
                                        serviços e perguntas do
                                        questionário.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <MenuAdministrator />

                    <Contact />

                    <ServicesEdit
                        inputClassName={
                            inputClassName
                        }
                        sectionClassName={
                            sectionClassName
                        }
                    />

                    <QuestionnaireEdit
                        questions={questions}
                        isLoadingQuestionario={
                            isLoadingQuestionario
                        }
                        isSavingQuestionario={
                            isSavingQuestionario
                        }
                        errorMessage={errorMessage}
                        successMessage={
                            successMessage
                        }
                        updateQuestionText={
                            updateQuestionText
                        }
                        updateQuestionScoreRule={
                            updateQuestionScoreRule
                        }
                        onSaveQuestionario={
                            handleSaveQuestionario
                        }
                    />
                </div>
            </main>
        </div>
    )
}