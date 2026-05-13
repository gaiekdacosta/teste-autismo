import type { FastifySchema } from "fastify";

const uuidPattern =
  "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$";

const idParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", pattern: uuidPattern },
  },
  additionalProperties: false,
} as const;

const administradorResponseSchema = {
  type: "object",
  required: ["id", "id_user", "email", "ativo", "nivel", "created_at", "updated_at"],
  properties: {
    id: { type: "string" },
    id_user: { type: "string" },
    email: { type: "string" },
    ativo: { type: "boolean" },
    nivel: { type: "string", enum: ["admin", "super_admin"] },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  additionalProperties: false,
} as const;

const createAdministradorBodySchema = {
  type: "object",
  required: ["email"],
  properties: {
    email: { type: "string", format: "email" },
    ativo: { type: "boolean" },
  },
  additionalProperties: false,
} as const;

const updateAdministradorBodySchema = {
  type: "object",
  minProperties: 1,
  properties: {
    email: { type: "string", format: "email" },
    ativo: { type: "boolean" },
  },
  additionalProperties: false,
} as const;

const messageResponseSchema = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string" },
  },
  additionalProperties: false,
} as const;

export const getAdministradorMeSchema: FastifySchema = {
  response: {
    200: administradorResponseSchema,
    401: messageResponseSchema,
    403: messageResponseSchema,
  },
};

export const listAdministradoresSchema: FastifySchema = {
  response: {
    200: {
      type: "array",
      items: administradorResponseSchema,
    },
  },
};

export const createAdministradorSchema: FastifySchema = {
  body: createAdministradorBodySchema,
  response: {
    201: administradorResponseSchema,
    404: messageResponseSchema,
  },
};

export const updateAdministradorSchema: FastifySchema = {
  params: idParamsSchema,
  body: updateAdministradorBodySchema,
  response: {
    200: administradorResponseSchema,
    404: messageResponseSchema,
  },
};

export const deleteAdministradorSchema: FastifySchema = {
  params: idParamsSchema,
  response: {
    204: { type: "null" },
    404: messageResponseSchema,
  },
};
