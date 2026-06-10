import type { FastifyInstance } from "fastify";
import {
  completeExistingTesteSchema,
  completeTesteSchema,
  createAvaliadoSchema,
  createContatoSchema,
  createTesteSchema,
  getAvaliadoSchema,
  getContatoSchema,
  getTesteSchema,
  listAvaliadosSchema,
  listTestesSchema,
  saveTesteRespostasSchema,
  updateAvaliadoSchema,
  updateContatoSchema,
  updateTesteSchema,
} from "../schemas/testes";
import { TestesService } from "../services/testesService";
import { ServicosService } from "../services/servicosService";
import type {
  CompleteTesteInput,
  CreateAvaliadoInput,
  CreateContatoInput,
  CreateTesteInput,
  SaveTesteRespostasInput,
  UpdateAvaliadoInput,
  UpdateContatoInput,
  UpdateTesteInput,
} from "../types/testes";

type TesteParams = {
  id: string;
};

type AvaliadoParams = {
  id: string;
};

export async function testesRoutes(fastify: FastifyInstance): Promise<void> {
  const testesService = new TestesService(undefined, new ServicosService());

  // Rotas para testes
  fastify.get(
    "/testes",
    { schema: listTestesSchema, onRequest: [fastify.authenticate] },
    async (request) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      return await testesService.listByUser(userId);
    },
  );

  fastify.get<{ Params: TesteParams }>(
    "/testes/:id",
    { schema: getTesteSchema, onRequest: [fastify.authenticate] },
    async (request) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      if (!request.params.id) {
        throw new Error("ID do teste é obrigatório");
      }
      return testesService.getById(request.params.id, userId);
    },
  );

  fastify.post<{ Body: CreateTesteInput }>(
    "/testes",
    { schema: createTesteSchema, onRequest: [fastify.authenticate] },
    async (request) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      const teste = await testesService.create(request.body, userId);
      return teste;
    },
  );

  fastify.post<{ Body: CompleteTesteInput }>(
    "/testes/concluir",
    { schema: completeTesteSchema, onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      const teste = await testesService.complete(request.body, userId);
      reply.status(201);
      return teste;
    },
  );

  fastify.put<{ Params: TesteParams; Body: SaveTesteRespostasInput }>(
    "/testes/:id/respostas",
    { schema: saveTesteRespostasSchema, onRequest: [fastify.authenticate] },
    async (request) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      return testesService.saveRespostas(request.params.id, request.body, userId);
    },
  );

  fastify.post<{ Params: TesteParams }>(
    "/testes/:id/concluir",
    { schema: completeExistingTesteSchema, onRequest: [fastify.authenticate] },
    async (request) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      return testesService.completeExisting(request.params.id, userId);
    },
  );

  fastify.put<{ Params: TesteParams; Body: UpdateTesteInput }>(
    "/testes/:id",
    { schema: updateTesteSchema, onRequest: [fastify.authenticate] },
    async (request) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      return testesService.update(request.params.id, request.body, userId);
    },
  );

  // Rotas para avaliados
  fastify.get(
    "/avaliados",
    { schema: listAvaliadosSchema, onRequest: [fastify.authenticate] },
    async (request) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      return testesService.listAvaliados(userId);
    },
  );

  fastify.get<{ Params: AvaliadoParams }>(
    "/avaliados/:id",
    { schema: getAvaliadoSchema, onRequest: [fastify.authenticate] },
    async (request) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      return testesService.getAvaliado(request.params.id, userId);
    },
  );

  fastify.post<{ Body: CreateAvaliadoInput }>(
    "/avaliados",
    { schema: createAvaliadoSchema, onRequest: [fastify.authenticate] },
    async (request) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      return testesService.createAvaliado(request.body, userId);
    },
  );

  fastify.put<{ Params: AvaliadoParams; Body: UpdateAvaliadoInput }>(
    "/avaliados/:id",
    { schema: updateAvaliadoSchema, onRequest: [fastify.authenticate] },
    async (request) => {
      const userId = request.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      return testesService.updateAvaliado(request.params.id, request.body, userId);
    },
  );

  // Rotas para contato
  fastify.get(
    "/contato",
    { schema: getContatoSchema },
    async () => {
      return testesService.getContato();
    },
  );

  fastify.post<{ Body: CreateContatoInput }>(
    "/contato",
    {
      schema: createContatoSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async (request) => testesService.createContato(request.body),
  );

  fastify.put<{ Body: UpdateContatoInput }>(
    "/contato",
    {
      schema: updateContatoSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async (request) => testesService.updateContato(request.body),
  );
}