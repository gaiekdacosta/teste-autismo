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

function appendOrderNsu(url: string | undefined, orderNsu: string): string | undefined {
  if (!url) {
    return undefined;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}order_nsu=${encodeURIComponent(orderNsu)}`;
}

function getPublicUrlEnv(name: string): string | undefined {
  const value = getEnv(name);

  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (isLocalhost) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

function validateService(service: ServiceCatalogItem): void {
  if (!service.description.trim()) {
    throw badRequest("Descricao do servico e obrigatoria para gerar o checkout.");
  }

  if (!Number.isInteger(service.priceInCents) || service.priceInCents <= 0) {
    throw badRequest("Valor do servico deve ser maior que zero.");
  }
}

export class InfinitePayService {
  async createCheckoutLink(
    input: CreateCheckoutLinkInput,
  ): Promise<CreateCheckoutLinkResponse> {
    validateService(input.service);

    const handle = getRequiredEnv("INFINITEPAY_HANDLE");
    const redirectUrl = appendOrderNsu(
      getPublicUrlEnv("INFINITEPAY_REDIRECT_URL"),
      input.orderNsu,
    );
    const webhookUrl = getPublicUrlEnv("INFINITEPAY_WEBHOOK_URL");
    const body = {
      handle,
      order_nsu: input.orderNsu,
      ...(redirectUrl ? { redirect_url: redirectUrl } : {}),
      ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
      items: [
        {
          quantity: 1,
          price: input.service.priceInCents,
          description: input.service.name,
        },
      ],
    };

    const response = await fetch(getInfinitePayUrl("/links"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
