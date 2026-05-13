import type { FastifySchema } from "fastify";

const questionarioResponseSchema = {
  type: "object",
  required: ["id", "titulo", "descricao", "versao"],
  properties: {
    id: { type: "string" },
    titulo: { type: "string" },
    descricao: { type: "string", nullable: true },
    versao: { type: "integer" },
  },
  additionalProperties: false,
} as const;

const avaliadoResumoResponseSchema = {
  type: "object",
  required: ["id", "nome"],
  properties: {
    id: { type: "string" },
    nome: { type: "string" },
  },
  additionalProperties: false,
} as const;

const respostaResponseSchema = {
  type: "object",
  required: [
    "id",
    "id_teste",
    "id_questao",
    "id_alternativa",
    "valor",
    "created_at",
    "questao",
    "alternativa",
  ],
  properties: {
    id: { type: "string" },
    id_teste: { type: "string" },
    id_questao: { type: "string" },
    id_alternativa: { type: "string" },
    valor: { type: "integer" },
    created_at: { type: "string" },
    questao: {
      type: "object",
      nullable: true,
      required: ["id", "posicao", "pergunta"],
      properties: {
        id: { type: "string" },
        posicao: { type: "integer" },
        pergunta: { type: "string" },
      },
      additionalProperties: false,
    },
    alternativa: {
      type: "object",
      nullable: true,
      required: ["id", "posicao", "texto", "valor"],
      properties: {
        id: { type: "string" },
        posicao: { type: "integer" },
        texto: { type: "string" },
        valor: { type: "integer" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

const testeResponseSchema = {
  type: "object",
  required: [
    "id",
    "id_user",
    "id_avaliado",
    "id_questionario",
    "status",
    "pontuacao_total",
    "classificacao",
    "started_at",
    "finished_at",
    "created_at",
    "updated_at",
    "questionario",
    "avaliado",
    "respostas",
  ],
  properties: {
    id: { type: "string" },
    id_user: { type: "string" },
    id_avaliado: { type: "string", nullable: true },
    id_questionario: { type: "string" },
    status: { type: "string" },
    pontuacao_total: { type: "integer" },
    classificacao: { type: "string", nullable: true },
    started_at: { type: "string", nullable: true },
    finished_at: { type: "string", nullable: true },
    created_at: { type: "string" },
    updated_at: { type: "string" },
    questionario: {
      ...questionarioResponseSchema,
      nullable: true,
    },
    avaliado: {
      ...avaliadoResumoResponseSchema,
      nullable: true,
    },
    respostas: {
      type: "array",
      items: respostaResponseSchema,
    },
  },
  additionalProperties: false,
} as const;

const usuarioAvaliadoResponseSchema = {
  type: "object",
  required: [
    "id",
    "id_user",
    "nome",
    "created_at",
    "updated_at",
  ],
  properties: {
    id: { type: "string" },
    id_user: { type: "string" },
    nome: { type: "string" },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  additionalProperties: false,
} as const;

const usuarioResponseSchema = {
  type: "object",
  required: [
    "id",
    "email",
    "name",
    "phone",
    "birthDate",
    "gender",
    "avatarUrl",
    "created_at",
    "updated_at",
    "last_sign_in_at",
    "avaliados",
    "testes",
  ],
  properties: {
    id: { type: "string" },
    email: { type: "string", nullable: true },
    name: { type: "string", nullable: true },
    phone: { type: "string", nullable: true },
    birthDate: { type: "string", nullable: true },
    gender: { type: "string", nullable: true },
    avatarUrl: { type: "string", nullable: true },
    created_at: { type: "string" },
    updated_at: { type: "string", nullable: true },
    last_sign_in_at: { type: "string", nullable: true },
    avaliados: {
      type: "array",
      items: usuarioAvaliadoResponseSchema,
    },
    testes: {
      type: "array",
      items: testeResponseSchema,
    },
  },
  additionalProperties: false,
} as const;

export const listUsuariosSchema: FastifySchema = {
  response: {
    200: {
      type: "array",
      items: usuarioResponseSchema,
    },
  },
};
