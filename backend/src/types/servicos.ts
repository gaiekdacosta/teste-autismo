export const SERVICE_PURCHASE_STATUS = {
  pending: "pending",
  paid: "paid",
} as const;

export type ServicePurchaseStatus =
  (typeof SERVICE_PURCHASE_STATUS)[keyof typeof SERVICE_PURCHASE_STATUS];

export type ServiceCatalogItem = {
  id: "testes-consultas" | "apenas-testes" | "apenas-consulta" | "testes-consulta-laudo";
  name: string;
  description: string;
  priceInCents: number;
  grantsTestAccess: boolean;
  grantsConsultationAccess: boolean;
  active?: boolean;
};

export type CreateServicePurchaseInput = {
  serviceId: ServiceCatalogItem["id"];
  testMode?: boolean;
};

export type UpdateServiceInput = Partial<{
  name: string;
  description: string;
  priceInCents: number;
  active: boolean;
}>;

export type ServicePackageRow = {
  service_id: ServiceCatalogItem["id"];
  pacote: string;
  descricao: string;
  valor: number | string;
  posicao: number | null;
  ativo: boolean | null;
};

export type InfinitePayWebhookInput = {
  order_nsu?: string;
  transaction_nsu?: string;
  slug?: string;
  invoice_slug?: string;
  capture_method?: string;
  receipt_url?: string;
};

export type InfinitePayWebhookResponse = {
  success: true;
  message: string | null;
  purchaseId: string;
  status: ServicePurchaseStatus;
};

export type ServicePurchase = {
  id: string;
  id_user: string;
  customer_name: string | null;
  customer_email: string | null;
  service_id: string;
  service_name: string;
  service_price_cents: number;
  status: ServicePurchaseStatus;
  checkout_url: string | null;
  order_nsu: string;
  invoice_slug: string | null;
  transaction_nsu: string | null;
  capture_method: string | null;
  receipt_url: string | null;
  notified_admin_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ServicePurchaseInsertRow = Omit<
  ServicePurchase,
  "created_at" | "updated_at"
>;

export type ServicePurchaseUpdateRow = Partial<
  Omit<ServicePurchase, "id" | "id_user" | "created_at" | "updated_at">
>;

export type DeletePurchasesResult = {
  deletedCount: number;
};

export type CreateServicePurchaseResponse = {
  purchase: ServicePurchase;
  checkoutUrl: string;
};

export type ServiceAccess = {
  canUseTests: boolean;
  canScheduleConsultation: boolean;
  paidPurchases: ServicePurchase[];
};
