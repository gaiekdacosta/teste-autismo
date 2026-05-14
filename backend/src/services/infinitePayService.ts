import { badRequest, internalError } from "../errors/AppError";
import type { ServiceCatalogItem } from "../types/servicos";

type CreateCheckoutLinkInput = {
  orderNsu: string;
  service: ServiceCatalogItem;
};

type CreateCheckoutLinkResponse = {
  url: string;
  invoiceSlug?: string | null;
};

type PaymentCheckResponse = {
  paid: boolean;
  paymentStatus: string;
  receiptUrl?: string | null;
  transactionNsu?: string | null;
};

type CheckPaymentInput = {
  orderNsu: string;
  transactionNsu?: string | null;
  slug?: string | null;
};

type InfinitePayLinkResponse = {
  url?: string;
  checkout_url?: string;
  invoice_url?: string;
  slug?: string;
  invoice_slug?: string;
};

type InfinitePayCheckResponse = {
  paid?: boolean;
  status?: string;
  payment_status?: string;
  receipt_url?: string;
  transaction_nsu?: string;
};

type InfinitePayErrorResponse = {
  message?: string;
};

function getEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function getRequiredEnv(name: string): string {
  const value = getEnv(name);

  if (!value) {
    throw internalError(`Configure a variavel de ambiente ${name}.`);
  }

  return value;
}

function getInfinitePayUrl(path: string): string {
  const baseUrl =
    getEnv("INFINITEPAY_API_URL") ?? "https://api.checkout.infinitepay.io";
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function isPaidStatus(status?: string): boolean {
  return status === "paid" || status === "approved" || status === "authorized";
}

export class InfinitePayService {
  async createCheckoutLink(
    input: CreateCheckoutLinkInput,
  ): Promise<CreateCheckoutLinkResponse> {
    const handle = getRequiredEnv("INFINITEPAY_HANDLE");
    const redirectUrl = getEnv("INFINITEPAY_REDIRECT_URL");
    const webhookUrl = process.env.INFINITEPAY_WEBHOOK_URL ?? "";

    const response = await fetch(getInfinitePayUrl("/links"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        handle,
        order_nsu: input.orderNsu,
        redirect_url: redirectUrl,
        webhook_url: webhookUrl,
        items: [
          {
            name: input.service.name,
            description: input.service.description,
            quantity: 1,
            price: input.service.priceInCents,
          },
        ],
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as
      | InfinitePayLinkResponse
      | InfinitePayErrorResponse;

    if (!response.ok) {
      const message =
        "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "Nao foi possivel criar o link de pagamento.";
      throw badRequest(message);
    }

    const linkPayload = payload as InfinitePayLinkResponse;
    const url =
      linkPayload.url ?? linkPayload.checkout_url ?? linkPayload.invoice_url;

    if (!url) {
      throw internalError("A InfinitePay nao retornou a URL de checkout.");
    }

    return {
      url,
      invoiceSlug: linkPayload.invoice_slug ?? linkPayload.slug ?? null,
    };
  }

  async checkPayment(input: CheckPaymentInput): Promise<PaymentCheckResponse> {
    const handle = getRequiredEnv("INFINITEPAY_HANDLE");
    const response = await fetch(getInfinitePayUrl("/payment_check"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        handle,
        order_nsu: input.orderNsu,
        transaction_nsu: input.transactionNsu,
        slug: input.slug,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as
      | InfinitePayCheckResponse
      | InfinitePayErrorResponse;

    if (!response.ok) {
      const message =
        "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "Nao foi possivel confirmar o pagamento na InfinitePay.";
      throw badRequest(message);
    }

    const checkPayload = payload as InfinitePayCheckResponse;
    const paymentStatus =
      checkPayload.payment_status ?? checkPayload.status ?? "unknown";

    return {
      paid: checkPayload.paid === true || isPaidStatus(paymentStatus),
      paymentStatus,
      receiptUrl: checkPayload.receipt_url ?? null,
      transactionNsu: checkPayload.transaction_nsu ?? null,
    };
  }
}
