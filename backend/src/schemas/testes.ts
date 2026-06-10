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

const messageResponseSchema = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string" },
  },
  additionalProperties: false,
} as const;

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
  required: ["id"],
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

export const createTesteSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["id_questionario"],
    properties: {
      id_questionario: { type: "string", pattern: uuidPattern },
      id_avaliado: { type: "string", pattern: uuidPattern },
    },
    additionalProperties: false,
  },
  response: {
    200: testeResponseSchema,
    201: testeResponseSchema,
  },
};

export const completeTesteSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["id_questionario", "respostas"],
    properties: {
      id_questionario: { type: "string", pattern: uuidPattern },
      id_avaliado: { type: "string", pattern: uuidPattern },
      respostas: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["id_questao", "id_alternativa"],
          properties: {
            id_questao: { type: "string", pattern: uuidPattern },
            id_alternativa: { type: "string", pattern: uuidPattern },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  },
  response: {
    201: testeResponseSchema,
    400: messageResponseSchema,
    404: messageResponseSchema,
  },
};

export const saveTesteRespostasSchema: FastifySchema = {
  params: idParamsSchema,
  body: {
    type: "object",
    required: ["respostas"],
    properties: {
      respostas: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["id_questao", "id_alternativa"],
          properties: {
            id_questao: { type: "string", pattern: uuidPattern },
            id_alternativa: { type: "string", pattern: uuidPattern },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  },
  response: {
    200: testeResponseSchema,
    400: messageResponseSchema,
    404: messageResponseSchema,
  },
};

export const completeExistingTesteSchema: FastifySchema = {
  params: idParamsSchema,
  response: {
    200: testeResponseSchema,
    400: messageResponseSchema,
    404: messageResponseSchema,
  },
};

export const updateTesteSchema: FastifySchema = {
  params: idParamsSchema,
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      // pontuacao_total e classificacao sao calculados exclusivamente pelo
      // servidor (ver TestesService.buildResult) e nao podem ser definidos
      // pelo cliente, para evitar adulteracao do resultado do teste.
      status: { type: "string" },
      started_at: { type: "string" },
      finished_at: { type: "string" },
    },
    additionalProperties: false,
  },
  response: {
    200: testeResponseSchema,
    404: messageResponseSchema,
  },
};

export const getTesteSchema: FastifySchema = {
  params: idParamsSchema,
  response: {
    200: testeResponseSchema,
    404: messageResponseSchema,
  },
};

export const listTestesSchema: FastifySchema = {
  response: {
    200: {
      type: "array",
      items: testeResponseSchema,
    },
  },
};

export const createAvaliadoSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["nome"],
    properties: {
      nome: { type: "string", minLength: 1 },
      data_nascimento: { type: "string" },
      genero: { type: "string" },
    },
    additionalProperties: false,
  },
  response: {
    201: { type: "object" },
  },
};

export const updateAvaliadoSchema: FastifySchema = {
  params: idParamsSchema,
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      nome: { type: "string", minLength: 1 },
      data_nascimento: { type: "string" },
      genero: { type: "string" },
    },
    additionalProperties: false,
  },
  response: {
    200: { type: "object" },
    404: messageResponseSchema,
  },
};

export const getAvaliadoSchema: FastifySchema = {
  params: idParamsSchema,
  response: {
    200: { type: "object" },
    404: messageResponseSchema,
  },
};

export const listAvaliadosSchema: FastifySchema = {
  response: {
    200: {
      type: "array",
      items: { type: "object" },
    },
  },
};

// ============ CONTATO SCHEMAS COM CAMPO MENSAGEM ============

const contatoResponseSchema = {
  type: "object",
  required: ["id", "whatsapp", "email", "created_at", "updated_at"],
  properties: {
    id: { type: "string", pattern: uuidPattern },
    whatsapp: { type: "string" },
    email: { type: "string" },
    mensagem: { type: "string", nullable: true },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  additionalProperties: false,
} as const;

export const createContatoSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["whatsapp", "email"],
    properties: {
      whatsapp: { type: "string", minLength: 1 },
      email: { type: "string", minLength: 1 },
      mensagem: { type: "string" },
    },
    additionalProperties: false,
  },
  response: {
    201: contatoResponseSchema,
  },
};

export const updateContatoSchema: FastifySchema = {
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      whatsapp: { type: "string", minLength: 1 },
      email: { type: "string", minLength: 1 },
      mensagem: { type: "string" },
    },
    additionalProperties: false,
  },
  response: {
    200: contatoResponseSchema,
  },
};

export const getContatoSchema: FastifySchema = {
  response: {
    200: contatoResponseSchema,
    404: messageResponseSchema,
  },
};