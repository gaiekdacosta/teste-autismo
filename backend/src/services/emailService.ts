type EmailTemplateParams = Record<string, string | number | null | undefined>;

type SendEmailInput = {
  templateId: string;
  params: EmailTemplateParams;
};

type NotifyNewUserInput = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt?: string | null;
};

type NotifyServicePurchaseInput = {
  customerName?: string | null;
  customerEmail?: string | null;
  recipientEmail?: string | null;
  recipientRole: "customer" | "admin";
  serviceName: string;
  servicePrice: string;
  paymentStatus: string;
  orderNsu?: string | null;
  transactionNsu?: string | null;
  receiptUrl?: string | null;
};

function getEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function getOptionalText(value?: string | null): string {
  return value && value.trim().length > 0 ? value : "Nao informado";
}

export class EmailService {
  private readonly serviceId = getEnv("EMAILJS_SERVICE_ID");
  private readonly publicKey = getEnv("EMAILJS_PUBLIC_KEY");
  private readonly privateKey = getEnv("EMAILJS_PRIVATE_KEY");
  private readonly adminEmail = getEnv("ADMIN_NOTIFICATION_EMAIL");
  private readonly newUserTemplateId = getEnv("EMAILJS_TEMPLATE_NEW_USER");
  private readonly servicePurchaseTemplateId = getEnv(
    "EMAILJS_TEMPLATE_SERVICE_PURCHASE",
  );

  async notifyNewUser(input: NotifyNewUserInput): Promise<boolean> {
    if (!this.newUserTemplateId) return false;

    return this.sendEmail({
      templateId: this.newUserTemplateId,
      params: {
        admin_email: this.adminEmail,
        user_id: input.id,
        user_name: getOptionalText(input.name),
        user_email: getOptionalText(input.email),
        user_phone: getOptionalText(input.phone),
        created_at: getOptionalText(input.createdAt),
      },
    });
  }

  async notifyServicePurchase(
    input: NotifyServicePurchaseInput,
  ): Promise<boolean> {
    if (!this.servicePurchaseTemplateId) return false;

    const recipientEmail =
      input.recipientEmail ??
      (input.recipientRole === "customer" ? input.customerEmail : this.adminEmail);

    if (!recipientEmail) return false;

    return this.sendEmail({
      templateId: this.servicePurchaseTemplateId,
      params: {
        admin_email: recipientEmail,
        to_email: recipientEmail,
        recipient_email: recipientEmail,
        recipient_role: input.recipientRole,
        email_subject:
          input.recipientRole === "customer"
            ? "Parabens pela sua compra"
            : "Nova compra realizada",
        customer_name: getOptionalText(input.customerName),
        customer_email: getOptionalText(input.customerEmail),
        service_name: input.serviceName,
        service_price: input.servicePrice,
        payment_status: input.paymentStatus,
        order_nsu: getOptionalText(input.orderNsu),
        transaction_nsu: getOptionalText(input.transactionNsu),
        receipt_url: getOptionalText(input.receiptUrl),
      },
    });
  }

  private async sendEmail(input: SendEmailInput): Promise<boolean> {
    if (!this.serviceId || !this.publicKey) {
      return false;
    }

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: this.serviceId,
        template_id: input.templateId,
        user_id: this.publicKey,
        accessToken: this.privateKey,
        template_params: input.params,
      }),
    });

    return response.ok;
  }
}
