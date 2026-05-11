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

const alternativaInputSchema = {
  type: "object",
  required: ["posicao", "texto", "valor"],
  properties: {
    posicao: { type: "integer", minimum: 1 },
    texto: { type: "string", minLength: 1 },
    valor: { type: "integer" },
  },
  additionalProperties: false,
} as const;

const questaoInputSchema = {
  type: "object",
  required: ["posicao", "pergunta", "alternativas"],
  properties: {
    posicao: { type: "integer", minimum: 1 },
    pergunta: { type: "string", minLength: 1 },
    alternativas: {
      type: "array",
      minItems: 1,
      items: alternativaInputSchema,
    },
  },
  additionalProperties: false,
} as const;

const createQuestionarioBodySchema = {
  type: "object",
  required: ["titulo", "descricao", "versao", "questoes"],
  properties: {
    titulo: { type: "string", minLength: 1 },
    descricao: { type: "string", minLength: 1 },
    versao: { type: "integer", minimum: 1 },
    ativo: { type: "boolean" },
    questoes: {
      type: "array",
      minItems: 1,
      items: questaoInputSchema,
    },
  },
  additionalProperties: false,
} as const;

const updateQuestionarioBodySchema = {
  type: "object",
  minProperties: 1,
  properties: {
    titulo: { type: "string", minLength: 1 },
    descricao: { type: "string", minLength: 1 },
    versao: { type: "integer", minimum: 1 },
    ativo: { type: "boolean" },
    questoes: {
      type: "array",
      minItems: 1,
      items: questaoInputSchema,
    },
  },
  additionalProperties: false,
} as const;

const alternativaResponseSchema = {
  type: "object",
  required: ["id", "posicao", "texto", "valor"],
  properties: {
    id: { type: "string" },
    posicao: { type: "integer" },
    texto: { type: "string" },
    valor: { type: "integer" },
  },
  additionalProperties: false,
} as const;

const questaoResponseSchema = {
  type: "object",
  required: ["id", "posicao", "pergunta", "alternativas"],
  properties: {
    id: { type: "string" },
    posicao: { type: "integer" },
    pergunta: { type: "string" },
    alternativas: {
      type: "array",
      items: alternativaResponseSchema,
    },
  },
  additionalProperties: false,
} as const;

const questionarioResumoResponseSchema = {
  type: "object",
  required: ["id", "titulo", "descricao", "versao", "ativo"],
  properties: {
    id: { type: "string" },
    titulo: { type: "string" },
    descricao: { type: "string" },
    versao: { type: "integer" },
    ativo: { type: "boolean" },
  },
  additionalProperties: false,
} as const;

const questionarioCompletoResponseSchema = {
  type: "object",
  required: ["id", "titulo", "descricao", "versao", "ativo", "questoes"],
  properties: {
    ...questionarioResumoResponseSchema.properties,
    questoes: {
      type: "array",
      items: questaoResponseSchema,
    },
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

export const listQuestionariosSchema: FastifySchema = {
  response: {
    200: {
      type: "array",
      items: questionarioResumoResponseSchema,
    },
  },
};

export const getActiveQuestionarioSchema: FastifySchema = {
  response: {
    200: questionarioCompletoResponseSchema,
    404: messageResponseSchema,
  },
};

export const getQuestionarioSchema: FastifySchema = {
  params: idParamsSchema,
  response: {
    200: questionarioCompletoResponseSchema,
    404: messageResponseSchema,
  },
};

export const createQuestionarioSchema: FastifySchema = {
  body: createQuestionarioBodySchema,
  response: {
    201: questionarioCompletoResponseSchema,
  },
};

export const updateQuestionarioSchema: FastifySchema = {
  params: idParamsSchema,
  body: updateQuestionarioBodySchema,
  response: {
    200: questionarioCompletoResponseSchema,
    404: messageResponseSchema,
  },
};

export const toggleQuestionarioSchema: FastifySchema = {
  params: idParamsSchema,
  response: {
    200: questionarioCompletoResponseSchema,
    404: messageResponseSchema,
  },
};

export const deleteQuestionarioSchema: FastifySchema = {
  params: idParamsSchema,
  response: {
    204: { type: "null" },
    404: messageResponseSchema,
    409: messageResponseSchema,
  },
};
