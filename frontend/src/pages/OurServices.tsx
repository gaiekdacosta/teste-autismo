import { useEffect, useState } from 'react'
import { FiCheck, FiShoppingCart } from 'react-icons/fi'
import { Navbar } from '@/components/Navbar'
import {
    createServicePurchase,
    listServices,
    type ServiceCatalogItem,
} from '@/services/servicos'

const serviceEyebrows: Record<ServiceCatalogItem['id'], string> = {
    'testes-consultas': 'Pacote completo',
    'apenas-testes': 'Teste avulso',
    'apenas-consulta': 'Consulta avulsa',
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
})

function formatPrice(priceInCents: number) {
    return currencyFormatter.format(priceInCents / 100)
}

export function OurServices() {
    const [services, setServices] = useState<ServiceCatalogItem[]>([])
    const [selectedServiceId, setSelectedServiceId] = useState<ServiceCatalogItem['id'] | null>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoadingServices, setIsLoadingServices] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        let isMounted = true

        async function loadServices() {
            try {
                setIsLoadingServices(true)
                setErrorMessage('')

                const servicesResponse = await listServices()

                if (!isMounted) return

                setServices(servicesResponse)
                setSelectedServiceId(servicesResponse[0]?.id ?? null)
            } catch (error) {
                if (!isMounted) return

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'Não foi possível carregar os serviços.'
                )
            } finally {
                if (isMounted) {
                    setIsLoadingServices(false)
                }
            }
        }

        void loadServices()

        return () => {
            isMounted = false
        }
    }, [])

    async function handleBuyService() {
        if (!selectedServiceId) return

        try {
            setIsLoading(true)
            setErrorMessage('')

            const response = await createServicePurchase(selectedServiceId)
            window.location.assign(response.checkoutUrl)
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível iniciar a compra.'
            )
        } finally {
            setIsLoading(false)
        }
    }

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
                            {isLoadingServices && (
                                <div className="rounded-2xl border border-[var(--border)] bg-[#080808] p-5 text-sm text-[var(--muted)] md:p-6">
                                    Carregando serviços...
                                </div>
                            )}

                            {!isLoadingServices && services.length === 0 && !errorMessage && (
                                <div className="rounded-2xl border border-[var(--border)] bg-[#080808] p-5 text-sm text-[var(--muted)] md:p-6">
                                    Nenhum serviço disponível no momento.
                                </div>
                            )}

                            {services.map((service) => {
                                const isSelected = selectedServiceId === service.id

                                return (
                                    <button
                                        key={service.id}
                                        type="button"
                                        onClick={() => setSelectedServiceId(service.id)}
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
                                                        {serviceEyebrows[service.id]}
                                                    </span>
                                                    <h2 className="mt-2 text-base font-bold leading-snug text-[var(--foreground)] md:text-lg">
                                                        {service.name}
                                                    </h2>
                                                    <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted)]">
                                                        {service.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <strong className="ml-10 whitespace-nowrap text-2xl font-bold text-[var(--foreground)] md:ml-0">
                                                {formatPrice(service.priceInCents)}
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
                                {services.find((service) => service.id === selectedServiceId)?.name ?? '-'}
                            </span>
                        </p>

                        <button
                            type="button"
                            onClick={handleBuyService}
                            disabled={isLoading || isLoadingServices || !selectedServiceId}
                            className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-black transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading ? 'Gerando link...' : 'Comprar agora'}
                        </button>
                    </div>

                    {errorMessage && (
                        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {errorMessage}
                        </p>
                    )}
                </section>
            </main>
        </div>
    )
}
