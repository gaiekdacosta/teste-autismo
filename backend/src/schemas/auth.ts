import type { FastifySchema } from "fastify";

const authUserResponseSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    name: { type: "string" },
    phone: { type: "string" },
    avatarUrl: { type: "string" },
    birthDate: { type: "string" },
    gender: { type: "string" },
  },
  additionalProperties: false,
} as const;

const loginResponseSchema = {
  type: "object",
  properties: {
    tokens: {
      type: "object",
      required: ["accessToken"],
      properties: {
        accessToken: { type: "string" },
        refreshToken: { type: "string" },
        expiresIn: { type: "integer" },
      },
      additionalProperties: false,
    },
    user: authUserResponseSchema,
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

export const registerSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["name", "email", "phone", "birthDate", "gender", "password"],
    properties: {
      name: { type: "string", minLength: 3 },
      email: { type: "string", format: "email" },
      phone: { type: "string", minLength: 10 },
      birthDate: { type: "string", minLength: 1 },
      gender: { type: "string", minLength: 1 },
      password: { type: "string", minLength: 6 },
    },
    additionalProperties: false,
  },
  response: {
    200: loginResponseSchema,
    400: messageResponseSchema,
  },
};

export const notifyCurrentUserSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      required: ["notified"],
      properties: {
        notified: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
};
