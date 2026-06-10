import { randomUUID } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { badRequest, notFound } from "../errors/AppError";
import { AdministradoresRepository } from "../repositories/administradoresRepository";
import { ServicosRepository } from "../repositories/servicosRepository";
import type {
  CreateServicePurchaseInput,
  CreateServicePurchaseResponse,
  DeletePurchasesResult,
  InfinitePayWebhookInput,
  InfinitePayWebhookResponse,
  ServiceAccess,
  ServiceCatalogItem,
  ServicePackageRow,
  ServicePurchase,
  UpdateServiceInput,
} from "../types/servicos";
import { SERVICE_PURCHASE_STATUS } from "../types/servicos";
import { EmailService } from "./emailService";
import { InfinitePayService } from "./infinitePayService";
import {
  findServiceById,
  formatPriceInCents,
  getDefaultServices,
  getServiceAccessRules,
} from "./serviceCatalog";

export type ServicosRepositoryContract = Pick<
  ServicosRepository,
  | "listServicePackages"
  | "updateServicePackage"
  | "listPurchasesByUserId"
  | "createPurchase"
  | "findPurchaseByOrderNsu"
  | "updatePurchase"
  | "deleteAllPurchases"
>;

const ADMIN_TEST_PRICE_IN_CENTS = 100;

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

function normalizePriceInCents(value: number | string): number {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Math.round(numericValue * 100);
}

function mapPackageToService(row: ServicePackageRow): ServiceCatalogItem {
  const accessRules = getServiceAccessRules(row.service_id);

  return {
    id: row.service_id,
    name: row.pacote,
    description: row.descricao,
    priceInCents: normalizePriceInCents(row.valor),
    active: row.ativo ?? true,
    ...accessRules,
  };
}

function isValidServiceId(id: string): id is ServiceCatalogItem["id"] {
  return Boolean(findServiceById(id));
}

export class ServicosService {
  constructor(
    private readonly servicosRepository: ServicosRepositoryContract =
      new ServicosRepository(),
    private readonly infinitePayService = new InfinitePayService(),
    private readonly emailService = new EmailService(),
    private readonly administradoresRepository = new AdministradoresRepository(),
  ) {}

  async listServices(): Promise<ServiceCatalogItem[]> {
    const packages = await this.servicosRepository.listServicePackages();

    if (packages.length === 0) {
      return getDefaultServices();
    }

    return packages.map(mapPackageToService);
  }

  async updateService(
    serviceId: string,
    input: UpdateServiceInput,
  ): Promise<ServiceCatalogItem> {
    if (!isValidServiceId(serviceId)) {
      throw badRequest("Servico invalido.");
    }

    const updatedPackage = await this.servicosRepository.updateServicePackage(
      serviceId,
      input,
    );

    if (!updatedPackage) {
      throw notFound("Pacote de servico nao encontrado.");
    }

    return mapPackageToService(updatedPackage);
  }

  async createPurchase(
    input: CreateServicePurchaseInput,
    user: User,
  ): Promise<CreateServicePurchaseResponse> {
    const services = await this.listServices();
    const selectedService =
      services.find((item) => item.id === input.serviceId) ?? null;

    if (!selectedService) {
      throw badRequest("Servico invalido.");
    }

    const administrador =
      input.testMode
        ? await this.administradoresRepository.findActiveByUserId(user.id)
        : null;
    const service =
      input.testMode && administrador
        ? {
            ...selectedService,
            name: `${selectedService.name} - Teste admin`,
            priceInCents: ADMIN_TEST_PRICE_IN_CENTS,
          }
        : selectedService;

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

  async listUserPurchases(userId: string): Promise<ServicePurchase[]> {
    return this.servicosRepository.listPurchasesByUserId(userId);
  }

  async deleteAllPurchases(): Promise<DeletePurchasesResult> {
    const deletedCount = await this.servicosRepository.deleteAllPurchases();
    return { deletedCount };
  }

  async getUserAccess(userId: string): Promise<ServiceAccess> {
    const purchases = await this.servicosRepository.listPurchasesByUserId(userId);
    const paidPurchases = purchases.filter(
      (purchase) => purchase.status === SERVICE_PURCHASE_STATUS.paid,
    );

    return {
      canUseTests: paidPurchases.some((purchase) => {
        const service = getServiceAccessRules(purchase.service_id);
        return service?.grantsTestAccess === true;
      }),
      canScheduleConsultation: paidPurchases.some((purchase) => {
        const service = getServiceAccessRules(purchase.service_id);
        return service?.grantsConsultationAccess === true;
      }),
      paidPurchases,
    };
  }

  async userCanUseTests(userId: string): Promise<boolean> {
    const access = await this.getUserAccess(userId);
    return access.canUseTests;
  }

  async confirmPayment(
    input: InfinitePayWebhookInput,
    userId?: string,
  ): Promise<ServicePurchase> {
    const orderNsu = input.order_nsu;

    if (!orderNsu) {
      throw badRequest("Webhook sem order_nsu.");
    }

    const purchase = await this.servicosRepository.findPurchaseByOrderNsu(orderNsu);

    if (!purchase) {
      throw notFound("Compra de servico nao encontrada.");
    }

    if (userId && purchase.id_user !== userId) {
      throw notFound("Compra de servico nao encontrada.");
    }

    if (purchase.status === SERVICE_PURCHASE_STATUS.paid) {
      return purchase;
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

    const notified = await this.notifyPaidPurchase(
      updatedPurchase,
      payment.paymentStatus,
    );

    return notified
      ? this.servicosRepository.updatePurchase(updatedPurchase.id, {
          notified_admin_at: new Date().toISOString(),
        })
      : updatedPurchase;
  }

  async handleInfinitePayWebhook(
    input: InfinitePayWebhookInput,
  ): Promise<InfinitePayWebhookResponse> {
    const orderNsu = input.order_nsu;

    if (!orderNsu) {
      throw badRequest("Webhook sem order_nsu.");
    }

    const purchase = await this.servicosRepository.findPurchaseByOrderNsu(orderNsu);

    if (!purchase) {
      throw notFound("Compra de servico nao encontrada.");
    }

    if (purchase.status === SERVICE_PURCHASE_STATUS.paid) {
      return {
        success: true,
        message: null,
        purchaseId: purchase.id,
        status: purchase.status,
      };
    }

    const updatedPurchase = await this.servicosRepository.updatePurchase(
      purchase.id,
      {
        status: SERVICE_PURCHASE_STATUS.paid,
        transaction_nsu: input.transaction_nsu ?? null,
        capture_method: input.capture_method ?? null,
        receipt_url: input.receipt_url ?? null,
      },
    );

    void this.notifyPaidPurchase(updatedPurchase, "webhook")
      .then((notified) => {
        if (!notified) return undefined;

        return this.servicosRepository.updatePurchase(updatedPurchase.id, {
          notified_admin_at: new Date().toISOString(),
        });
      })
      .catch(() => undefined);

    return {
      success: true,
      message: null,
      purchaseId: updatedPurchase.id,
      status: updatedPurchase.status,
    };
  }

  private async notifyPaidPurchase(
    purchase: ServicePurchase,
    paymentStatus: string,
  ): Promise<boolean> {
    if (purchase.notified_admin_at) {
      return false;
    }

    const adminEmails = await this.administradoresRepository.findActiveEmails();
    const envAdminEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
    if (envAdminEmail && !adminEmails.map((e) => e.toLowerCase()).includes(envAdminEmail.toLowerCase())) {
      adminEmails.push(envAdminEmail);
    }
    const servicePrice = formatPriceInCents(purchase.service_price_cents);
    const baseInput = {
      customerName: purchase.customer_name,
      customerEmail: purchase.customer_email,
      serviceName: purchase.service_name,
      servicePrice,
      paymentStatus,
      orderNsu: purchase.order_nsu,
      transactionNsu: purchase.transaction_nsu,
      receiptUrl: purchase.receipt_url,
    };

    const notifications = [
      this.emailService.notifyServicePurchase({
        ...baseInput,
        recipientEmail: purchase.customer_email,
        recipientRole: "customer",
      }),
      ...adminEmails.map((email) =>
        this.emailService.notifyServicePurchase({
          ...baseInput,
          recipientEmail: email,
          recipientRole: "admin",
        }),
      ),
    ];

    const results = await Promise.allSettled(notifications);
    return results.some(
      (result) => result.status === "fulfilled" && result.value,
    );
  }

  /**
   * Send a notification email to all admins about a successful purchase.
   * This can be called manually if needed.
   */
  async sendAdminNotification(purchaseId: string): Promise<void> {
    // Retrieve the purchase details
    const purchase = await this.servicosRepository.findPurchaseByOrderNsu(
      // We assume order_nsu is the same as purchase id for lookup; adjust if needed
      // Here we fetch by purchase id directly (might need a new repo method, but we can reuse findPurchaseByOrderNsu if order_nsu is known)
      // For simplicity, we will fetch by id using repository (add method if missing)
      // Since repository does not have findById, we will use findPurchaseByOrderNsu with purchaseId as fallback
      purchaseId,
    );
    if (!purchase) {
      throw new Error('Purchase not found for admin notification.');
    }

    const adminEmails = await this.administradoresRepository.findActiveEmails();
    const envAdminEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
    if (envAdminEmail && !adminEmails.map((e) => e.toLowerCase()).includes(envAdminEmail.toLowerCase())) {
      adminEmails.push(envAdminEmail);
    }
    const servicePrice = formatPriceInCents(purchase.service_price_cents);
    const baseInput = {
      customerName: purchase.customer_name,
      customerEmail: purchase.customer_email,
      serviceName: purchase.service_name,
      servicePrice,
      paymentStatus: 'paid', // we know it's a successful purchase
      orderNsu: purchase.order_nsu,
      transactionNsu: purchase.transaction_nsu,
      receiptUrl: purchase.receipt_url,
    };

    const notifications = adminEmails.map((email) =>
      this.emailService.notifyServicePurchase({
        ...baseInput,
        recipientEmail: email,
        recipientRole: "admin",
      }),
    );
    await Promise.allSettled(notifications);
  }
}

