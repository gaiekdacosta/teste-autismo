import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
    FiDollarSign,
    FiEdit3,
    FiMail,
    FiMessageCircle,
    FiSave,
    FiSettings,
} from 'react-icons/fi'

import { Navbar } from '../../components/Navbar'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { createQuestionario, getActiveQuestionario, updateQuestionario } from '../../services/questionarios'
import type { Alternativa, QuestionarioCompleto, QuestaoInput } from '../../services/questionarios'

type ServicePrice = {
    id: string
    name: string
    description: string
    price: string
}

type QuestionScoreRule = 'concordo' | 'discordo'

type Question = {
    id: string
    position: number
    group: string
    text: string
    scoreRule: QuestionScoreRule
    alternativas: Alternativa[]
}

type DefaultQuestion = {
    text: string
    scoreRule: QuestionScoreRule
}

const initialServices: ServicePrice[] = [
    {
        id: 'testes-consultas',
        name: 'Testes + Consultas',
        description: 'Pacote completo',
        price: '450,00',
    },
    {
        id: 'apenas-testes',
        name: 'Apenas Testes',
        description: 'Teste avulso',
        price: '49,00',
    },
    {
        id: 'apenas-consulta',
        name: 'Apenas Consulta',
        description: 'Consulta avulsa',
        price: '400,00',
    },
]

const inputClassName =
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]'

const sectionClassName =
    'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6'

const defaultAlternativas: Alternativa[] = [
    { id: 'concordo-totalmente', posicao: 1, texto: 'Concordo Totalmente', valor: 1 },
    { id: 'concordo-parcialmente', posicao: 2, texto: 'Concordo em Parte', valor: 1 },
    { id: 'discordo-parcialmente', posicao: 3, texto: 'Discordo em Parte', valor: 0 },
    { id: 'discordo-totalmente', posicao: 4, texto: 'Discordo Totalmente', valor: 0 },
]

const defaultQuestions: DefaultQuestion[] = [
    {
        text: 'Muitas vezes percebo pequenos sons quando os outros não percebem.',
        scoreRule: 'concordo',
    },
    {
        text: 'Normalmente concentro-me mais na imagem completa do que nos pequenos detalhes.',
        scoreRule: 'discordo',
    },
    {
        text: 'Acho difícil entender as intenções das pessoas.',
        scoreRule: 'concordo',
    },
    {
        text: 'Acho difícil entender o que um personagem de uma história está pensando.',
        scoreRule: 'concordo',
    },
    {
        text: 'Acho fácil ler nas entrelinhas quando alguém está falando comigo.',
        scoreRule: 'discordo',
    },
    {
        text: 'Sei perceber se alguém que está me ouvindo está ficando entediado.',
        scoreRule: 'discordo',
    },
    {
        text: 'Acho fácil fazer mais de uma coisa ao mesmo tempo.',
        scoreRule: 'discordo',
    },
    {
        text: 'Acho fácil descobrir o que alguém está pensando ou sentindo.',
        scoreRule: 'discordo',
    },
    {
        text: 'Acho fácil imaginar como seria ser outra pessoa.',
        scoreRule: 'discordo',
    },
    {
        text: 'Acho fácil me ajustar a novas situações sociais.',
        scoreRule: 'discordo',
    },
]

function getErrorMessage(error: unknown) {
    if (error instanceof ApiError && error.status === 404) {
        return 'Nenhum questionário ativo foi encontrado.'
    }

    if (error instanceof Error) {
        return error.message
    }

    return 'Não foi possível conectar com a API.'
}

function getScoreRule(alternativas: Alternativa[]): QuestionScoreRule {
    const firstScoredAlternative = alternativas
        .slice()
        .sort((first, second) => first.posicao - second.posicao)
        .find((alternativa) => alternativa.valor > 0)

    return firstScoredAlternative && firstScoredAlternative.posicao > 2 ? 'discordo' : 'concordo'
}

function mapQuestionarioToQuestions(questionario: QuestionarioCompleto): Question[] {
    return questionario.questoes.map((questao) => ({
        id: questao.id,
        position: questao.posicao,
        group: 'Questionário ativo',
        text: questao.pergunta,
        scoreRule: getScoreRule(questao.alternativas),
        alternativas: questao.alternativas.length > 0 ? questao.alternativas : defaultAlternativas,
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

function buildQuestoesInput(questions: Question[]): QuestaoInput[] {
    return questions
        .slice()
        .sort((first, second) => first.position - second.position)
        .map((question) => ({
            posicao: question.position,
            pergunta: question.text,
            alternativas: buildAlternativasInput(question),
        }))
}

function buildDefaultQuestoesInput(): QuestaoInput[] {
    return defaultQuestions.map((question, index) => ({
        posicao: index + 1,
        pergunta: question.text,
        alternativas: buildAlternativasInput({
            id: String(index + 1),
            position: index + 1,
            group: 'Questionário ativo',
            text: question.text,
            scoreRule: question.scoreRule,
            alternativas: defaultAlternativas,
        }),
    }))
}

export function AdminPage() {
    const [whatsapp, setWhatsapp] = useState('(85) 99999-9999')
    const [email, setEmail] = useState('contato@clinica.com')
    const [services, setServices] = useState<ServicePrice[]>(initialServices)
    const [questionario, setQuestionario] = useState<QuestionarioCompleto | null>(null)
    const [questions, setQuestions] = useState<Question[]>([])
    const [isLoadingQuestionario, setIsLoadingQuestionario] = useState(true)
    const [isSavingQuestionario, setIsSavingQuestionario] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        async function loadQuestionario() {
            try {
                setIsLoadingQuestionario(true)
                setErrorMessage('')
                const activeQuestionario = await getActiveQuestionario(controller.signal)
                setQuestionario(activeQuestionario)
                setQuestions(mapQuestionarioToQuestions(activeQuestionario))
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

    const groupedQuestions = useMemo(() => {
        return questions.reduce<Record<string, Question[]>>((groups, question) => {
            groups[question.group] = [...(groups[question.group] ?? []), question]
            return groups
        }, {})
    }, [questions])

    function updateService(serviceId: string, field: keyof ServicePrice, value: string) {
        setServices((currentServices) =>
            currentServices.map((service) =>
                service.id === serviceId ? { ...service, [field]: value } : service,
            ),
        )
    }

    function updateQuestionText(questionId: string, text: string) {
        setQuestions((currentQuestions) =>
            currentQuestions.map((question) =>
                question.id === questionId ? { ...question, text } : question,
            ),
        )
    }

    function updateQuestionScoreRule(questionId: string, scoreRule: QuestionScoreRule) {
        setQuestions((currentQuestions) =>
            currentQuestions.map((question) =>
                question.id === questionId ? { ...question, scoreRule } : question,
            ),
        )
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!questionario) {
            setErrorMessage('Carregue um questionário ativo antes de salvar.')
            return
        }

        try {
            setIsSavingQuestionario(true)
            setErrorMessage('')
            setSuccessMessage('')

            const updatedQuestionario = await updateQuestionario(questionario.id, {
                titulo: questionario.titulo,
                descricao: questionario.descricao,
                versao: questionario.versao,
                ativo: questionario.ativo,
                questoes: buildQuestoesInput(questions),
            })

            setQuestionario(updatedQuestionario)
            setQuestions(mapQuestionarioToQuestions(updatedQuestionario))
            setSuccessMessage('Questionário salvo na API.')
        } catch (error) {
            setErrorMessage(getErrorMessage(error))
        } finally {
            setIsSavingQuestionario(false)
        }
    }

    async function handleCreateDefaultQuestionario() {
        try {
            setIsSavingQuestionario(true)
            setErrorMessage('')
            setSuccessMessage('')

            const createdQuestionario = await createQuestionario({
                titulo: 'Rastreio TEA',
                descricao: 'Questionário inicial para rastreio de sinais associados ao espectro autista.',
                versao: 1,
                ativo: true,
                questoes: buildDefaultQuestoesInput(),
            })

            setQuestionario(createdQuestionario)
            setQuestions(mapQuestionarioToQuestions(createdQuestionario))
            setSuccessMessage('Questionário padrão criado na API.')
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
                <form onSubmit={handleSubmit} className="mx-auto max-w-6xl space-y-6">
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
                                        Ajuste os dados de contato, valores dos serviços e perguntas do questionário.
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full gap-2 md:w-auto"
                                disabled={isSavingQuestionario || isLoadingQuestionario}
                            >
                                <FiSave size={18} />
                                {isSavingQuestionario ? 'Salvando...' : 'Salvar alterações'}
                            </Button>
                        </div>

                        {errorMessage && (
                            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 sm:flex-row sm:items-center sm:justify-between">
                                <span>{errorMessage}</span>

                                {!questionario && !isLoadingQuestionario && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleCreateDefaultQuestionario}
                                        disabled={isSavingQuestionario}
                                        className="w-full sm:w-auto"
                                    >
                                        Criar questionário padrão
                                    </Button>
                                )}
                            </div>
                        )}

                        {successMessage && (
                            <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                                {successMessage}
                            </div>
                        )}
                    </section>

                    <section className={sectionClassName}>
                        <div className="mb-5 flex items-center gap-3">
                            <FiMessageCircle className="h-5 w-5 text-[var(--primary)]" />
                            <h2 className="text-lg font-semibold">Contato</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="block space-y-2">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <FiMessageCircle size={16} />
                                    Número do WhatsApp
                                </span>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={(event) => setWhatsapp(event.target.value)}
                                    className={inputClassName}
                                    placeholder="(85) 99999-9999"
                                />
                            </label>

                            <label className="block space-y-2">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <FiMail size={16} />
                                    E-mail
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className={inputClassName}
                                    placeholder="contato@clinica.com"
                                />
                            </label>
                        </div>
                    </section>

                    <section className={sectionClassName}>
                        <div className="mb-5 flex items-center gap-3">
                            <FiDollarSign className="h-5 w-5 text-[var(--primary)]" />
                            <h2 className="text-lg font-semibold">Serviços e pacotes</h2>
                        </div>

                        <div className="space-y-3">
                            {services.map((service) => (
                                <div
                                    key={service.id}
                                    className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 lg:grid-cols-[1fr_1.2fr_160px]"
                                >
                                    <label className="block space-y-2">
                                        <span className="text-sm font-medium">Nome</span>
                                        <input
                                            type="text"
                                            value={service.name}
                                            onChange={(event) =>
                                                updateService(service.id, 'name', event.target.value)
                                            }
                                            className={inputClassName}
                                        />
                                    </label>

                                    <label className="block space-y-2">
                                        <span className="text-sm font-medium">Descrição</span>
                                        <input
                                            type="text"
                                            value={service.description}
                                            onChange={(event) =>
                                                updateService(service.id, 'description', event.target.value)
                                            }
                                            className={inputClassName}
                                        />
                                    </label>

                                    <label className="block space-y-2">
                                        <span className="text-sm font-medium">Valor</span>
                                        <input
                                            type="text"
                                            value={service.price}
                                            onChange={(event) =>
                                                updateService(service.id, 'price', event.target.value)
                                            }
                                            className={inputClassName}
                                            placeholder="0,00"
                                        />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div>
                        <section className={sectionClassName}>
                            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <FiEdit3 className="h-5 w-5 text-[var(--primary)]" />
                                    <h2 className="text-lg font-semibold">Perguntas do questionário</h2>
                                </div>

                                <span className="text-sm text-[var(--muted)]">
                                    {isLoadingQuestionario ? 'Carregando...' : `${questions.length} perguntas`}
                                </span>
                            </div>

                            <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2 md:max-h-[680px]">
                                {isLoadingQuestionario && (
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--muted)]">
                                        Carregando questionário da API...
                                    </div>
                                )}

                                {!isLoadingQuestionario && questions.length === 0 && !errorMessage && (
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--muted)]">
                                        Nenhuma pergunta cadastrada no questionário ativo.
                                    </div>
                                )}

                                {Object.entries(groupedQuestions).map(([group, groupQuestions]) => (
                                    <details
                                        key={group}
                                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4"
                                        open
                                    >
                                        <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)] marker:text-[var(--primary)]">
                                            {group} ({groupQuestions.length})
                                        </summary>

                                        <div className="mt-4 space-y-4">
                                            {groupQuestions.map((question) => (
                                                <div
                                                    key={question.id}
                                                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
                                                >
                                                    <div className="mb-3 flex items-center justify-between gap-3">
                                                        <span className="text-sm font-semibold text-[var(--primary)]">
                                                            Pergunta {question.position}
                                                        </span>

                                                        <select
                                                            value={question.scoreRule}
                                                            onChange={(event) =>
                                                                updateQuestionScoreRule(
                                                                    question.id,
                                                                    event.target.value as QuestionScoreRule,
                                                                )
                                                            }
                                                            className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                                                        >
                                                            <option value="concordo">Pontua ao concordar</option>
                                                            <option value="discordo">Pontua ao discordar</option>
                                                        </select>
                                                    </div>

                                                    <textarea
                                                        value={question.text}
                                                        onChange={(event) =>
                                                            updateQuestionText(question.id, event.target.value)
                                                        }
                                                        className={`${inputClassName} min-h-24 resize-y leading-6`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    </div>
                </form>
            </main>
        </div>
    )
}
