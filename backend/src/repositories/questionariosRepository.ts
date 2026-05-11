import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../lib/supabase";
import type {
  AlternativaInsertRow,
  CreateQuestionarioInput,
  QuestionarioCompleteRow,
  QuestionarioCompleto,
  QuestionarioInsertRow,
  QuestionarioResumo,
  QuestaoInsertRow,
  QuestaoInput,
  UpdateQuestionarioInput,
} from "../types/questionarios";

const QUESTIONARIO_COMPLETO_SELECT = `
  id,
  titulo,
  descricao,
  versao,
  ativo,
  questoes (
    id,
    posicao,
    pergunta,
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

function sortByPosition<T extends { posicao: number }>(items: T[]): T[] {
  return [...items].sort((first, second) => first.posicao - second.posicao);
}

function mapQuestionario(row: QuestionarioCompleteRow): QuestionarioCompleto {
  const questoes = (row.questoes ?? []).map((questao) => ({
    id: questao.id,
    posicao: questao.posicao,
    pergunta: questao.pergunta,
    alternativas: sortByPosition(questao.alternativas ?? []),
  }));

  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    versao: row.versao,
    ativo: row.ativo,
    questoes: sortByPosition(questoes),
  };
}

function buildQuestionarioRow(
  input: CreateQuestionarioInput,
): QuestionarioInsertRow {
  return {
    id: randomUUID(),
    titulo: input.titulo.trim(),
    descricao: input.descricao.trim(),
    versao: input.versao,
    ativo: input.ativo ?? false,
  };
}

function buildQuestaoRows(
  questionarioId: string,
  questoes: QuestaoInput[],
): QuestaoInsertRow[] {
  return questoes.map((questao) => ({
    id: randomUUID(),
    id_questionario: questionarioId,
    posicao: questao.posicao,
    pergunta: questao.pergunta.trim(),
  }));
}

function buildAlternativaRows(
  questoes: QuestaoInput[],
  questaoRows: QuestaoInsertRow[],
): AlternativaInsertRow[] {
  return questoes.flatMap((questao, questaoIndex) =>
    questao.alternativas.map((alternativa) => ({
      id: randomUUID(),
      id_questao: questaoRows[questaoIndex].id,
      posicao: alternativa.posicao,
      texto: alternativa.texto.trim(),
      valor: alternativa.valor,
    })),
  );
}

export class QuestionariosRepository {
  async findAllBasic(): Promise<QuestionarioResumo[]> {
    const { data, error } = await supabaseAdmin
      .from("questionario")
      .select("id, titulo, descricao, versao, ativo")
      .order("versao", { ascending: false });

    if (error) {
      throwSupabaseError("listar questionarios", error);
    }

    return (data ?? []) as QuestionarioResumo[];
  }

  async findActiveComplete(): Promise<QuestionarioCompleto | null> {
    const { data, error } = await supabaseAdmin
      .from("questionario")
      .select(QUESTIONARIO_COMPLETO_SELECT)
      .eq("ativo", true)
      .order("posicao", { referencedTable: "questoes", ascending: true })
      .order("posicao", {
        referencedTable: "questoes.alternativas",
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throwSupabaseError("buscar questionario ativo", error);
    }

    return data ? mapQuestionario(data as QuestionarioCompleteRow) : null;
  }

  async findCompleteById(id: string): Promise<QuestionarioCompleto | null> {
    const { data, error } = await supabaseAdmin
      .from("questionario")
      .select(QUESTIONARIO_COMPLETO_SELECT)
      .eq("id", id)
      .order("posicao", { referencedTable: "questoes", ascending: true })
      .order("posicao", {
        referencedTable: "questoes.alternativas",
        ascending: true,
      })
      .maybeSingle();

    if (error) {
      throwSupabaseError("buscar questionario", error);
    }

    return data ? mapQuestionario(data as QuestionarioCompleteRow) : null;
  }

  async create(input: CreateQuestionarioInput): Promise<string> {
    const questionario = buildQuestionarioRow(input);
    const questoes = buildQuestaoRows(questionario.id, input.questoes);
    const alternativas = buildAlternativaRows(input.questoes, questoes);

    const { error: questionarioError } = await supabaseAdmin
      .from("questionario")
      .insert(questionario);

    if (questionarioError) {
      throwSupabaseError("criar questionario", questionarioError);
    }

    try {
      await this.insertQuestoes(questoes);
      await this.insertAlternativas(alternativas);
      return questionario.id;
    } catch (error) {
      await this.deleteById(questionario.id);
      throw error;
    }
  }

  async updateScalars(
    id: string,
    input: UpdateQuestionarioInput,
  ): Promise<void> {
    const updateData: Partial<Omit<QuestionarioResumo, "id">> = {};

    if (input.titulo !== undefined) {
      updateData.titulo = input.titulo.trim();
    }

    if (input.descricao !== undefined) {
      updateData.descricao = input.descricao.trim();
    }

    if (input.versao !== undefined) {
      updateData.versao = input.versao;
    }

    if (input.ativo !== undefined) {
      updateData.ativo = input.ativo;
    }

    if (Object.keys(updateData).length === 0) {
      return;
    }

    const { error } = await supabaseAdmin
      .from("questionario")
      .update(updateData)
      .eq("id", id);

    if (error) {
      throwSupabaseError("atualizar questionario", error);
    }
  }

  async replaceQuestoes(
    questionarioId: string,
    questoesInput: QuestaoInput[],
  ): Promise<void> {
    await this.deleteQuestoesByQuestionarioId(questionarioId);

    const questoes = buildQuestaoRows(questionarioId, questoesInput);
    const alternativas = buildAlternativaRows(questoesInput, questoes);

    await this.insertQuestoes(questoes);
    await this.insertAlternativas(alternativas);
  }

  async setActive(id: string, ativo: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from("questionario")
      .update({ ativo })
      .eq("id", id);

    if (error) {
      throwSupabaseError("alterar status do questionario", error);
    }
  }

  async deactivateOthers(activeQuestionarioId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from("questionario")
      .update({ ativo: false })
      .neq("id", activeQuestionarioId)
      .eq("ativo", true);

    if (error) {
      throwSupabaseError("desativar outros questionarios", error);
    }
  }

  async hasLinkedTests(questionarioId: string): Promise<boolean> {
    const { count, error } = await supabaseAdmin
      .from("testes")
      .select("id", { count: "exact", head: true })
      .eq("id_questionario", questionarioId);

    if (error) {
      throwSupabaseError("verificar testes vinculados", error);
    }

    return (count ?? 0) > 0;
  }

  async deleteById(id: string): Promise<void> {
    await this.deleteQuestoesByQuestionarioId(id);

    const { error } = await supabaseAdmin.from("questionario").delete().eq("id", id);

    if (error) {
      throwSupabaseError("excluir questionario", error);
    }
  }

  private async insertQuestoes(questoes: QuestaoInsertRow[]): Promise<void> {
    if (questoes.length === 0) {
      return;
    }

    const { error } = await supabaseAdmin.from("questoes").insert(questoes);

    if (error) {
      throwSupabaseError("criar questoes", error);
    }
  }

  private async insertAlternativas(
    alternativas: AlternativaInsertRow[],
  ): Promise<void> {
    if (alternativas.length === 0) {
      return;
    }

    const { error } = await supabaseAdmin
      .from("alternativas")
      .insert(alternativas);

    if (error) {
      throwSupabaseError("criar alternativas", error);
    }
  }

  private async deleteQuestoesByQuestionarioId(
    questionarioId: string,
  ): Promise<void> {
    const { data: questoes, error: questoesError } = await supabaseAdmin
      .from("questoes")
      .select("id")
      .eq("id_questionario", questionarioId);

    if (questoesError) {
      throwSupabaseError("buscar questoes", questoesError);
    }

    const questaoIds = ((questoes ?? []) as Array<{ id: string }>).map(
      (questao) => questao.id,
    );

    if (questaoIds.length > 0) {
      const { error: alternativasError } = await supabaseAdmin
        .from("alternativas")
        .delete()
        .in("id_questao", questaoIds);

      if (alternativasError) {
        throwSupabaseError("excluir alternativas", alternativasError);
      }
    }

    const { error } = await supabaseAdmin
      .from("questoes")
      .delete()
      .eq("id_questionario", questionarioId);

    if (error) {
      throwSupabaseError("excluir questoes", error);
    }
  }
}
