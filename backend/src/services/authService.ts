import type { Session, User } from "@supabase/supabase-js";
import { badRequest } from "../errors/AppError";
import { supabaseAnon } from "../lib/supabase";

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
};

export type RegisterCredentials = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginResponse = {
  tokens?: AuthTokens;
  user?: AuthUser;
};

function mapAuthError(message: string): string {
  const errors: Record<string, string> = {
    "invalid login credentials": "E-mail ou senha inválidos.",
    "email not confirmed": "Confirme seu e-mail antes de entrar.",
    "phone not confirmed": "Confirme seu telefone antes de continuar.",
    "user already registered": "Este e-mail já está cadastrado.",
    "a user with this phone number has already been registered":
      "Este telefone já está cadastrado.",
    "password should be at least 6 characters":
      "A senha deve ter pelo menos 6 caracteres.",
    "signup is disabled": "Cadastro desativado no momento.",
    "email rate limit exceeded": "Muitas tentativas. Tente novamente mais tarde.",
    "phone rate limit exceeded":
      "Muitas tentativas com este telefone. Tente novamente mais tarde.",
  };

  const normalizedMessage = message.trim().toLowerCase();
  return errors[normalizedMessage] || "Erro de autenticação.";
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
  async registerWithPassword(input: RegisterCredentials): Promise<LoginResponse> {
    const { data, error } = await supabaseAnon.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
          phone: input.phone,
        },
      },
    });

    if (error) {
      throw badRequest(mapAuthError(error.message));
    }

    return mapSession(data.session);
  }
}
