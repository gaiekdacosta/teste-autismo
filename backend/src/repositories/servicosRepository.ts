import { supabaseAdmin } from "../lib/supabase";
import type {
  ServicePackageRow,
  ServicePurchase,
  ServicePurchaseInsertRow,
  ServicePurchaseUpdateRow,
  UpdateServiceInput,
} from "../types/servicos";

function throwSupabaseError(action: string, error: { message: string }): never {
  throw new Error(`Erro ao ${action}: ${error.message}`);
}

// Colunas do pacote. As extras (concede_*, destacar_whatsapp) sao opcionais:
// enquanto a migracao que as cria nao for aplicada, caimos automaticamente no
// conjunto basico para nao quebrar a listagem — o backend deploya em qualquer
// ordem em relacao ao banco.
const PACKAGE_BASE_COLUMNS = "service_id, pacote, descricao, valor, posicao, ativo";
const PACKAGE_COLUMNS = `${PACKAGE_BASE_COLUMNS}, concede_testes, concede_consulta, destacar_whatsapp`;

function isMissingColumnError(error: { message?: string; code?: string }): boolean {
  // Postgres 42703 = undefined_column (colunas extras ainda nao migradas).
  return (
    error.code === "42703" ||
    /concede_testes|concede_consulta|destacar_whatsapp/.test(error.message ?? "")
  );
}

export class ServicosRepository {
  async listServicePackages(): Promise<ServicePackageRow[]> {
    const { data, error } = await supabaseAdmin
      .from("servicos_pacotes")
      .select(PACKAGE_COLUMNS)
      .order("posicao", { ascending: true });

    if (error && isMissingColumnError(error)) {
      const fallback = await supabaseAdmin
        .from("servicos_pacotes")
        .select(PACKAGE_BASE_COLUMNS)
        .order("posicao", { ascending: true });

      if (fallback.error) {
        throwSupabaseError("listar pacotes de servico", fallback.error);
      }

      return (fallback.data ?? []) as ServicePackageRow[];
    }

    if (error) {
      throwSupabaseError("listar pacotes de servico", error);
    }

    return (data ?? []) as ServicePackageRow[];
  }

  async updateServicePackage(
    serviceId: string,
    input: UpdateServiceInput,
  ): Promise<ServicePackageRow | null> {
    // Campos base (sempre existem na tabela).
    const baseUpdate: Record<string, string | number | boolean> = {};

    if (input.name !== undefined) {
      baseUpdate.pacote = input.name;
    }

    if (input.description !== undefined) {
      baseUpdate.descricao = input.description;
    }

    if (input.priceInCents !== undefined) {
      baseUpdate.valor = input.priceInCents / 100;
    }

    if (input.active !== undefined) {
      baseUpdate.ativo = input.active;
    }

    // Campos extras (colunas concede_* e destacar_whatsapp, criadas por migração).
    const extraUpdate: Record<string, boolean> = {};

    if (input.grantsTestAccess !== undefined) {
      extraUpdate.concede_testes = input.grantsTestAccess;
    }

    if (input.grantsConsultationAccess !== undefined) {
      extraUpdate.concede_consulta = input.grantsConsultationAccess;
    }

    if (input.highlightWhatsapp !== undefined) {
      extraUpdate.destacar_whatsapp = input.highlightWhatsapp;
    }

    const updateData = { ...baseUpdate, ...extraUpdate };

    const { data, error } = await supabaseAdmin
      .from("servicos_pacotes")
      .update(updateData)
      .eq("service_id", serviceId)
      .select(PACKAGE_COLUMNS)
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      // Colunas extras ainda nao migradas: salva apenas os campos base para nao
      // bloquear a edicao. As flags extras so persistem apos a migração.
      if (Object.keys(baseUpdate).length === 0) {
        const current = await supabaseAdmin
          .from("servicos_pacotes")
          .select(PACKAGE_BASE_COLUMNS)
          .eq("service_id", serviceId)
          .maybeSingle();

        if (current.error) {
          throwSupabaseError("atualizar pacote de servico", current.error);
        }

        return current.data as ServicePackageRow | null;
      }

      const fallback = await supabaseAdmin
        .from("servicos_pacotes")
        .update(baseUpdate)
        .eq("service_id", serviceId)
        .select(PACKAGE_BASE_COLUMNS)
        .maybeSingle();

      if (fallback.error) {
        throwSupabaseError("atualizar pacote de servico", fallback.error);
      }

      return fallback.data as ServicePackageRow | null;
    }

    if (error) {
      throwSupabaseError("atualizar pacote de servico", error);
    }

    return data as ServicePackageRow | null;
  }

  async listPurchasesByUserId(userId: string): Promise<ServicePurchase[]> {
    const { data, error } = await supabaseAdmin
      .from("compras_servicos")
      .select("*")
      .eq("id_user", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError("listar compras de servico", error);
    }

    return data as ServicePurchase[];
  }

  async createPurchase(input: ServicePurchaseInsertRow): Promise<ServicePurchase> {
    const { data, error } = await supabaseAdmin
      .from("compras_servicos")
      .insert(input)
      .select("*")
      .single();

    if (error) {
      throwSupabaseError("criar compra de servico", error);
    }

    return data as ServicePurchase;
  }

  async findPurchaseById(id: string): Promise<ServicePurchase | null> {
    const { data, error } = await supabaseAdmin
      .from("compras_servicos")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throwSupabaseError("buscar compra de servico", error);
    }

    return data as ServicePurchase | null;
  }

  async findPurchaseByOrderNsu(orderNsu: string): Promise<ServicePurchase | null> {
    const { data, error } = await supabaseAdmin
      .from("compras_servicos")
      .select("*")
      .eq("order_nsu", orderNsu)
      .maybeSingle();

    if (error) {
      throwSupabaseError("buscar compra de servico", error);
    }

    return data as ServicePurchase | null;
  }

  async updatePurchase(
    id: string,
    input: ServicePurchaseUpdateRow,
  ): Promise<ServicePurchase> {
    const { data, error } = await supabaseAdmin
      .from("compras_servicos")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throwSupabaseError("atualizar compra de servico", error);
    }

    return data as ServicePurchase;
  }

  async deleteAllPurchases(): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from("compras_servicos")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select("id");

    if (error) {
      throwSupabaseError("apagar compras de servico", error);
    }

    return data?.length ?? 0;
  }
}
