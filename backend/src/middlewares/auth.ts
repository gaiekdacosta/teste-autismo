import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { User } from "@supabase/supabase-js";
import { AdministradoresService } from "../services/administradoresService";
import type { Administrador } from "../types/administradores";
import { supabaseAnon } from "../lib/supabase";

declare module "fastify" {
  interface FastifyRequest {
    user: User | null;
    administrador: Administrador | null;
  }
}

const administradoresService = new AdministradoresService();

async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authorization = request.headers.authorization;

  if (!authorization) {
    reply.status(401).send({ message: "Unauthorized" });
    return;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    reply.status(401).send({ message: "Unauthorized" });
    return;
  }

  const { data, error } = await supabaseAnon.auth.getUser(token);

  if (error || !data.user) {
    reply.status(401).send({ message: "Unauthorized" });
    return;
  }

  request.user = data.user;
}

async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.user?.id;

  if (!userId) {
    reply.status(401).send({ message: "Unauthorized" });
    return;
  }

  const administrador = await administradoresService.findActiveByUserId(userId);

  if (!administrador) {
    reply.status(403).send({ message: "Acesso restrito a administradores." });
    return;
  }

  request.administrador = administrador;
}

export const authPlugin = fp(async (fastify) => {
  fastify.decorateRequest("user", null);
  fastify.decorateRequest("administrador", null);
  fastify.decorate("authenticate", authenticate);
  fastify.decorate("requireAdmin", requireAdmin);
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: typeof authenticate;
    requireAdmin: typeof requireAdmin;
  }
}
