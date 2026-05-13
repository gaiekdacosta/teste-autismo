import type { FastifyInstance } from "fastify";
import {
  createAdministradorSchema,
  deleteAdministradorSchema,
  getAdministradorMeSchema,
  listAdministradoresSchema,
  updateAdministradorSchema,
} from "../schemas/administradores";
import { AdministradoresService } from "../services/administradoresService";
import type {
  CreateAdministradorInput,
  UpdateAdministradorInput,
} from "../types/administradores";

type AdministradorParams = {
  id: string;
};

export async function administradoresRoutes(fastify: FastifyInstance): Promise<void> {
  const administradoresService = new AdministradoresService();

  fastify.get(
    "/administradores/me",
    {
      schema: getAdministradorMeSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async (request) => request.administrador,
  );

  fastify.get(
    "/administradores",
    {
      schema: listAdministradoresSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async () => administradoresService.list(),
  );

  fastify.post<{ Body: CreateAdministradorInput }>(
    "/administradores",
    {
      schema: createAdministradorSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async (request, reply) => {
      const administrador = await administradoresService.create(request.body);
      return reply.status(201).send(administrador);
    },
  );

  fastify.put<{ Params: AdministradorParams; Body: UpdateAdministradorInput }>(
    "/administradores/:id",
    {
      schema: updateAdministradorSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async (request) => administradoresService.update(request.params.id, request.body),
  );

  fastify.delete<{ Params: AdministradorParams }>(
    "/administradores/:id",
    {
      schema: deleteAdministradorSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async (request, reply) => {
      await administradoresService.delete(request.params.id);
      return reply.status(204).send();
    },
  );
}
