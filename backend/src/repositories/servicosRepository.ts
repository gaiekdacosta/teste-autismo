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

export class ServicosRepository {
  async listServicePackages(): Promise<ServicePackageRow[]> {
    const { data, error } = await supabaseAdmin
      .from("servicos_pacotes")
      .select("service_id, pacote, descricao, valor, posicao, ativo")
      .order("posicao", { ascending: true });

    if (error) {
      throwSupabaseError("listar pacotes de servico", error);
    }

    return (data ?? []) as ServicePackageRow[];
  }

  async updateServicePackage(
    serviceId: string,
    input: UpdateServiceInput,
  ): Promise<ServicePackageRow | null> {
    const updateData: Record<string, string | number | boolean> = {};

    if (input.name !== undefined) {
      updateData.pacote = input.name;
    }

    if (input.description !== undefined) {
      updateData.descricao = input.description;
    }

    if (input.priceInCents !== undefined) {
      updateData.valor = input.priceInCents / 100;
    }

    if (input.active !== undefined) {
      updateData.ativo = input.active;
    }

    const { data, error } = await supabaseAdmin
      .from("servicos_pacotes")
      .update(updateData)
      .eq("service_id", serviceId)
      .select("service_id, pacote, descricao, valor, posicao, ativo")
      .maybeSingle();

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
