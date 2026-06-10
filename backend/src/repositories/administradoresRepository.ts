import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "../lib/supabase";
import type {
  Administrador,
  CreateAdministradorInput,
  NivelAdministrador,
  UpdateAdministradorInput,
} from "../types/administradores";

type CreateAdministradorRecord = CreateAdministradorInput & {
  id_user: string;
  nivel: NivelAdministrador;
};

type UpdateAdministradorRecord = UpdateAdministradorInput & {
  id_user?: string;
  nivel?: NivelAdministrador;
};

function throwSupabaseError(action: string, error: { message: string }): never {
  throw new Error(`Erro ao ${action}: ${error.message}`);
}

export class AdministradoresRepository {
  async findAll(): Promise<Administrador[]> {
    const { data, error } = await supabaseAdmin
      .from("administradores")
      .select("id, id_user, email, ativo, nivel, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError("buscar administradores", error);
    }

    return (data ?? []) as Administrador[];
  }

  async findActiveEmails(): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from("administradores")
      .select("email")
      .eq("ativo", true);

    if (error) {
      throwSupabaseError("buscar emails dos administradores", error);
    }

    return (data ?? [])
      .map((administrador) => administrador.email)
      .filter((email): email is string => Boolean(email));
  }

  async findActiveByUserId(userId: string): Promise<Administrador | null> {
    const { data, error } = await supabaseAdmin
      .from("administradores")
      .select("id, id_user, email, ativo, nivel, created_at, updated_at")
      .eq("id_user", userId)
      .eq("ativo", true)
      .maybeSingle();

    if (error) {
      throwSupabaseError("buscar administrador ativo", error);
    }

    return data as Administrador | null;
  }

  async findAuthUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const perPage = 1000;
    let page = 1;

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        throwSupabaseError("buscar usuário do Auth", error);
      }

      const user = data.users.find(
        (authUser) => authUser.email?.toLowerCase() === normalizedEmail,
      );

      if (user) return user;

      if (data.users.length < perPage) return null;

      page += 1;
    }
  }

  async findAuthUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error) {
      throwSupabaseError("buscar usuário do Auth por id", error);
    }

    return data.user ?? null;
  }

  async create(input: CreateAdministradorRecord): Promise<Administrador> {
    const { data, error } = await supabaseAdmin
      .from("administradores")
      .insert(input)
      .select("id, id_user, email, ativo, nivel, created_at, updated_at")
      .single();

    if (error) {
      throwSupabaseError("criar administrador", error);
    }

    return data as Administrador;
  }

  async update(id: string, input: UpdateAdministradorRecord): Promise<Administrador | null> {
    const { data, error } = await supabaseAdmin
      .from("administradores")
      .update(input)
      .eq("id", id)
      .select("id, id_user, email, ativo, nivel, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throwSupabaseError("atualizar administrador", error);
    }

    return data as Administrador | null;
  }

  async delete(id: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from("administradores")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      throwSupabaseError("remover administrador", error);
    }

    return Boolean(data);
  }
}
