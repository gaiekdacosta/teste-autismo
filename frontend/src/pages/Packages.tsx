import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IconType } from 'react-icons'
import {
    FiArrowRight,
    FiAward,
    FiBook,
    FiBookOpen,
    FiBriefcase,
    FiCheck,
    FiClock,
    FiCreditCard,
    FiInfo,
    FiShield,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

import { listServices, type ServiceCatalogItem } from '@/services/servicos'
import { getContato, type Contato } from '@/services/testes'

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

function buildWhatsappUrl(rawPhone: string | undefined, message: string) {
    let cleanNumber = (rawPhone ?? '5511999999999').replace(/\D/g, '')

    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
        cleanNumber = `55${cleanNumber}`
    }

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
}

type BenefitSection = {
    icon: IconType
    title: string
    items?: string[]
    paragraphs?: string[]
}

const laudoBenefits: BenefitSection[] = [
    {
        icon: FiBookOpen,
        title: '1. Ambiente educacional',
        items: [
            'Solicitação de recursos de acessibilidade em Vestibulares, ENEM e processos seletivos',
            '1h adicional em provas de Vestibular, ENEM e Concursos Públicos',
            'Adaptações razoáveis durante provas e avaliações escolares (sala separada, ambiente com menor estímulo sensorial, isolamento acústico e outros recursos de acessibilidade)',
            'Atendimento Educacional Especializado (AEE)',
            'Adaptações curriculares quando necessárias',
        ],
    },
    {
        icon: FiBriefcase,
        title: '2. Ambiente de Trabalho',
        items: [
            'Participação em vagas destinadas a Pessoas com Deficiência (PcD) em empresas privadas com mais de 100 empregados',
            'Adaptações do ambiente de trabalho (sala separada, ambiente com menor estímulo sensorial, isolamento acústico e outros recursos de acessibilidade)',
            'Flexibilizações compatíveis com as necessidades do trabalhador',
            'Solicitação de trabalho remoto (home office), quando houver justificativa técnica e compatibilidade com a função exercida',
            'Solicitação de redução de carga horária, ajustes de jornada ou adaptações da rotina laboral, conforme análise da empresa e da medicina ocupacional',
        ],
    },
    {
        icon: FiAward,
        title: '3. Concursos públicos',
        items: [
            'Inscrição em vagas reservadas para Pessoas com Deficiência (PcD), quando previstas no edital',
            'Solicitação de 1h adicional para realização das provas',
            'Solicitação de sala separada e demais recursos de acessibilidade',
            'Solicitação de adaptações durante provas práticas, discursivas ou etapas complementares do certame',
        ],
    },
    {
        icon: FiBook,
        title: '4. Universidades e vestibulares',
        items: [
            'Participação em cotas destinadas a Pessoas com Deficiência (PcD), quando previstas pela instituição',
            'Solicitação de recursos de acessibilidade acadêmica',
            'Apoio pedagógico especializado',
            'Adaptações acadêmicas previstas pela instituição de ensino',
            'Flexibilizações curriculares quando cabíveis',
        ],
    },
    {
        icon: FiCreditCard,
        title: '5. Benefícios e identificação',
        items: [
            'Emissão da CIPTEA (Carteira de Identificação da Pessoa com Transtorno do Espectro Autista)',
            'Atendimento prioritário nos termos da legislação vigente',
            'Solicitação de benefícios e programas específicos previstos em leis federais, estaduais e municipais',
            'Solicitação de isenção de IPVA, IPI e ICMS, quando previstos na legislação vigente e observados os critérios definidos pelos órgãos competentes',
            'Utilização como documentação médica em processos administrativos e requerimentos de direitos',
        ],
    },
    {
        icon: FiInfo,
        title: '6. Importante',
        paragraphs: [
            'O laudo médico é um documento técnico elaborado após avaliação clínica individualizada, contendo histórico clínico, sintomas observados, prejuízos funcionais identificados, diagnóstico e respectivo enquadramento legal da condição. Com ele podem ser solicitados benefícios, cotas, isenções, adaptações e recursos previstos na legislação vigente, sujeitos à análise dos órgãos ou instituições competentes.',
            'A concessão de direitos dependerá da análise da instituição de ensino, banca examinadora, órgão público, empresa, setor de recursos humanos, medicina ocupacional ou perícia responsável, observadas as normas aplicáveis a cada caso concreto.',
        ],
    },
]

export function PackagesPage() {
    const navigate = useNavigate()
    const [services, setServices] = useState<ServiceCatalogItem[]>([])
    const [contact, setContact] = useState<Contato | null>(null)
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

    useEffect(() => {
        let isMounted = true

        getContato()
            .then((data) => {
                if (isMounted) setContact(data)
            })
            .catch(() => {
                // Contato é opcional: a página funciona sem ele.
            })

        return () => {
            isMounted = false
        }
    }, [])

    const orderedServices = useMemo(() => {
        const highlighted = services.filter((service) => service.id === highlightedServiceId)
        const rest = services.filter((service) => service.id !== highlightedServiceId)
        return [...highlighted, ...rest]
    }, [services])

    function openWhatsapp(message: string) {
        window.open(
            buildWhatsappUrl(contact?.whatsapp, contact?.mensagem || message),
            '_blank',
        )
    }

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
                    <section className="mt-12 grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {orderedServices.map((service) => {
                            const isHighlighted = service.id === highlightedServiceId
                            const descriptionItems = parseDescriptionItems(service.description)
                            const hasChecklist = descriptionItems.length > 1
                            const showWhatsapp = service.grantsConsultationAccess

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

                                    <div className="mt-8 flex flex-col gap-3">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/register')}
                                            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
                                                isHighlighted
                                                    ? 'bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)]'
                                                    : 'border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10'
                                            }`}
                                        >
                                            Quero este pacote
                                            <FiArrowRight className="h-4 w-4" />
                                        </button>

                                        {showWhatsapp && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openWhatsapp(
                                                        `Olá! Tenho interesse no pacote "${service.name}" e gostaria de agendar minha avaliação.`,
                                                    )
                                                }
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]/60"
                                            >
                                                <FaWhatsapp className="h-4 w-4 text-[var(--primary)]" />
                                                Agendar pelo WhatsApp
                                            </button>
                                        )}
                                    </div>
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
                            Após a compra, você recebe por e-mail e WhatsApp as instruções para realizar
                            o teste. Entraremos em contato para agendar um horário para a consulta e a
                            emissão do laudo.
                        </p>
                    </div>
                </section>

                <section className="mt-16">
                    <h2 className="text-center text-xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-2xl">
                        Benefícios e possíveis utilizações do Laudo Médico de Autismo
                    </h2>

                    <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {laudoBenefits.map(({ icon: Icon, title, items, paragraphs }) => (
                            <article
                                key={title}
                                className="flex flex-col rounded-2xl border border-[var(--border)] bg-[#070707] p-6"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <h3 className="text-base font-bold leading-snug text-[var(--foreground)]">
                                        {title}
                                    </h3>
                                </div>

                                {items && (
                                    <ul className="mt-5 flex flex-col gap-3">
                                        {items.map((item) => (
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
                                )}

                                {paragraphs && (
                                    <div className="mt-5 flex flex-col gap-3">
                                        {paragraphs.map((paragraph, index) => (
                                            <p
                                                key={index}
                                                className="text-sm leading-6 text-[var(--muted)]"
                                            >
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>

                    <p className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 text-center text-sm leading-7 text-[var(--muted)]">
                        Muitos adultos procuram avaliação para autismo não apenas para compreender
                        melhor suas dificuldades ao longo da vida, mas também para obter documentação
                        médica adequada para solicitar adaptações acadêmicas, profissionais e
                        administrativas previstas na legislação.
                    </p>
                </section>

                <section className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
                    <h3 className="text-lg font-bold text-[var(--foreground)]">
                        Dúvidas? Fale conosco e agende sua avaliação.
                    </h3>
                    <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
                        Nossa equipe está pronta para te orientar. Crie sua conta para escolher o
                        pacote e finalizar o pagamento com segurança.
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
                            onClick={() =>
                                openWhatsapp(
                                    'Olá! Gostaria de mais informações sobre a avaliação de autismo.',
                                )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]/60"
                        >
                            <FaWhatsapp className="h-4 w-4 text-[var(--primary)]" />
                            Falar no WhatsApp
                        </button>
                    </div>
                </section>
            </main>
        </div>
    )
}
