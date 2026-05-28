import { useEffect, useState } from 'react'
import { FiDollarSign, FiSave } from 'react-icons/fi'

import { Button } from '../ui/Button'

import {
    listServices,
    updateService,
    type ServiceCatalogItem,
} from '../../services/servicos'

type ServicePrice = {
    id: string
    name: string
    description: string
    price: string
    active: boolean
}

type ServicesEditProps = {
    inputClassName: string
    sectionClassName: string
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
})

function mapServiceToPrice(service: ServiceCatalogItem): ServicePrice {
    return {
        id: service.id,
        name: service.name,
        description: service.description,
        price: currencyFormatter.format(service.priceInCents / 100),
        active: service.active ?? true,
    }
}

function parsePriceInCents(value: string) {
    const normalizedValue = value
        .replace(/[^\d,.-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')

    const price = Number(normalizedValue)

    if (!Number.isFinite(price) || price < 0) {
        throw new Error('Informe um valor válido.')
    }

    return Math.round(price * 100)
}

export function ServicesEdit({
    inputClassName,
    sectionClassName,
}: ServicesEditProps) {
    const [services, setServices] = useState<ServicePrice[]>([])
    const [isLoadingServices, setIsLoadingServices] = useState(true)
    const [savingServiceId, setSavingServiceId] = useState<string | null>(null)
    const [servicesErrorMessage, setServicesErrorMessage] = useState('')
    const [servicesSuccessMessage, setServicesSuccessMessage] = useState('')

    useEffect(() => {
        let isMounted = true

        async function loadServices() {
            try {
                setIsLoadingServices(true)
                setServicesErrorMessage('')

                const data = await listServices()

                if (isMounted) {
                    setServices(data.map(mapServiceToPrice))
                }
            } catch (error) {
                if (isMounted) {
                    setServicesErrorMessage(
                        error instanceof Error
                            ? error.message
                            : 'Não foi possível carregar os serviços.',
                    )
                }
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

    function updateServiceField<K extends keyof ServicePrice>(
        serviceId: string,
        field: K,
        value: ServicePrice[K],
    ) {
        setServices((currentServices) =>
            currentServices.map((service) =>
                service.id === serviceId
                    ? { ...service, [field]: value }
                    : service,
            ),
        )
    }

    async function saveService(service: ServicePrice) {
        try {
            setSavingServiceId(service.id)
            setServicesErrorMessage('')
            setServicesSuccessMessage('')

            const updatedService = await updateService(
                service.id as ServiceCatalogItem['id'],
                {
                    name: service.name,
                    description: service.description,
                    priceInCents: parsePriceInCents(service.price),
                    active: service.active,
                },
            )

            setServices((currentServices) =>
                currentServices.map((currentService) =>
                    currentService.id === service.id
                        ? mapServiceToPrice(updatedService)
                        : currentService,
                ),
            )

            setServicesSuccessMessage('Serviço atualizado com sucesso.')
        } catch (error) {
            setServicesErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível salvar o serviço.',
            )
        } finally {
            setSavingServiceId(null)
        }
    }



    return (
        <section className={sectionClassName}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <FiDollarSign className="h-5 w-5 text-[var(--primary)]" />
                    <h2 className="text-lg font-semibold">
                        Serviços e pacotes
                    </h2>
                </div>
            </div>

            <div className="space-y-4">
                {isLoadingServices && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4"
                            >
                                <div className="mb-4 h-4 w-3/4 rounded bg-[var(--border)]" />
                                <div className="mb-3 h-3 w-full rounded bg-[var(--border)]" />
                                <div className="mb-6 h-3 w-2/3 rounded bg-[var(--border)]" />
                                <div className="mb-4 h-10 rounded bg-[var(--border)]" />
                                <div className="h-9 w-28 rounded bg-[var(--border)]" />
                            </div>
                        ))}
                    </div>
                )}

                {!isLoadingServices && servicesErrorMessage && (
                    <div className="animate-in fade-in rounded-lg border-l-4 border-red-500 bg-red-500/10 p-3 text-sm text-red-200">
                        {servicesErrorMessage}
                    </div>
                )}

                {!isLoadingServices && servicesSuccessMessage && (
                    <div className="animate-in fade-in rounded-lg border-l-4 border-green-500 bg-green-500/10 p-3 text-sm text-green-200">
                        {servicesSuccessMessage}
                    </div>
                )}

                {!isLoadingServices && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="truncate font-medium">
                                        {service.name || 'Novo serviço'}
                                    </h3>
                                    <span className="ml-2 shrink-0 text-xs text-[var(--muted)]">
                                        ID: {service.id.slice(0, 8)}
                                    </span>
                                </div>

                                <label className="mb-3 block space-y-1.5">
                                    <span className="text-sm font-medium">
                                        Nome
                                    </span>
                                    <input
                                        type="text"
                                        value={service.name}
                                        onChange={(event) =>
                                            updateServiceField(
                                                service.id,
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                        className={inputClassName}
                                    />
                                </label>

                                <label className="mb-3 block space-y-1.5">
                                    <span className="text-sm font-medium">
                                        Descrição
                                    </span>
                                    <textarea
                                        value={service.description}
                                        onChange={(event) =>
                                            updateServiceField(
                                                service.id,
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                        className={`${inputClassName} min-h-36 resize-y leading-6`}
                                    />
                                </label>

                                <label className="mb-4 block space-y-1.5">
                                    <span className="text-sm font-medium">
                                        Valor
                                    </span>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">
                                            R$
                                        </span>
                                        <input
                                            type="text"
                                            value={service.price.replace(
                                                'R$\u00A0',
                                                '',
                                            )}
                                            onChange={(event) =>
                                                updateServiceField(
                                                    service.id,
                                                    'price',
                                                    event.target.value,
                                                )
                                            }
                                            className={`${inputClassName} pl-10`}
                                            placeholder="0,00"
                                        />
                                    </div>
                                </label>

                                <div className="mb-5 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                    <span className="text-sm font-medium">
                                        Exibir no site
                                    </span>
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={service.active}
                                            onChange={(e) => updateServiceField(service.id, 'active', e.target.checked)}
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-[var(--border)] after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--primary)] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full"></div>
                                    </label>
                                </div>

                                <div className="mt-auto">
                                    <Button
                                        type="button"

                                        onClick={() => void saveService(service)}
                                        disabled={
                                            savingServiceId === service.id
                                        }
                                        className="w-full gap-2"
                                    >
                                        <FiSave size={14} />
                                        {savingServiceId === service.id
                                            ? 'Salvando...'
                                            : 'Salvar alteração'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* {!isLoadingServices && services.length > 0 && (
                    <div className="mt-6 border-t border-[var(--border)] pt-4">
                        <Button
                            type="button"

                            onClick={() => void handleDeletePurchases()}
                            disabled={isDeletingPurchases}
                            className="gap-2 text-red-400 hover:text-red-300"
                        >
                            <FiTrash2 size={14} />
                            {isDeletingPurchases
                                ? 'Apagando...'
                                : 'Apagar histórico de compras'}
                        </Button>
                    </div>
                )} */}
            </div>
        </section>
    )
}