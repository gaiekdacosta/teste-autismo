import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../lib/supabase";
import { TESTE_STATUS } from "../types/testes";
import type {
  Avaliado,
  AvaliadoInsertRow,
  CompleteTesteInput,
  Contato,
  ContatoInsertRow,
  CreateAvaliadoInput,
  CreateContatoInput,
  CreateTesteInput,
  QuestionarioParaTeste,
  RespostaInput,
  RespostaInsertRow,
  Teste,
  TesteCompleto,
  TesteInsertRow,
  UpdateAvaliadoInput,
  UpdateContatoInput,
  UpdateTesteInput,
} from "../types/testes";

const TESTE_COMPLETO_SELECT = `
  id,
  id_user,
  id_avaliado,
  id_questionario,
  status,
  pontuacao_total,
  classificacao,
  started_at,
  finished_at,
  created_at,
  updated_at,
  questionario (
    id,
    titulo,
    descricao,
    versao
  ),
  avaliados (
    id,
    nome
  ),
  respostas (
    id,
    id_teste,
    id_questao,
    id_alternativa,
    valor,
    created_at,
    questoes (
      id,
      posicao,
      pergunta
    ),
    alternativas (
      id,
      posicao,
      texto,
      valor
    )
  )
`;

function throwSupabaseError(action: string, error: { message: string }): never {
  throw new Error(`Erro ao ${action}: ${error.message}`);
}

function mapTesteCompleto(row: any): TesteCompleto {
  return {
    ...row,
    questionario: Array.isArray(row.questionario)
      ? row.questionario[0]
      : row.questionario,
    avaliado: Array.isArray(row.avaliados) ? row.avaliados[0] : row.avaliados,
    respostas: (row.respostas ?? []).map((resposta: any) => ({
      id: resposta.id,
      id_teste: resposta.id_teste,
      id_questao: resposta.id_questao,
      id_alternativa: resposta.id_alternativa,
      valor: resposta.valor,
      created_at: resposta.created_at,
      questao: Array.isArray(resposta.questoes)
        ? resposta.questoes[0]
        : resposta.questoes,
      alternativa: Array.isArray(resposta.alternativas)
        ? resposta.alternativas[0]
        : resposta.alternativas,
    })),
  } as TesteCompleto;
}

function mapTesteSimplificado(row: any): TesteCompleto {
  const { avaliados, ...rest } = row;
  return {
    ...rest,
    questionario: Array.isArray(row.questionario)
      ? row.questionario[0]
      : row.questionario,
    avaliado: row.id_avaliado ? { id: row.id_avaliado } : null,
    respostas: [],
  } as TesteCompleto;
}

function buildRespostaRows(
  testeId: string,
  respostas: Array<RespostaInput & { valor: number }>,
): RespostaInsertRow[] {
  return respostas.map((resposta) => ({
    id: randomUUID(),
    id_teste: testeId,
    id_questao: resposta.id_questao,
    id_alternativa: resposta.id_alternativa,
    valor: resposta.valor,
  }));
}

export class TestesRepository {
  async findByUserId(userId: string): Promise<TesteCompleto[]> {
    const SELECT_SIMPLES = `
      id,
      id_user,
      id_avaliado,
      id_questionario,
      status,
      pontuacao_total,
      classificacao,
      started_at,
      finished_at,
      created_at,
      updated_at,
      questionario (
        id,
        titulo,
        descricao,
        versao
      )
    `;

    const { data, error } = await supabaseAdmin
      .from("testes")
      .select(SELECT_SIMPLES)
      .eq("id_user", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError("buscar testes do usuário", error);
    }

    return (data ?? []).map(mapTesteSimplificado);
  }

  async findRespostasByTesteId(testeId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from("respostas")
      .select(`
        id,
        id_teste,
        id_questao,
        id_alternativa,
        valor,
        created_at,
        questoes (
          id,
          posicao,
          pergunta
        ),
        alternativas (
          id,
          posicao,
          texto,
          valor
        )
      `)
      .eq("id_teste", testeId)
      .order("created_at", { ascending: true });

    if (error) {
      throwSupabaseError("buscar respostas do teste", error);
    }

    return (data ?? []).map((resposta: any) => ({
      id: resposta.id,
      id_teste: resposta.id_teste,
      id_questao: resposta.id_questao,
      id_alternativa: resposta.id_alternativa,
      valor: resposta.valor,
      created_at: resposta.created_at,
      questao: Array.isArray(resposta.questoes)
        ? resposta.questoes[0]
        : resposta.questoes,
      alternativa: Array.isArray(resposta.alternativas)
        ? resposta.alternativas[0]
        : resposta.alternativas,
    }));
  }

  async findCompleteById(id: string): Promise<TesteCompleto | null> {
    const { data, error } = await supabaseAdmin
      .from("testes")
      .select(TESTE_COMPLETO_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throwSupabaseError("buscar teste", error);
    }

    if (!data) {
      return null;
    }

    const teste = mapTesteCompleto(data);

    if (!teste.respostas || teste.respostas.length === 0) {
      teste.respostas = await this.findRespostasByTesteId(teste.id);
    }

    await this.ensureRelatedData(teste); // 🔧 garante dados completos

    return teste;
  }

  async findQuestionarioParaTeste(
    id: string,
  ): Promise<QuestionarioParaTeste | null> {
    const { data, error } = await supabaseAdmin
      .from("questionario")
      .select(
        `
          id,
          questoes (
            id,
            alternativas (
              id,
              valor
            )
          )
        `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throwSupabaseError("buscar questionario para teste", error);
    }

    return data as QuestionarioParaTeste | null;
  }

  async create(input: CreateTesteInput, userId: string): Promise<string> {
    const teste: TesteInsertRow = {
      id: randomUUID(),
      id_user: userId,
      id_avaliado: input.id_avaliado ?? null,
      id_questionario: input.id_questionario,
      status: TESTE_STATUS.emAndamento,
      pontuacao_total: 0,
      classificacao: null,
      started_at: new Date().toISOString(),
      finished_at: null,
    };

    const { error } = await supabaseAdmin.from("testes").insert(teste);

    if (error) {
      throwSupabaseError("criar teste", error);
    }

    return teste.id;
  }

  async createCompleted(
    input: CompleteTesteInput,
    userId: string,
    result: {
      pontuacao_total: number;
      classificacao: string;
      respostas: Array<RespostaInput & { valor: number }>;
    },
  ): Promise<string> {
    const now = new Date().toISOString();
    const teste: TesteInsertRow = {
      id: randomUUID(),
      id_user: userId,
      id_avaliado: input.id_avaliado ?? null,
      id_questionario: input.id_questionario,
      status: TESTE_STATUS.concluido,
      pontuacao_total: result.pontuacao_total,
      classificacao: result.classificacao,
      started_at: now,
      finished_at: now,
    };

    const { error: testeError } = await supabaseAdmin
      .from("testes")
      .insert(teste);

    if (testeError) {
      throwSupabaseError("criar teste concluido", testeError);
    }

    try {
      await this.insertRespostas(buildRespostaRows(teste.id, result.respostas));
      return teste.id;
    } catch (error) {
      await this.deleteById(teste.id);
      throw error;
    }
  }

  async update(id: string, input: UpdateTesteInput): Promise<void> {
    const updateData: Partial<Omit<Teste, "id" | "id_user" | "id_avaliado" | "id_questionario" | "created_at">> = {};

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.pontuacao_total !== undefined) {
      updateData.pontuacao_total = input.pontuacao_total;
    }

    if (input.classificacao !== undefined) {
      updateData.classificacao = input.classificacao;
    }

    if (input.started_at !== undefined) {
      updateData.started_at = input.started_at;
    }

    if (input.finished_at !== undefined) {
      updateData.finished_at = input.finished_at;
    }

    if (Object.keys(updateData).length === 0) {
      return;
    }

    const { error } = await supabaseAdmin
      .from("testes")
      .update(updateData)
      .eq("id", id);

    if (error) {
      throwSupabaseError("atualizar teste", error);
    }
  }

  async replaceRespostas(
    testeId: string,
    respostas: Array<RespostaInput & { valor: number }>,
  ): Promise<void> {
    if (respostas.length === 0) {
      return;
    }

    const questoesIds = respostas.map((resposta) => resposta.id_questao);

    const { error: deleteError } = await supabaseAdmin
      .from("respostas")
      .delete()
      .eq("id_teste", testeId)
      .in("id_questao", questoesIds);

    if (deleteError) {
      throwSupabaseError("remover respostas anteriores", deleteError);
    }

    await this.insertRespostas(buildRespostaRows(testeId, respostas));
  }

  async deleteById(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from("testes").delete().eq("id", id);

    if (error) {
      throwSupabaseError("excluir teste", error);
    }
  }

  private async insertRespostas(respostas: RespostaInsertRow[]): Promise<void> {
    if (respostas.length === 0) {
      return;
    }

    const { error } = await supabaseAdmin.from("respostas").insert(respostas);

    if (error) {
      throwSupabaseError("criar respostas", error);
    }
  }

  private async ensureRelatedData(test: any): Promise<void> {
    // Se questionario estiver nulo, busca diretamente
    if (!test.questionario || !test.questionario.id) {
      const { data: q } = await supabaseAdmin
        .from('questionario')
        .select('id, titulo, descricao, versao')
        .eq('id', test.id_questionario)
        .maybeSingle();
      if (q) test.questionario = q;
    }

    // Se avaliado estiver nulo, busca pelo id_avaliado
    if ((!test.avaliado || !test.avaliado.id) && test.id_avaliado) {
      const { data: a } = await supabaseAdmin
        .from('avaliados')
        .select('id, nome')
        .eq('id', test.id_avaliado)
        .maybeSingle();
      if (a) test.avaliado = a;
    }

    // Se pontuacao_total estiver nula, calcula a partir das respostas
    if ((test.pontuacao_total === null || test.pontuacao_total === undefined) && test.respostas?.length) {
      test.pontuacao_total = test.respostas.reduce(
        (sum: number, r: any) => sum + (Number(r.valor) || 0),
        0
      );
    }

    // Se finished_at estiver nulo, tenta inferir das respostas ou updated_at
    if (!test.finished_at && test.status === TESTE_STATUS.concluido) {
      if (test.respostas?.length) {
        const dates = test.respostas.map((r: any) => new Date(r.created_at).getTime());
        test.finished_at = new Date(Math.max(...dates)).toISOString();
      } else if (test.updated_at) {
        test.finished_at = test.updated_at;
      }
    }
  }

  async findAvaliadosByUserId(userId: string): Promise<Avaliado[]> {
    const { data, error } = await supabaseAdmin
      .from("avaliados")
      .select("*")
      .eq("id_user", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError("buscar avaliados", error);
    }

    return (data ?? []) as Avaliado[];
  }

  async findAvaliadoById(id: string): Promise<Avaliado | null> {
    const { data, error } = await supabaseAdmin
      .from("avaliados")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throwSupabaseError("buscar avaliado", error);
    }

    return data as Avaliado | null;
  }

  async createAvaliado(input: CreateAvaliadoInput, userId: string): Promise<string> {
    const avaliado: AvaliadoInsertRow = {
      id: randomUUID(),
      id_user: userId,
      nome: input.nome.trim(),
    };

    const { error } = await supabaseAdmin.from("avaliados").insert(avaliado);

    if (error) {
      throwSupabaseError("criar avaliado", error);
    }

    return avaliado.id;
  }

  async updateAvaliado(id: string, input: UpdateAvaliadoInput): Promise<void> {
    const updateData: Partial<Omit<Avaliado, "id" | "id_user" | "created_at">> = {};

    if (input.nome !== undefined) {
      updateData.nome = input.nome.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return;
    }

    const { error } = await supabaseAdmin
      .from("avaliados")
      .update(updateData)
      .eq("id", id);

    if (error) {
      throwSupabaseError("atualizar avaliado", error);
    }
  }

  async deleteAvaliadoById(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from("avaliados").delete().eq("id", id);

    if (error) {
      throwSupabaseError("excluir avaliado", error);
    }
  }

  async findContato(): Promise<Contato | null> {
    const { data, error } = await supabaseAdmin
      .from("contatos")
      .select("*")
      .maybeSingle();

    if (error) {
      throwSupabaseError("buscar contato", error);
    }

    return data as Contato | null;
  }

  async createContato(input: CreateContatoInput): Promise<string> {
    const contato: ContatoInsertRow = {
      id: randomUUID(),
      whatsapp: input.whatsapp.trim(),
      email: input.email.trim(),
    };

    const { error } = await supabaseAdmin.from("contatos").insert(contato);

    if (error) {
      throwSupabaseError("criar contato", error);
    }

    return contato.id;
  }

  async updateContato(input: UpdateContatoInput): Promise<void> {
    const updateData: Partial<Omit<Contato, "id" | "created_at">> = {};

    if (input.whatsapp !== undefined) {
      updateData.whatsapp = input.whatsapp.trim();
    }

    if (input.email !== undefined) {
      updateData.email = input.email.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return;
    }

    const { error } = await supabaseAdmin.from("contatos").update(updateData);

    if (error) {
      throwSupabaseError("atualizar contato", error);
    }
  }
}
