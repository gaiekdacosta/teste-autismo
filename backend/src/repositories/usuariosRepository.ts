import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "../lib/supabase";
import type { TesteCompleto } from "../types/testes";
import type { UsuarioAvaliado } from "../types/usuarios";

const TESTE_USUARIO_SELECT = `
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

export class UsuariosRepository {
  async findAuthUsers(): Promise<User[]> {
    const users: User[] = [];
    const perPage = 1000;
    let page = 1;

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        throwSupabaseError("buscar usuários do Auth", error);
      }

      users.push(...data.users);

      if (data.users.length < perPage) {
        break;
      }

      page += 1;
    }

    return users;
  }

  async findAvaliadosByUserIds(userIds: string[]): Promise<UsuarioAvaliado[]> {
    if (userIds.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from("avaliados")
      .select("id, id_user, nome, created_at, updated_at")
      .in("id_user", userIds)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError("buscar avaliados dos usuários", error);
    }

    return (data ?? []) as UsuarioAvaliado[];
  }

  async findTestesByUserIds(userIds: string[]): Promise<TesteCompleto[]> {
    if (userIds.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from("testes")
      .select(TESTE_USUARIO_SELECT)
      .in("id_user", userIds)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError("buscar testes dos usuários", error);
    }

    return (data ?? []).map(mapTesteCompleto);
  }
}
