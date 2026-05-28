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
  required: [
    "id",
    "name",
    "description",
    "priceInCents",
    "grantsTestAccess",
    "grantsConsultationAccess",
  ],
  properties: {
    id: {
      type: "string",
      enum: [
        "testes-consultas",
        "apenas-testes",
        "apenas-consulta",
        "testes-consulta-laudo",
      ],
    },
    name: { type: "string" },
    description: { type: "string" },
    priceInCents: { type: "integer" },
    grantsTestAccess: { type: "boolean" },
    grantsConsultationAccess: { type: "boolean" },
    active: { type: "boolean" },
  },
  additionalProperties: false,
} as const;

const serviceParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      enum: [
        "testes-consultas",
        "apenas-testes",
        "apenas-consulta",
        "testes-consulta-laudo",
      ],
    },
  },
  additionalProperties: false,
} as const;

const infinitePayConfirmationBodySchema = {
  type: "object",
  required: ["order_nsu"],
  properties: {
    order_nsu: { type: "string" },
    transaction_nsu: { type: "string" },
    slug: { type: "string" },
    invoice_slug: { type: "string" },
    capture_method: { type: "string" },
    receipt_url: { type: "string" },
  },
  additionalProperties: false,
} as const;

const infinitePayWebhookResponseSchema = {
  type: "object",
  required: ["success", "message", "purchaseId", "status"],
  properties: {
    success: { type: "boolean", const: true },
    message: { type: "null" },
    purchaseId: { type: "string" },
    status: { type: "string" },
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
        enum: [
          "testes-consultas",
          "apenas-testes",
          "apenas-consulta",
          "testes-consulta-laudo",
        ],
      },
      testMode: { type: "boolean" },
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

export const deleteServicePurchasesSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      required: ["deletedCount"],
      properties: {
        deletedCount: { type: "integer" },
      },
      additionalProperties: false,
    },
  },
};

export const updateServiceSchema: FastifySchema = {
  params: serviceParamsSchema,
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: "string", minLength: 1 },
      priceInCents: { type: "integer", minimum: 0 },
      active: { type: "boolean" },
    },
    additionalProperties: false,
  },
  response: {
    200: serviceCatalogItemSchema,
    400: messageResponseSchema,
    404: messageResponseSchema,
  },
};

export const listServicePurchasesSchema: FastifySchema = {
  response: {
    200: {
      type: "array",
      items: servicePurchaseSchema,
    },
  },
};

export const confirmServicePurchaseSchema: FastifySchema = {
  body: infinitePayConfirmationBodySchema,
  response: {
    200: servicePurchaseSchema,
    400: messageResponseSchema,
    404: messageResponseSchema,
  },
};

export const getServiceAccessSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      required: ["canUseTests", "canScheduleConsultation", "paidPurchases"],
      properties: {
        canUseTests: { type: "boolean" },
        canScheduleConsultation: { type: "boolean" },
        paidPurchases: {
          type: "array",
          items: servicePurchaseSchema,
        },
      },
      additionalProperties: false,
    },
  },
};

export const infinitePayWebhookSchema: FastifySchema = {
  querystring: {
    type: "object",
    properties: {
      token: { type: "string" },
    },
    additionalProperties: true,
  },
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
    200: infinitePayWebhookResponseSchema,
    400: messageResponseSchema,
    401: messageResponseSchema,
    404: messageResponseSchema,
  },
};
