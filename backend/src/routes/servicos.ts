import type { FastifyInstance } from "fastify";
import {
  confirmServicePurchaseSchema,
  createServicePurchaseSchema,
  deleteServicePurchasesSchema,
  getServiceAccessSchema,
  infinitePayWebhookSchema,
  listServicePurchasesSchema,
  listServicesSchema,
  updateServiceSchema,
} from "../schemas/servicos";
import { ServicosService } from "../services/servicosService";
import type {
  CreateServicePurchaseInput,
  InfinitePayWebhookInput,
  ServiceCatalogItem,
  UpdateServiceInput,
} from "../types/servicos";

type InfinitePayWebhookQuery = {
  token?: string;
};

function getEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export async function servicosRoutes(fastify: FastifyInstance): Promise<void> {
  const servicosService = new ServicosService();

  fastify.get(
    "/servicos",
    { schema: listServicesSchema },
    async () => servicosService.listServices(),
  );

  fastify.put<{
    Params: { id: ServiceCatalogItem["id"] };
    Body: UpdateServiceInput;
  }>(
    "/servicos/:id",
    {
      schema: updateServiceSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async (request) => servicosService.updateService(request.params.id, request.body),
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

  fastify.get(
    "/servicos/compras",
    {
      schema: listServicePurchasesSchema,
      onRequest: [fastify.authenticate],
    },
    async (request) => {
      const userId = request.user?.id;

      if (!userId) {
        throw new Error("Unauthorized");
      }

      return servicosService.listUserPurchases(userId);
    },
  );

  fastify.delete(
    "/servicos/compras",
    {
      schema: deleteServicePurchasesSchema,
      onRequest: [fastify.authenticate, fastify.requireAdmin],
    },
    async () => servicosService.deleteAllPurchases(),
  );

  fastify.get(
    "/servicos/acesso",
    {
      schema: getServiceAccessSchema,
      onRequest: [fastify.authenticate],
    },
    async (request) => {
      const userId = request.user?.id;

      if (!userId) {
        throw new Error("Unauthorized");
      }

      return servicosService.getUserAccess(userId);
    },
  );

  fastify.post<{ Body: InfinitePayWebhookInput }>(
    "/servicos/compras/confirmar",
    {
      schema: confirmServicePurchaseSchema,
      onRequest: [fastify.authenticate],
    },
    async (request) => {
      const userId = request.user?.id;

      if (!userId) {
        throw new Error("Unauthorized");
      }

      return servicosService.confirmPayment(request.body, userId);
    },
  );

  fastify.post<{
    Body: InfinitePayWebhookInput;
    Querystring: InfinitePayWebhookQuery;
  }>(
    "/webhooks/infinitepay",
    { schema: infinitePayWebhookSchema },
    async (request, reply) => {
      const expectedToken = getEnv("INFINITEPAY_WEBHOOK_TOKEN");

      if (expectedToken && request.query.token !== expectedToken) {
        reply.status(401);
        return { message: "Webhook nao autorizado." };
      }

      return servicosService.handleInfinitePayWebhook(request.body);
    },
  );
}
