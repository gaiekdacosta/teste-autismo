import { jsonRequest, request } from './api'

export type ServiceCatalogItem = {
  id: 'testes-consultas' | 'apenas-testes' | 'apenas-consulta'
  name: string
  description: string
  priceInCents: number
}

export type ServicePurchase = {
  id: string
  id_user: string
  customer_name: string | null
  customer_email: string | null
  service_id: string
  service_name: string
  service_price_cents: number
  status: string
  checkout_url: string | null
  order_nsu: string
  invoice_slug: string | null
  transaction_nsu: string | null
  capture_method: string | null
  receipt_url: string | null
  notified_admin_at: string | null
  created_at: string
  updated_at: string
}

export type CreateServicePurchaseResponse = {
  purchase: ServicePurchase
  checkoutUrl: string
}

export function listServices() {
  return request<ServiceCatalogItem[]>('/servicos')
}

export function createServicePurchase(serviceId: string) {
  return jsonRequest<CreateServicePurchaseResponse>('/servicos/compras', {
    method: 'POST',
    body: { serviceId },
  })
}
