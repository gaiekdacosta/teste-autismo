import type { FastifyInstance } from "fastify";
import { listUsuariosSchema } from "../schemas/usuarios";
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
}
