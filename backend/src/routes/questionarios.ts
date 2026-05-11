import type { FastifyInstance } from "fastify";
import {
  createQuestionarioSchema,
  deleteQuestionarioSchema,
  getActiveQuestionarioSchema,
  getQuestionarioSchema,
  listQuestionariosSchema,
  toggleQuestionarioSchema,
  updateQuestionarioSchema,
} from "../schemas/questionarios";
import { QuestionariosService } from "../services/questionariosService";
import type {
  CreateQuestionarioInput,
  UpdateQuestionarioInput,
} from "../types/questionarios";

type QuestionarioParams = {
  id: string;
};

export async function questionariosRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const questionariosService = new QuestionariosService();

  fastify.get(
    "/questionarios/ativo",
    { schema: getActiveQuestionarioSchema },
    async () => questionariosService.getActive(),
  );

  fastify.get(
    "/questionarios",
    { schema: listQuestionariosSchema },
    async () => questionariosService.list(),
  );

  fastify.get<{ Params: QuestionarioParams }>(
    "/questionarios/:id",
    { schema: getQuestionarioSchema },
    async (request) => questionariosService.getById(request.params.id),
  );

  fastify.post<{ Body: CreateQuestionarioInput }>(
    "/questionarios",
    { schema: createQuestionarioSchema },
    async (request, reply) => {
      const questionario = await questionariosService.create(request.body);
      return reply.status(201).send(questionario);
    },
  );

  fastify.put<{ Params: QuestionarioParams; Body: UpdateQuestionarioInput }>(
    "/questionarios/:id",
    { schema: updateQuestionarioSchema },
    async (request) =>
      questionariosService.update(request.params.id, request.body),
  );

  fastify.patch<{ Params: QuestionarioParams }>(
    "/questionarios/:id/ativar",
    { schema: toggleQuestionarioSchema },
    async (request) => questionariosService.activate(request.params.id),
  );

  fastify.patch<{ Params: QuestionarioParams }>(
    "/questionarios/:id/desativar",
    { schema: toggleQuestionarioSchema },
    async (request) => questionariosService.deactivate(request.params.id),
  );

  fastify.delete<{ Params: QuestionarioParams }>(
    "/questionarios/:id",
    { schema: deleteQuestionarioSchema },
    async (request, reply) => {
      await questionariosService.delete(request.params.id);
      return reply.status(204).send();
    },
  );
}
