export const SERVICE_PURCHASE_STATUS = {
  pending: "pending",
  paid: "paid",
} as const;

export type ServicePurchaseStatus =
  (typeof SERVICE_PURCHASE_STATUS)[keyof typeof SERVICE_PURCHASE_STATUS];

export type ServiceCatalogItem = {
  id: "testes-consultas" | "apenas-testes" | "apenas-consulta";
  name: string;
  description: string;
  priceInCents: number;
};

export type CreateServicePurchaseInput = {
  serviceId: ServiceCatalogItem["id"];
};

export type InfinitePayWebhookInput = {
  order_nsu?: string;
  transaction_nsu?: string;
  slug?: string;
  invoice_slug?: string;
  capture_method?: string;
  receipt_url?: string;
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

export type CreateServicePurchaseResponse = {
  purchase: ServicePurchase;
  checkoutUrl: string;
};
