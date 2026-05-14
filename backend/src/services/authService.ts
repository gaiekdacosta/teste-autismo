import type { Session, User } from "@supabase/supabase-js";
import { badRequest } from "../errors/AppError";
import { supabaseAdmin, supabaseAnon } from "../lib/supabase";
import { EmailService } from "./emailService";

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  gender?: string;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  password: string;
};

export type LoginResponse = {
  tokens?: AuthTokens;
  user?: AuthUser;
};

const USER_NOTIFICATION_METADATA_KEY = "admin_new_user_notified_at";

function mapAuthError(message: string): string {
  const errors: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha inválidos.",
    "Email not confirmed": "Confirme seu e-mail antes de entrar.",
    "Phone not confirmed": "Confirme seu telefone antes de continuar.",
    "User already registered": "Este e-mail já está cadastrado.",
    "A user with this phone number has already been registered":
      "Este telefone já está cadastrado.",
    "Password should be at least 6 characters":
      "A senha deve ter pelo menos 6 caracteres.",
    "Signup is disabled": "Cadastro desativado no momento.",
    "Email rate limit exceeded": "Muitas tentativas. Tente novamente mais tarde.",
    "Phone rate limit exceeded":
      "Muitas tentativas com este telefone. Tente novamente mais tarde.",
  };

  return errors[message] || "Erro de autenticação.";
}

function getMetadataValue(user: User, key: string): string | undefined {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function mapAuthUser(user?: User | null): AuthUser | undefined {
  if (!user) return undefined;

  return {
    id: user.id,
    email: user.email ?? getMetadataValue(user, "email"),
    name: getMetadataValue(user, "name") ?? getMetadataValue(user, "full_name"),
    phone: user.phone ?? getMetadataValue(user, "phone"),
    avatarUrl: getMetadataValue(user, "avatar_url"),
    birthDate: getMetadataValue(user, "birthDate"),
    gender: getMetadataValue(user, "gender"),
  };
}

function mapSession(session?: Session | null): LoginResponse {
  return {
    tokens: session?.access_token
      ? {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresIn: session.expires_in,
        }
      : undefined,
    user: mapAuthUser(session?.user),
  };
}

export class AuthService {
  constructor(private readonly emailService = new EmailService()) {}

  async registerWithPassword(input: RegisterCredentials): Promise<LoginResponse> {
    const { data, error } = await supabaseAnon.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
          phone: input.phone,
          birthDate: input.birthDate,
          gender: input.gender,
        },
      },
    });

    if (error) {
      throw badRequest(mapAuthError(error.message));
    }

    if (data.user) {
      await this.notifyNewUserIfNeeded(data.user);
    }

    return mapSession(data.session);
  }

  async notifyNewUserIfNeeded(user: User): Promise<{ notified: boolean }> {
    const alreadyNotified = user.app_metadata?.[USER_NOTIFICATION_METADATA_KEY];

    if (typeof alreadyNotified === "string" && alreadyNotified.length > 0) {
      return { notified: false };
    }

    const notified = await this.emailService.notifyNewUser({
      id: user.id,
      name: getMetadataValue(user, "name") ?? getMetadataValue(user, "full_name"),
      email: user.email ?? getMetadataValue(user, "email"),
      phone: user.phone ?? getMetadataValue(user, "phone"),
      createdAt: user.created_at,
    });

    if (notified) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...user.app_metadata,
          [USER_NOTIFICATION_METADATA_KEY]: new Date().toISOString(),
        },
      });
    }

    return { notified };
  }
}
