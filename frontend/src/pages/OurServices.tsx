import { useState } from 'react'
import { FiCheck, FiShoppingCart } from 'react-icons/fi'
import { Navbar } from '@/components/Navbar'

type Service = {
    id: 'testes-consultas' | 'apenas-testes' | 'apenas-consulta'
    title: string
    description: string
    price: string
    eyebrow: string
}

const services: Service[] = [
    {
        id: 'testes-consultas',
        title: 'Testes + Consultas',
        description:
            'Pacote completo para realizar os testes de rastreio e receber acompanhamento em consulta para interpretação dos resultados, orientação clínica e próximos passos.',
        price: 'R$ 450,00',
        eyebrow: 'Pacote completo',
    },
    {
        id: 'apenas-testes',
        title: 'Apenas Testes',
        description:
            'Acesso aos testes de rastreio para avaliar sinais associados ao espectro autista, com resultado organizado para apoiar sua jornada de investigação.',
        price: 'R$ 49,00',
        eyebrow: 'Teste avulso',
    },
    {
        id: 'apenas-consulta',
        title: 'Apenas Consulta',
        description:
            'Consulta individual para análise de resultados, orientação clínica e acompanhamento especializado sem a necessidade de realizar testes.',
        price: 'R$ 400,00',
        eyebrow: 'Consulta avulsa',
    },
]

export function OurServices() {
    const [selectedService, setSelectedService] = useState<Service['id']>('testes-consultas')

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <Navbar />

            <main className="px-4 pb-10 pt-20 md:ml-[280px] md:px-8 md:py-8">
                <section className="mx-auto max-w-6xl rounded-2xl border border-[var(--border)] bg-[#070707] p-5 md:p-6">
                    <div className="flex items-start gap-3">
                        <FiShoppingCart className="mt-1 h-5 w-5 text-[var(--foreground)]" />
                        <div>
                            <h1 className="text-lg font-bold text-[var(--foreground)]">Comprar Serviço</h1>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Selecione um pacote para comprar
                            </p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <p className="text-sm text-[var(--muted)]">Nossos serviços</p>

                        <div className="mt-4 flex flex-col gap-3">
                            {services.map((service) => {
                                const isSelected = selectedService === service.id

                                return (
                                    <button
                                        key={service.id}
                                        type="button"
                                        onClick={() => setSelectedService(service.id)}
                                        className={`group w-full rounded-2xl border bg-[#080808] p-5 text-left transition md:p-6 ${isSelected
                                                ? 'border-[var(--primary)] shadow-[0_0_0_2px_rgba(76,175,80,0.9),inset_0_0_0_1px_rgba(76,175,80,0.65)]'
                                                : 'border-[var(--border)] hover:border-[var(--primary)]/60'
                                            }`}
                                        aria-pressed={isSelected}
                                    >
                                        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
                                            <div className="flex gap-4">
                                                <span
                                                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded border transition ${isSelected
                                                            ? 'border-[var(--primary)] bg-[var(--primary)] text-black'
                                                            : 'border-[var(--primary)] text-transparent group-hover:text-[var(--primary)]'
                                                        }`}
                                                >
                                                    <FiCheck className="h-4 w-4" />
                                                </span>

                                                <div>
                                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--primary)]">
                                                        {service.eyebrow}
                                                    </span>
                                                    <h2 className="mt-2 text-base font-bold leading-snug text-[var(--foreground)] md:text-lg">
                                                        {service.title}
                                                    </h2>
                                                    <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted)]">
                                                        {service.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <strong className="ml-10 whitespace-nowrap text-2xl font-bold text-[var(--foreground)] md:ml-0">
                                                {service.price}
                                            </strong>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-[var(--muted)]">
                            Serviço selecionado:{' '}
                            <span className="font-semibold text-[var(--foreground)]">
                                {services.find((service) => service.id === selectedService)?.title}
                            </span>
                        </p>

                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-black transition hover:bg-[var(--primary-hover)]"
                        >
                            Comprar agora
                        </button>
                    </div>
                </section>
            </main>
        </div>
    )
}
