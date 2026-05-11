import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { User } from "@supabase/supabase-js";
import { supabaseAnon } from "../lib/supabase";

declare module "fastify" {
  interface FastifyRequest {
    user: User | null;
  }
}

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

export const authPlugin = fp(async (fastify) => {
  fastify.decorateRequest("user", null);
  fastify.decorate("authenticate", authenticate);
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: typeof authenticate;
  }
}
