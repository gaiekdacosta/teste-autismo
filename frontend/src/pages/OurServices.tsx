import { useEffect, useMemo, useState } from 'react'
import { FiCheck, FiClipboard, FiCreditCard, FiShoppingCart, FiVideo } from 'react-icons/fi'
import { Navbar } from '@/components/Navbar'
import { getAdministradorAtual } from '@/services/administradores'
import {
    createServicePurchase,
    listServices,
    type ServiceCatalogItem,
} from '@/services/servicos'

const serviceEyebrows: Record<ServiceCatalogItem['id'], string> = {
    'testes-consultas': 'Pacote completo',
    'apenas-testes': 'Teste avulso',
    'apenas-consulta': 'Consulta avulsa',
    'testes-consulta-laudo': 'Completo + Laudo',
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
})

function formatPrice(priceInCents: number) {
    return currencyFormatter.format(priceInCents / 100)
}

function getServiceBenefits(service: ServiceCatalogItem) {
    const benefits = []

    if (service.grantsTestAccess) {
        benefits.push({ label: 'Libera questionário e testes', icon: FiClipboard })
    }

    if (service.grantsConsultationAccess) {
        benefits.push({ label: 'Inclui acesso à consulta', icon: FiVideo })
    }

    return benefits
}

export function OurServices() {
    const [services, setServices] = useState<ServiceCatalogItem[]>([])
    const [selectedServiceId, setSelectedServiceId] = useState<ServiceCatalogItem['id'] | null>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoadingServices, setIsLoadingServices] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [hasAdminAccess, setHasAdminAccess] = useState(false)
    const [useAdminTestPrice, setUseAdminTestPrice] = useState(false)

    const selectedService = useMemo(
        () => services.find((service) => service.id === selectedServiceId) ?? null,
        [selectedServiceId, services],
    )

    useEffect(() => {
        let isMounted = true

        async function loadServices() {
            try {
                setIsLoadingServices(true)
                setErrorMessage('')

                const servicesResponse = await listServices()
                const activeServices = servicesResponse.filter(service => service.active !== false)

                if (!isMounted) return

                setServices(activeServices)
                setSelectedServiceId(activeServices[0]?.id ?? null)
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

    useEffect(() => {
        let isMounted = true

        async function checkAdminAccess() {
            try {
                await getAdministradorAtual()
                if (isMounted) setHasAdminAccess(true)
            } catch {
                if (isMounted) setHasAdminAccess(false)
            }
        }

        void checkAdminAccess()

        return () => {
            isMounted = false
        }
    }, [])

    async function handleBuyService() {
        if (!selectedServiceId) return

        try {
            setIsLoading(true)
            setErrorMessage('')

            const response = await createServicePurchase(
                selectedServiceId,
                hasAdminAccess && useAdminTestPrice,
            )
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
                <section className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-start gap-3">
                            <FiShoppingCart className="mt-1 h-5 w-5 text-[var(--foreground)]" />
                            <div>
                                <h1 className="text-xl font-bold text-[var(--foreground)]">Checkout</h1>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    Escolha o pacote e finalize o pagamento pela InfinitePay.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="rounded-2xl border border-[var(--border)] bg-[#070707] p-5 md:p-6">
                            <p className="text-sm font-semibold text-[var(--foreground)]">Pacotes disponíveis</p>

                            <div className="mt-4 flex flex-col gap-3">
                                {isLoadingServices && (
                                    <div className="rounded-xl border border-[var(--border)] bg-[#080808] p-5 text-sm text-[var(--muted)] md:p-6">
                                        Carregando serviços...
                                    </div>
                                )}

                                {!isLoadingServices && services.length === 0 && !errorMessage && (
                                    <div className="rounded-xl border border-[var(--border)] bg-[#080808] p-5 text-sm text-[var(--muted)] md:p-6">
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
                                            className={`group w-full rounded-xl border bg-[#080808] p-5 text-left transition md:p-6 ${isSelected
                                                    ? 'border-[var(--primary)] shadow-[0_0_0_2px_rgba(76,175,80,0.75)]'
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
                                                        <span className="text-xs font-medium uppercase text-[var(--primary)]">
                                                            {serviceEyebrows[service.id]}
                                                        </span>
                                                        <h2 className="mt-2 text-base font-bold leading-snug text-[var(--foreground)] md:text-lg">
                                                            {service.name}
                                                        </h2>
                                                        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted)]">
                                                            {service.description}
                                                        </p>

                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {getServiceBenefits(service).map(({ label, icon: Icon }) => (
                                                                <span
                                                                    key={label}
                                                                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)]"
                                                                >
                                                                    <Icon className="h-4 w-4 text-[var(--primary)]" />
                                                                    {label}
                                                                </span>
                                                            ))}
                                                        </div>
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

                        <aside className="rounded-2xl border border-[var(--border)] bg-[#070707] p-5 md:p-6 lg:sticky lg:top-8 lg:self-start">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                                    <FiCreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold">Resumo do pedido</h2>
                                    <p className="text-xs text-[var(--muted)]">Pagamento seguro pela InfinitePay</p>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-[var(--border)] pt-5">
                                <p className="text-xs font-medium uppercase text-[var(--muted)]">Selecionado</p>
                                <h3 className="mt-2 text-lg font-bold">{selectedService?.name ?? '-'}</h3>
                                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                    {selectedService?.description ?? 'Selecione um pacote para continuar.'}
                                </p>
                            </div>

                            <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-5">
                                <div className="flex items-center justify-between gap-3 border-[var(--border)] pt-4">
                                    <span className="font-bold">Total</span>
                                    <span className="text-2xl font-bold">
                                        {selectedService ? formatPrice(selectedService.priceInCents) : '-'}
                                    </span>
                                </div>
                            </div>

                            {hasAdminAccess && (
                                <label className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--muted)]">
                                    <input
                                        type="checkbox"
                                        checked={useAdminTestPrice}
                                        onChange={(event) => setUseAdminTestPrice(event.target.checked)}
                                        className="mt-1 h-4 w-4 accent-[var(--primary)]"
                                    />
                                    <span>
                                        Usar pagamento de teste admin de R$ 1,00.
                                    </span>
                                </label>
                            )}

                            <button
                                type="button"
                                onClick={handleBuyService}
                                disabled={isLoading || isLoadingServices || !selectedServiceId}
                                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-black transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <FiCreditCard className="h-4 w-4" />
                                {isLoading ? 'Preparando pagamento...' : 'Ir para pagamento'}
                            </button>

                            {errorMessage && (
                                <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {errorMessage}
                                </p>
                            )}
                        </aside>
                    </div>
                </section>
            </main>
        </div>
    )
}
