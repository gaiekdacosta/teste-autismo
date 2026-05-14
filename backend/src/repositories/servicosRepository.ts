import { supabaseAdmin } from "../lib/supabase";
import type {
  ServicePurchase,
  ServicePurchaseInsertRow,
  ServicePurchaseUpdateRow,
} from "../types/servicos";

function throwSupabaseError(action: string, error: { message: string }): never {
  throw new Error(`Erro ao ${action}: ${error.message}`);
}

export class ServicosRepository {
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
}
