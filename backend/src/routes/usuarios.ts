import type { FastifyInstance } from "fastify";
import {
  deleteUsuarioSchema,
  listUsuariosSchema,
  updateContatadoSchema,
} from "../schemas/usuarios";
import { UsuariosService } from "../services/usuariosService";

export async function usuariosRoutes(fastify: FastifyInstance): Promise<void> {
  const usuariosService = new UsuariosService();

  fastify.get(
    "/usuarios",
    {
      schema: listUsuariosSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async () => usuariosService.listAll(),
  );

  fastify.patch<{ Params: { id: string }; Body: { contatado: boolean } }>(
    "/usuarios/:id/contatado",
    {
      schema: updateContatadoSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async (request) =>
      usuariosService.setContatado(request.params.id, request.body.contatado),
  );

  fastify.delete<{ Params: { id: string } }>(
    "/usuarios/:id",
    {
      schema: deleteUsuarioSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async (request, reply) => {
      const requesterId = request.user?.id;

      if (!requesterId) {
        throw new Error("Unauthorized");
      }

      await usuariosService.deleteUser(request.params.id, requesterId);
      return reply.status(204).send();
    },
  );
}
