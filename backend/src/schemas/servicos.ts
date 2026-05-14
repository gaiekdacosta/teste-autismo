import type { FastifySchema } from "fastify";

const messageResponseSchema = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string" },
  },
  additionalProperties: false,
} as const;

const servicePurchaseSchema = {
  type: "object",
  required: [
    "id",
    "id_user",
    "customer_name",
    "customer_email",
    "service_id",
    "service_name",
    "service_price_cents",
    "status",
    "checkout_url",
    "order_nsu",
    "invoice_slug",
    "transaction_nsu",
    "capture_method",
    "receipt_url",
    "notified_admin_at",
    "created_at",
    "updated_at",
  ],
  properties: {
    id: { type: "string" },
    id_user: { type: "string" },
    customer_name: { type: "string", nullable: true },
    customer_email: { type: "string", nullable: true },
    service_id: { type: "string" },
    service_name: { type: "string" },
    service_price_cents: { type: "integer" },
    status: { type: "string" },
    checkout_url: { type: "string", nullable: true },
    order_nsu: { type: "string" },
    invoice_slug: { type: "string", nullable: true },
    transaction_nsu: { type: "string", nullable: true },
    capture_method: { type: "string", nullable: true },
    receipt_url: { type: "string", nullable: true },
    notified_admin_at: { type: "string", nullable: true },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  additionalProperties: false,
} as const;

const serviceCatalogItemSchema = {
  type: "object",
  required: ["id", "name", "description", "priceInCents"],
  properties: {
    id: {
      type: "string",
      enum: ["testes-consultas", "apenas-testes", "apenas-consulta"],
    },
    name: { type: "string" },
    description: { type: "string" },
    priceInCents: { type: "integer" },
  },
  additionalProperties: false,
} as const;

export const listServicesSchema: FastifySchema = {
  response: {
    200: {
      type: "array",
      items: serviceCatalogItemSchema,
    },
  },
};

export const createServicePurchaseSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["serviceId"],
    properties: {
      serviceId: {
        type: "string",
        enum: ["testes-consultas", "apenas-testes", "apenas-consulta"],
      },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: "object",
      required: ["purchase", "checkoutUrl"],
      properties: {
        purchase: servicePurchaseSchema,
        checkoutUrl: { type: "string" },
      },
      additionalProperties: false,
    },
    400: messageResponseSchema,
  },
};

export const infinitePayWebhookSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      order_nsu: { type: "string" },
      transaction_nsu: { type: "string" },
      slug: { type: "string" },
      invoice_slug: { type: "string" },
      capture_method: { type: "string" },
      receipt_url: { type: "string" },
    },
    additionalProperties: true,
  },
  response: {
    200: servicePurchaseSchema,
    400: messageResponseSchema,
    404: messageResponseSchema,
  },
};
