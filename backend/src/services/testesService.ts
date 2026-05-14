import { badRequest, notFound } from "../errors/AppError";
import { TestesRepository } from "../repositories/testesRepository";
import { TESTE_STATUS } from "../types/testes";
import type {
  Avaliado,
  CompleteTesteInput,
  Contato,
  CreateAvaliadoInput,
  CreateContatoInput,
  CreateTesteInput,
  QuestionarioParaTeste,
  RespostaInput,
  SaveTesteRespostasInput,
  TesteCompleto,
  UpdateAvaliadoInput,
  UpdateContatoInput,
  UpdateTesteInput,
} from "../types/testes";

export type TestesRepositoryContract = Pick<
  TestesRepository,
  | "findByUserId"
  | "findCompleteById"
  | "findQuestionarioParaTeste"
  | "create"
  | "createCompleted"
  | "replaceRespostas"
  | "update"
  | "deleteById"
  | "findAvaliadosByUserId"
  | "findAvaliadoById"
  | "createAvaliado"
  | "updateAvaliado"
  | "deleteAvaliadoById"
  | "findContato"
  | "createContato"
  | "updateContato"
>;

export class TestesService {
  constructor(
    private readonly testesRepository: TestesRepositoryContract =
      new TestesRepository(),
  ) {}

  async listByUser(userId: string): Promise<TesteCompleto[]> {
    return this.testesRepository.findByUserId(userId);
  }

  async getById(id: string, userId: string): Promise<TesteCompleto> {
    const teste = await this.testesRepository.findCompleteById(id);

    if (!teste) {
      throw notFound("Teste não encontrado.");
    }

    if (teste.id_user !== userId) {
      throw notFound("Teste não encontrado.");
    }

    return teste;
  }

  async create(input: CreateTesteInput, userId: string): Promise<TesteCompleto> {
    const testeId = await this.testesRepository.create(input, userId);
    return this.getById(testeId, userId);
  }

  async complete(
    input: CompleteTesteInput,
    userId: string,
  ): Promise<TesteCompleto> {
    if (input.id_avaliado) {
      await this.getAvaliado(input.id_avaliado, userId);
    }

    const questionario = await this.testesRepository.findQuestionarioParaTeste(
      input.id_questionario,
    );

    if (!questionario) {
      throw notFound("Questionario nao encontrado.");
    }

    const result = this.buildResult(questionario, input.respostas);
    const testeId = await this.testesRepository.createCompleted(
      input,
      userId,
      result,
    );

    return this.getById(testeId, userId);
  }

  async saveRespostas(
    id: string,
    input: SaveTesteRespostasInput,
    userId: string,
  ): Promise<TesteCompleto> {
    const teste = await this.getById(id, userId);

    if (teste.status !== TESTE_STATUS.emAndamento) {
      throw badRequest("Apenas testes em andamento podem receber respostas.");
    }

    const questionario = await this.testesRepository.findQuestionarioParaTeste(
      teste.id_questionario,
    );

    if (!questionario) {
      throw notFound("Questionario nao encontrado.");
    }

    const respostas = this.validateRespostas(questionario, input.respostas, false);
    await this.testesRepository.replaceRespostas(id, respostas);

    return this.getById(id, userId);
  }

  async completeExisting(id: string, userId: string): Promise<TesteCompleto> {
    const teste = await this.getById(id, userId);

    if (teste.status !== TESTE_STATUS.emAndamento) {
      throw badRequest("Apenas testes em andamento podem ser concluídos.");
    }

    const questionario = await this.testesRepository.findQuestionarioParaTeste(
      teste.id_questionario,
    );

    if (!questionario) {
      throw notFound("Questionario nao encontrado.");
    }

    const respostas = teste.respostas.map((resposta) => ({
      id_questao: resposta.id_questao,
      id_alternativa: resposta.id_alternativa,
    }));
    const result = this.buildResult(questionario, respostas);
    const now = new Date().toISOString();

    await this.testesRepository.update(id, {
      status: TESTE_STATUS.concluido,
      pontuacao_total: result.pontuacao_total,
      classificacao: result.classificacao,
      finished_at: now,
    });

    return this.getById(id, userId);
  }

  async update(
    id: string,
    input: UpdateTesteInput,
    userId: string,
  ): Promise<TesteCompleto> {
    await this.getById(id, userId);
    await this.testesRepository.update(id, input);
    return this.getById(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.getById(id, userId);
    await this.testesRepository.deleteById(id);
  }

  async listAvaliados(userId: string): Promise<Avaliado[]> {
    return this.testesRepository.findAvaliadosByUserId(userId);
  }

  async getAvaliado(id: string, userId: string): Promise<Avaliado> {
    const avaliado = await this.testesRepository.findAvaliadoById(id);

    if (!avaliado) {
      throw notFound("Avaliado não encontrado.");
    }

    if (avaliado.id_user !== userId) {
      throw notFound("Avaliado não encontrado.");
    }

    return avaliado;
  }

  async createAvaliado(
    input: CreateAvaliadoInput,
    userId: string,
  ): Promise<Avaliado> {
    const avaliadoId = await this.testesRepository.createAvaliado(input, userId);
    return this.getAvaliado(avaliadoId, userId);
  }

  async updateAvaliado(
    id: string,
    input: UpdateAvaliadoInput,
    userId: string,
  ): Promise<Avaliado> {
    await this.getAvaliado(id, userId);
    await this.testesRepository.updateAvaliado(id, input);
    return this.getAvaliado(id, userId);
  }

  async deleteAvaliado(id: string, userId: string): Promise<void> {
    await this.getAvaliado(id, userId);
    await this.testesRepository.deleteAvaliadoById(id);
  }

  async getContato(): Promise<Contato> {
    const contato = await this.testesRepository.findContato();

    if (!contato) {
      throw notFound("Contato não encontrado.");
    }

    return contato;
  }

  async createContato(input: CreateContatoInput): Promise<Contato> {
    const contatoId = await this.testesRepository.createContato(input);
    const contato = await this.testesRepository.findContato();
    return contato!;
  }

  async updateContato(input: UpdateContatoInput): Promise<Contato> {
    await this.testesRepository.updateContato(input);
    return this.getContato();
  }

  private buildResult(
    questionario: QuestionarioParaTeste,
    respostas: RespostaInput[],
  ): {
    pontuacao_total: number;
    classificacao: string;
    respostas: Array<RespostaInput & { valor: number }>;
  } {
    const respostasComValor = this.validateRespostas(questionario, respostas, true);
    const pontuacaoTotal = respostasComValor.reduce(
      (total, resposta) => total + resposta.valor,
      0,
    );
    const pontuacaoMaxima = questionario.questoes.reduce((total, questao) => {
      const valores = questao.alternativas.map(
        (alternativa) => alternativa.valor,
      );
      const maiorValor = valores.length > 0 ? Math.max(...valores) : 0;
      return total + maiorValor;
    }, 0);

    return {
      pontuacao_total: pontuacaoTotal,
      classificacao: this.classifyScore(pontuacaoTotal, pontuacaoMaxima),
      respostas: respostasComValor,
    };
  }

  private validateRespostas(
    questionario: QuestionarioParaTeste,
    respostas: RespostaInput[],
    requireAll: boolean,
  ): Array<RespostaInput & { valor: number }> {
    const respostaPorQuestao = new Map<string, RespostaInput>();
    const questoesIds = new Set(questionario.questoes.map((questao) => questao.id));

    for (const resposta of respostas) {
      if (respostaPorQuestao.has(resposta.id_questao)) {
        throw badRequest("Cada questao deve possuir apenas uma resposta.");
      }

      if (!questoesIds.has(resposta.id_questao)) {
        throw badRequest("Questao invalida para o questionario informado.");
      }

      respostaPorQuestao.set(resposta.id_questao, resposta);
    }

    if (requireAll && respostaPorQuestao.size !== questionario.questoes.length) {
      throw badRequest("Todas as questoes devem ser respondidas.");
    }

    return questionario.questoes.flatMap((questao) => {
      const resposta = respostaPorQuestao.get(questao.id);

      if (!resposta) {
        return [];
      }

      const alternativa = questao.alternativas.find(
        (item) => item.id === resposta.id_alternativa,
      );

      if (!alternativa) {
        throw badRequest("Alternativa invalida para a questao informada.");
      }

      return {
        ...resposta,
        valor: alternativa.valor,
      };
    });
  }

  private classifyScore(score: number, maxScore: number): string {
    if (maxScore <= 0) {
      return "Nao classificado";
    }

    if (maxScore === 10) {
      if (score >= 6) {
        return "Triagem positiva para TEA";
      }

      if (score >= 4) {
        return "Resultado limítrofe";
      }

      return "Baixa probabilidade";
    }

    const percentage = score / maxScore;

    if (percentage < 0.34) {
      return "Baixa probabilidade";
    }

    if (percentage < 0.67) {
      return "Indicadores moderados";
    }

    return "Indicadores elevados";
  }
}
