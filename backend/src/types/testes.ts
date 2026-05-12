export const TESTE_STATUS = {
  emAndamento: "em_andamento",
  concluido: "concluido",
} as const;

export type TesteStatus = (typeof TESTE_STATUS)[keyof typeof TESTE_STATUS];

export type Teste = {
  id: string;
  id_user: string;
  id_avaliado: string | null;
  id_questionario: string;
  status: TesteStatus;
  pontuacao_total: number;
  classificacao: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TesteCompleto = Teste & {
  questionario: {
    id: string;
    titulo: string;
    descricao: string | null;
    versao: number;
  } | null;
  avaliado: {
    id: string;
    nome: string;
  } | null;
  respostas: RespostaCompleta[];
};

export type CreateTesteInput = {
  id_questionario: string;
  id_avaliado?: string;
};

export type RespostaInput = {
  id_questao: string;
  id_alternativa: string;
};

export type CompleteTesteInput = {
  id_questionario: string;
  id_avaliado?: string;
  respostas: RespostaInput[];
};

export type UpdateTesteInput = Partial<{
  status: TesteStatus;
  pontuacao_total: number;
  classificacao: string;
  started_at: string;
  finished_at: string;
}>;

export type Avaliado = {
  id: string;
  id_user: string;
  nome: string;
  created_at: string;
  updated_at: string;
};

export type CreateAvaliadoInput = {
  nome: string;
  data_nascimento?: string;
  genero?: string;
};

export type UpdateAvaliadoInput = Partial<{
  nome: string;
  data_nascimento: string;
  genero: string;
}>;

export type Contato = {
  id: string;
  whatsapp: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type CreateContatoInput = {
  whatsapp: string;
  email: string;
};

export type UpdateContatoInput = Partial<{
  whatsapp: string;
  email: string;
}>;

export type TesteInsertRow = Omit<Teste, "id" | "created_at" | "updated_at"> & {
  id: string;
};

export type AvaliadoInsertRow = Omit<Avaliado, "id" | "created_at" | "updated_at"> & {
  id: string;
};

export type ContatoInsertRow = Omit<Contato, "id" | "created_at" | "updated_at"> & {
  id: string;
};

export type Resposta = {
  id: string;
  id_teste: string;
  id_questao: string;
  id_alternativa: string;
  valor: number;
  created_at: string;
};

export type RespostaInsertRow = Omit<Resposta, "id" | "created_at"> & {
  id: string;
};

export type RespostaCompleta = Resposta & {
  questao: {
    id: string;
    posicao: number;
    pergunta: string;
  } | null;
  alternativa: {
    id: string;
    posicao: number;
    texto: string;
    valor: number;
  } | null;
};

export type QuestionarioParaTeste = {
  id: string;
  questoes: Array<{
    id: string;
    alternativas: Array<{
      id: string;
      valor: number;
    }>;
  }>;
};
