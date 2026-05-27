import { jsonRequest, request } from './api'

export type ServiceCatalogItem = {
  id: 'testes-consultas' | 'apenas-testes' | 'apenas-consulta'
  name: string
  description: string
  priceInCents: number
  grantsTestAccess: boolean
  grantsConsultationAccess: boolean
  active?: boolean
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

export type DeleteServicePurchasesResponse = {
  deletedCount: number
}

export type ServiceAccess = {
  canUseTests: boolean
  canScheduleConsultation: boolean
  paidPurchases: ServicePurchase[]
}

export type ConfirmServicePurchaseInput = {
  order_nsu: string
  transaction_nsu?: string
  slug?: string
  invoice_slug?: string
  capture_method?: string
  receipt_url?: string
}

export type UpdateServiceInput = Partial<{
  name: string
  description: string
  priceInCents: number
  active: boolean
}>

export function listServices() {
  return request<ServiceCatalogItem[]>('/servicos')
}

export function updateService(id: ServiceCatalogItem['id'], body: UpdateServiceInput) {
  return jsonRequest<ServiceCatalogItem>(`/servicos/${id}`, {
    method: 'PUT',
    body,
  })
}

export function createServicePurchase(serviceId: string, testMode = false) {
  return jsonRequest<CreateServicePurchaseResponse>('/servicos/compras', {
    method: 'POST',
    body: { serviceId, testMode },
  })
}

export function deleteServicePurchases() {
  return jsonRequest<DeleteServicePurchasesResponse>('/servicos/compras', {
    method: 'DELETE',
  })
}

export function listServicePurchases() {
  return request<ServicePurchase[]>('/servicos/compras')
}

export function getServiceAccess() {
  return request<ServiceAccess>('/servicos/acesso')
}

export function confirmServicePurchase(input: ConfirmServicePurchaseInput) {
  return jsonRequest<ServicePurchase>('/servicos/compras/confirmar', {
    method: 'POST',
    body: input,
  })
}
