import type { FastifyInstance } from "fastify";
import { supabaseAdmin } from "../lib/supabase";

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/health", async () => {
    return { status: "ok" };
  });

  // Rota de keep-alive: faz uma consulta leve no Supabase para impedir que o
  // projeto seja pausado por inatividade e que a conexao caia. Ideal para ser
  // chamada periodicamente por um cron/uptime monitor.
  fastify.get("/keep-alive", async (_request, reply) => {
    const { error } = await supabaseAdmin
      .from("questionarios")
      .select("id", { head: true, count: "exact" });

    if (error) {
      fastify.log.error(error);
      reply.status(503).send({ status: "error", database: "unreachable" });
      return;
    }

    return { status: "ok", database: "reachable", checkedAt: new Date().toISOString() };
  });
}
