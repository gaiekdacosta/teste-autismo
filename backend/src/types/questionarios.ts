export type Alternativa = {
  id: string;
  posicao: number;
  texto: string;
  valor: number;
};

export type Questao = {
  id: string;
  posicao: number;
  pergunta: string;
  alternativas: Alternativa[];
};

export type QuestionarioCompleto = {
  id: string;
  titulo: string;
  descricao: string;
  versao: number;
  ativo: boolean;
  questoes: Questao[];
};

export type QuestionarioResumo = Omit<QuestionarioCompleto, "questoes">;

export type AlternativaInput = {
  posicao: number;
  texto: string;
  valor: number;
};

export type QuestaoInput = {
  posicao: number;
  pergunta: string;
  alternativas: AlternativaInput[];
};

export type CreateQuestionarioInput = {
  titulo: string;
  descricao: string;
  versao: number;
  ativo?: boolean;
  questoes: QuestaoInput[];
};

export type UpdateQuestionarioInput = Partial<
  Omit<CreateQuestionarioInput, "questoes">
> & {
  questoes?: QuestaoInput[];
};

export type QuestionarioCompleteRow = QuestionarioResumo & {
  questoes: Array<
    Omit<Questao, "alternativas"> & {
      alternativas: Alternativa[] | null;
    }
  > | null;
};

export type QuestionarioInsertRow = QuestionarioResumo;

export type QuestaoInsertRow = Omit<Questao, "alternativas"> & {
  id_questionario: string;
};

export type AlternativaInsertRow = Alternativa & {
  id_questao: string;
};
