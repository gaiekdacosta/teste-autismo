import { useMemo } from 'react'
import { FiEdit3, FiSave } from 'react-icons/fi'

import { Button } from '../ui/Button'

import type { Alternativa } from '../../services/questionarios'

export type QuestionScoreRule = 'concordo' | 'discordo'

export type Question = {
    id: string
    position: number
    group: string
    text: string
    scoreRule: QuestionScoreRule
    alternativas: Alternativa[]
}

interface QuestionnaireEditProps {
    questions: Question[]
    isLoadingQuestionario: boolean
    isSavingQuestionario: boolean
    errorMessage: string
    successMessage: string
    updateQuestionText: (questionId: string, text: string) => void
    updateQuestionScoreRule: (
        questionId: string,
        scoreRule: QuestionScoreRule,
    ) => void
    onSaveQuestionario: () => void
}

const inputClassName =
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]'

const sectionClassName =
    'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6'

export function QuestionnaireEdit({
    questions,
    isLoadingQuestionario,
    isSavingQuestionario,
    errorMessage,
    successMessage,
    updateQuestionText,
    updateQuestionScoreRule,
    onSaveQuestionario,
}: QuestionnaireEditProps) {
    const groupedQuestions = useMemo(() => {
        return questions.reduce<Record<string, Question[]>>(
            (groups, question) => {
                groups[question.group] = [
                    ...(groups[question.group] ?? []),
                    question,
                ]

                return groups
            },
            {},
        )
    }, [questions])

    return (
        <section className={sectionClassName}>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <FiEdit3 className="h-5 w-5 text-[var(--primary)]" />

                    <div>
                        <h2 className="text-lg font-semibold">
                            Perguntas do questionário
                        </h2>

                        <span className="text-sm text-[var(--muted)]">
                            {isLoadingQuestionario
                                ? 'Carregando...'
                                : `${questions.length} perguntas`}
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={onSaveQuestionario}
                    className="w-full gap-2 sm:w-auto"
                    disabled={
                        isSavingQuestionario ||
                        isLoadingQuestionario
                    }
                >
                    <FiSave size={18} />

                    {isSavingQuestionario
                        ? 'Salvando...'
                        : 'Salvar questionário'}
                </Button>
            </div>

            {errorMessage && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="mb-5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                    {successMessage}
                </div>
            )}

            <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2 md:max-h-[680px]">
                {isLoadingQuestionario && (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--muted)]">
                        Carregando questionário da API...
                    </div>
                )}

                {!isLoadingQuestionario &&
                    questions.length === 0 &&
                    !errorMessage && (
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--muted)]">
                            Nenhuma pergunta cadastrada no
                            questionário ativo.
                        </div>
                    )}

                {Object.entries(groupedQuestions).map(
                    ([group, groupQuestions]) => (
                        <details
                            key={group}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4"
                            open
                        >
                            <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)] marker:text-[var(--primary)]">
                                {group} (
                                {groupQuestions.length})
                            </summary>

                            <div className="mt-4 space-y-4">
                                {groupQuestions.map(
                                    (question) => (
                                        <div
                                            key={question.id}
                                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
                                        >
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <span className="text-sm font-semibold text-[var(--primary)]">
                                                    Pergunta{' '}
                                                    {
                                                        question.position
                                                    }
                                                </span>

                                                <select
                                                    value={
                                                        question.scoreRule
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateQuestionScoreRule(
                                                            question.id,
                                                            event
                                                                .target
                                                                .value as QuestionScoreRule,
                                                        )
                                                    }
                                                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                                                >
                                                    <option value="concordo">
                                                        Pontua
                                                        ao
                                                        concordar
                                                    </option>

                                                    <option value="discordo">
                                                        Pontua
                                                        ao
                                                        discordar
                                                    </option>
                                                </select>
                                            </div>

                                            <textarea
                                                value={
                                                    question.text
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    updateQuestionText(
                                                        question.id,
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                className={`${inputClassName} min-h-24 resize-y leading-6`}
                                            />
                                        </div>
                                    ),
                                )}
                            </div>
                        </details>
                    ),
                )}
            </div>
        </section>
    )
}