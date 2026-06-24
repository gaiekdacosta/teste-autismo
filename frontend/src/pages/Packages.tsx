import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    FiArrowRight,
    FiCheck,
    FiClock,
    FiCreditCard,
    FiShield,
} from 'react-icons/fi'

import { listServices, type ServiceCatalogItem } from '@/services/servicos'

const serviceEyebrows: Record<ServiceCatalogItem['id'], string> = {
    'testes-consultas': 'Pacote completo',
    'apenas-testes': 'Teste avulso',
    'apenas-consulta': 'Consulta avulsa',
    'testes-consulta-laudo': 'Completo + Laudo',
}

const highlightedServiceId: ServiceCatalogItem['id'] = 'testes-consultas'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
})

function formatPrice(priceInCents: number) {
    return currencyFormatter.format(priceInCents / 100)
}

function formatInstallment(priceInCents: number, installments = 12) {
    return currencyFormatter.format(priceInCents / 100 / installments)
}

function parseDescriptionItems(description: string) {
    return description
        // Quebra por linha ou imediatamente antes de cada marcador de check.
        .split(/\r?\n|(?=[✅✔☑])/u)
        // Remove marcadores no início (✅, ✔, ☑, •, -, *) e espaços.
        .map((line) => line.replace(/^[\s✅✔☑️•\-–*]+/u, '').trim())
        .filter((line) => line.length > 0)
}

export function PackagesPage() {
    const navigate = useNavigate()
    const [services, setServices] = useState<ServiceCatalogItem[]>([])
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function loadServices() {
            try {
                setIsLoading(true)
                setErrorMessage('')

                const response = await listServices()
                const activeServices = response.filter((service) => service.active !== false)

                if (!isMounted) return

                setServices(activeServices)
            } catch (error) {
                if (!isMounted) return

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'Não foi possível carregar os pacotes.',
                )
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        void loadServices()

        return () => {
            isMounted = false
        }
    }, [])

    const orderedServices = useMemo(() => {
        const highlighted = services.filter((service) => service.id === highlightedServiceId)
        const rest = services.filter((service) => service.id !== highlightedServiceId)
        return [...highlighted, ...rest]
    }, [services])

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
                    <div className="flex flex-col">
                        <span className="text-base font-bold leading-tight text-[var(--foreground)]">
                            Laudo de Autismo
                        </span>
                        <span className="text-xs font-medium text-[var(--primary)]">
                            Dr. Tiago Marinho
                        </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]/60"
                        >
                            Entrar
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-black transition hover:bg-[var(--primary-hover)]"
                        >
                            Criar cadastro
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-8 md:pt-14">
                <section className="mx-auto max-w-3xl text-center">
                    <span className="inline-block rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                        Avaliação de autismo
                    </span>
                    <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
                        Pacotes disponíveis
                    </h1>
                    <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
                        Conheça as opções e a forma de pagamento antes de criar sua conta. Você
                        finaliza a compra com segurança após fazer login.
                    </p>
                </section>

                {isLoading && (
                    <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[#070707] p-8 text-center text-sm text-[var(--muted)]">
                        Carregando pacotes...
                    </div>
                )}

                {errorMessage && !isLoading && (
                    <div className="mt-12 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-4 text-center text-sm text-red-200">
                        {errorMessage}
                    </div>
                )}

                {!isLoading && !errorMessage && orderedServices.length === 0 && (
                    <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[#070707] p-8 text-center text-sm text-[var(--muted)]">
                        Nenhum pacote disponível no momento.
                    </div>
                )}

                {!isLoading && !errorMessage && orderedServices.length > 0 && (
                    <section className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {orderedServices.map((service) => {
                            const isHighlighted = service.id === highlightedServiceId
                            const descriptionItems = parseDescriptionItems(service.description)
                            const hasChecklist = descriptionItems.length > 1

                            return (
                                <article
                                    key={service.id}
                                    className={`relative flex flex-col rounded-2xl border bg-[#070707] p-6 transition ${
                                        isHighlighted
                                            ? 'border-[var(--primary)] shadow-[0_0_0_2px_rgba(76,175,80,0.45)] lg:-translate-y-2'
                                            : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                                    }`}
                                >
                                    {isHighlighted && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-bold text-black">
                                            Mais escolhido
                                        </span>
                                    )}

                                    <span className="text-xs font-medium uppercase tracking-wide text-[var(--primary)]">
                                        {serviceEyebrows[service.id]}
                                    </span>
                                    <h2 className="mt-2 text-lg font-bold leading-snug text-[var(--foreground)]">
                                        {service.name}
                                    </h2>
                                    {hasChecklist ? (
                                        <ul className="mt-4 flex flex-col gap-2.5">
                                            {descriptionItems.map((item) => (
                                                <li
                                                    key={item}
                                                    className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]"
                                                >
                                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                                                        <FiCheck className="h-3 w-3" />
                                                    </span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                                            {descriptionItems[0] ?? service.description}
                                        </p>
                                    )}

                                    <div className="mt-6">
                                        <strong className="text-3xl font-extrabold text-[var(--foreground)]">
                                            {formatPrice(service.priceInCents)}
                                        </strong>
                                        <p className="mt-1 text-xs text-[var(--muted)]">
                                            ou 12x de {formatInstallment(service.priceInCents)} no cartão
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/register')}
                                        className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
                                            isHighlighted
                                                ? 'bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)]'
                                                : 'border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10'
                                        }`}
                                    >
                                        Quero este pacote
                                        <FiArrowRight className="h-4 w-4" />
                                    </button>
                                </article>
                            )
                        })}
                    </section>
                )}

                <section className="mt-12 grid gap-5 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border)] bg-[#070707] p-6">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                                <FiShield className="h-5 w-5" />
                            </span>
                            <h3 className="text-base font-bold text-[var(--foreground)]">
                                Sigilo e segurança
                            </h3>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                            Todas as informações são tratadas com total sigilo e em conformidade com a
                            Lei Geral de Proteção de Dados (LGPD) e o Código de Ética Médica.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--border)] bg-[#070707] p-6">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                                <FiClock className="h-5 w-5" />
                            </span>
                            <h3 className="text-base font-bold text-[var(--foreground)]">
                                Como funciona
                            </h3>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                            Após criar sua conta e concluir o pagamento, você recebe as instruções para
                            realizar o teste. Em seguida agendamos a consulta e a emissão do laudo,
                            quando indicado.
                        </p>
                    </div>
                </section>

                <section className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
                    <h3 className="text-lg font-bold text-[var(--foreground)]">
                        Pronto para começar?
                    </h3>
                    <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
                        Crie sua conta para escolher o pacote e finalizar o pagamento com segurança.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-black transition hover:bg-[var(--primary-hover)]"
                        >
                            <FiCreditCard className="h-4 w-4" />
                            Criar cadastro
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]/60"
                        >
                            Já tenho conta
                        </button>
                    </div>
                </section>
            </main>
        </div>
    )
}
