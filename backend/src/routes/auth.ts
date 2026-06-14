import type { FastifyInstance } from "fastify";
import { registerSchema, notifyCurrentUserSchema } from "../schemas/auth";
import { AuthService } from "../services/authService";
import type { RegisterCredentials } from "../services/authService";

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const authService = new AuthService();

  // Existing POST route
  fastify.post<{ Body: RegisterCredentials }>(
    "/auth/register",
    { schema: registerSchema },
    async (request) => authService.registerWithPassword(request.body),
  );

  // New GET handler to inform that only POST is allowed
  fastify.get(
    "/auth/register",
    async (request, reply) => {
      reply.code(405).send({ message: "Method Not Allowed. Use POST to register." });
    },
  );

  fastify.post(
    "/auth/notify-new-user",
    { schema: notifyCurrentUserSchema, onRequest: [fastify.authenticate] },
    async (request) => {
      const user = request.user;

      if (!user) {
        throw new Error("Unauthorized");
      }

      return authService.notifyNewUserIfNeeded(user);
    },
  );
}
