type EmailTemplateParams = Record<string, string | number | null | undefined>;

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
  customerPhone?: string | null;
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

function getWhatsappLink(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCountryCode = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountryCode}`;
}

function getEmailWrapper(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #f5f5f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #121212; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #388e3c 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: sans-serif;">${title}</h1>
      </div>
      <div style="padding: 32px 24px; color: #f5f5f5; line-height: 1.6;">
        ${contentHtml}
      </div>
      <div style="background-color: #1a1a1a; padding: 20px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #2a2a2a;">
        <p style="margin: 0; font-family: sans-serif;">Este é um e-mail automático enviado pelo sistema. Por favor, não responda a esta mensagem.</p>
      </div>
    </div>
  </body>
</html>
  `;
}

export class EmailService {
  private readonly apiKey = getEnv("RESEND_API_KEY");
  private readonly fromEmail = getEnv("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";
  private readonly adminEmail = getEnv("ADMIN_NOTIFICATION_EMAIL");

  async notifyNewUser(input: NotifyNewUserInput): Promise<boolean> {
    if (!this.adminEmail) {
      console.warn("[EmailService] ADMIN_NOTIFICATION_EMAIL is not configured.");
      return false;
    }

    const title = "Novo Usuário Cadastrado";
    const name = getOptionalText(input.name);
    const email = getOptionalText(input.email);
    const phone = getOptionalText(input.phone);
    const id = input.id;
    const date = input.createdAt ? new Date(input.createdAt).toLocaleString("pt-BR") : "Não informado";

    const contentHtml = `
      <p style="font-family: sans-serif; font-size: 16px; color: #f5f5f5; margin-bottom: 12px;">Olá,</p>
      <p style="font-family: sans-serif; font-size: 16px; color: #9ca3af; margin-bottom: 24px;">Um novo usuário se cadastrou no sistema. Veja os detalhes da conta abaixo:</p>
      
      <table cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 20px; margin: 20px 0; border-collapse: separate;">
        <tr>
          <td colspan="2" style="font-size: 16px; font-weight: 600; padding-bottom: 12px; color: #ffffff; font-family: sans-serif;">
            Dados do Usuário
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>ID:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>Nome:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>E-mail:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>Telefone:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${phone}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>Data de Cadastro:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${date}</td>
        </tr>
      </table>
    `;

    const html = getEmailWrapper(title, contentHtml);
    return this.sendEmail(this.adminEmail, title, html);
  }

  async notifyServicePurchase(
    input: NotifyServicePurchaseInput,
  ): Promise<boolean> {
    const recipientEmail =
      input.recipientEmail ??
      (input.recipientRole === "customer" ? input.customerEmail : this.adminEmail);

    if (!recipientEmail) {
      console.warn("[EmailService] No recipient email specified for service purchase notification.");
      return false;
    }

    const title = input.recipientRole === "customer" ? "Confirmação de Compra" : "Nova Compra Realizada";
    const customerName = getOptionalText(input.customerName);
    const customerEmail = getOptionalText(input.customerEmail);
    const customerPhone = getOptionalText(input.customerPhone);
    const whatsappLink = getWhatsappLink(input.customerPhone);
    const serviceName = input.serviceName;
    const servicePrice = input.servicePrice;
    const paymentStatus = input.paymentStatus;
    const orderNsu = getOptionalText(input.orderNsu);
    const transactionNsu = getOptionalText(input.transactionNsu);
    
    let welcomeMessage = "";
    if (input.recipientRole === "customer") {
      welcomeMessage = `
        <p style="font-family: sans-serif; font-size: 16px; color: #f5f5f5; margin-bottom: 12px;">Olá, <strong>${customerName}</strong>,</p>
        <p style="font-family: sans-serif; font-size: 16px; color: #9ca3af; margin-bottom: 24px;">Parabéns! Sua compra foi processada com sucesso. Agradecemos a confiança em nossos serviços.</p>
        <p style="font-family: sans-serif; font-size: 16px; color: #f5f5f5;">Abaixo estão os detalhes da sua transação:</p>
      `;
    } else {
      welcomeMessage = `
        <p style="font-family: sans-serif; font-size: 16px; color: #f5f5f5; margin-bottom: 12px;">Olá, Administrador,</p>
        <p style="font-family: sans-serif; font-size: 16px; color: #9ca3af; margin-bottom: 24px;">Uma nova compra foi registrada no sistema. Veja os detalhes abaixo:</p>
      `;
    }

    let receiptButton = "";
    if (input.receiptUrl && input.receiptUrl !== "Nao informado") {
      receiptButton = `
        <div style="text-align: center; margin-top: 24px;">
          <a href="${input.receiptUrl}" target="_blank" style="display: inline-block; background-color: #4CAF50; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; font-family: sans-serif;">
            Visualizar Comprovante
          </a>
        </div>
      `;
    }

    let whatsappButton = "";
    if (input.recipientRole === "admin" && whatsappLink) {
      whatsappButton = `
        <div style="text-align: center; margin-top: 24px;">
          <a href="${whatsappLink}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; font-family: sans-serif;">
            Conversar no WhatsApp
          </a>
        </div>
      `;
    }

    const contentHtml = `
      ${welcomeMessage}
      
      <table cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 20px; margin: 20px 0; border-collapse: separate;">
        <tr>
          <td colspan="2" style="font-size: 16px; font-weight: 600; padding-bottom: 12px; color: #ffffff; font-family: sans-serif;">
            Detalhes do Pedido
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>Cliente:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>E-mail:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${customerEmail}</td>
        </tr>
        ${input.recipientRole === "admin" ? `
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>Telefone:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${customerPhone}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>Serviço:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${serviceName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>Valor:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${servicePrice}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>Status do Pagamento:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${paymentStatus}</td>
        </tr>
        ${orderNsu !== "Nao informado" ? `
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>NSU do Pedido:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${orderNsu}</td>
        </tr>` : ''}
        ${transactionNsu !== "Nao informado" ? `
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 14px; font-family: sans-serif;"><strong>NSU da Transação:</strong></td>
          <td style="padding: 6px 0; color: #f5f5f5; font-size: 14px; font-family: sans-serif; text-align: right;">${transactionNsu}</td>
        </tr>` : ''}
      </table>
      ${receiptButton}
      ${whatsappButton}
    `;

    const html = getEmailWrapper(title, contentHtml);
    return this.sendEmail(recipientEmail, title, html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.apiKey) {
      console.warn("[EmailService] RESEND_API_KEY is not configured. Email not sent.");
      return false;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[EmailService] Failed to send email via Resend: ${response.status} - ${errorText}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error("[EmailService] Error sending email via Resend:", err);
      return false;
    }
  }
}
