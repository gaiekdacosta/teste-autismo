import type { FastifyInstance } from "fastify";
import {
  createServicePurchaseSchema,
  infinitePayWebhookSchema,
  listServicesSchema,
} from "../schemas/servicos";
import { ServicosService } from "../services/servicosService";
import { listServices } from "../services/serviceCatalog";
import type {
  CreateServicePurchaseInput,
  InfinitePayWebhookInput,
} from "../types/servicos";

export async function servicosRoutes(fastify: FastifyInstance): Promise<void> {
  const servicosService = new ServicosService();

  fastify.get(
    "/servicos",
    { schema: listServicesSchema },
    async () => listServices(),
  );

  fastify.post<{ Body: CreateServicePurchaseInput }>(
    "/servicos/compras",
    {
      schema: createServicePurchaseSchema,
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = request.user;

      if (!user) {
        throw new Error("Unauthorized");
      }

      const purchase = await servicosService.createPurchase(request.body, user);
      reply.status(201);
      return purchase;
    },
  );

  fastify.post<{ Body: InfinitePayWebhookInput }>(
    "/webhooks/infinitepay",
    { schema: infinitePayWebhookSchema },
    async (request) => servicosService.confirmPayment(request.body),
  );
}
