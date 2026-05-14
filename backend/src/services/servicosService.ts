import { randomUUID } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { badRequest, notFound } from "../errors/AppError";
import { ServicosRepository } from "../repositories/servicosRepository";
import type {
  CreateServicePurchaseInput,
  CreateServicePurchaseResponse,
  InfinitePayWebhookInput,
  ServicePurchase,
} from "../types/servicos";
import { SERVICE_PURCHASE_STATUS } from "../types/servicos";
import { EmailService } from "./emailService";
import { InfinitePayService } from "./infinitePayService";
import { findServiceById, formatPriceInCents } from "./serviceCatalog";

export type ServicosRepositoryContract = Pick<
  ServicosRepository,
  "createPurchase" | "findPurchaseByOrderNsu" | "updatePurchase"
>;

function getUserMetadataValue(user: User, key: string): string | null {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getUserName(user: User): string | null {
  return (
    getUserMetadataValue(user, "name") ??
    getUserMetadataValue(user, "full_name")
  );
}

export class ServicosService {
  constructor(
    private readonly servicosRepository: ServicosRepositoryContract =
      new ServicosRepository(),
    private readonly infinitePayService = new InfinitePayService(),
    private readonly emailService = new EmailService(),
  ) {}

  async createPurchase(
    input: CreateServicePurchaseInput,
    user: User,
  ): Promise<CreateServicePurchaseResponse> {
    const service = findServiceById(input.serviceId);

    if (!service) {
      throw badRequest("Servico invalido.");
    }

    const orderNsu = randomUUID();
    const checkout = await this.infinitePayService.createCheckoutLink({
      orderNsu,
      service,
    });

    const purchase = await this.servicosRepository.createPurchase({
      id: randomUUID(),
      id_user: user.id,
      customer_name: getUserName(user),
      customer_email: user.email ?? getUserMetadataValue(user, "email"),
      service_id: service.id,
      service_name: service.name,
      service_price_cents: service.priceInCents,
      status: SERVICE_PURCHASE_STATUS.pending,
      checkout_url: checkout.url,
      order_nsu: orderNsu,
      invoice_slug: checkout.invoiceSlug ?? null,
      transaction_nsu: null,
      capture_method: null,
      receipt_url: null,
      notified_admin_at: null,
    });

    return {
      purchase,
      checkoutUrl: checkout.url,
    };
  }

  async confirmPayment(input: InfinitePayWebhookInput): Promise<ServicePurchase> {
    const orderNsu = input.order_nsu;

    if (!orderNsu) {
      throw badRequest("Webhook sem order_nsu.");
    }

    const purchase = await this.servicosRepository.findPurchaseByOrderNsu(orderNsu);

    if (!purchase) {
      throw notFound("Compra de servico nao encontrada.");
    }

    const payment = await this.infinitePayService.checkPayment({
      orderNsu,
      transactionNsu: input.transaction_nsu,
      slug: input.invoice_slug ?? input.slug,
    });

    if (!payment.paid) {
      return this.servicosRepository.updatePurchase(purchase.id, {
        transaction_nsu: input.transaction_nsu ?? payment.transactionNsu ?? null,
        capture_method: input.capture_method ?? null,
        receipt_url: input.receipt_url ?? payment.receiptUrl ?? null,
      });
    }

    const updatedPurchase = await this.servicosRepository.updatePurchase(
      purchase.id,
      {
        status: SERVICE_PURCHASE_STATUS.paid,
        transaction_nsu: input.transaction_nsu ?? payment.transactionNsu ?? null,
        capture_method: input.capture_method ?? null,
        receipt_url: input.receipt_url ?? payment.receiptUrl ?? null,
      },
    );

    if (updatedPurchase.notified_admin_at) {
      return updatedPurchase;
    }

    const notified = await this.emailService.notifyServicePurchase({
      customerName: updatedPurchase.customer_name,
      customerEmail: updatedPurchase.customer_email,
      serviceName: updatedPurchase.service_name,
      servicePrice: formatPriceInCents(updatedPurchase.service_price_cents),
      paymentStatus: payment.paymentStatus,
      orderNsu,
      transactionNsu: updatedPurchase.transaction_nsu,
      receiptUrl: updatedPurchase.receipt_url,
    });

    if (!notified) {
      return updatedPurchase;
    }

    return this.servicosRepository.updatePurchase(updatedPurchase.id, {
      notified_admin_at: new Date().toISOString(),
    });
  }
}
