import { conflict, notFound } from "../errors/AppError";
import { QuestionariosRepository } from "../repositories/questionariosRepository";
import type {
  CreateQuestionarioInput,
  Questao,
  QuestaoInput,
  QuestionarioCompleto,
  QuestionarioResumo,
  UpdateQuestionarioInput,
} from "../types/questionarios";

export type QuestionariosRepositoryContract = Pick<
  QuestionariosRepository,
  | "findAllBasic"
  | "findActiveComplete"
  | "findCompleteById"
  | "create"
  | "updateScalars"
  | "replaceQuestoes"
  | "setActive"
  | "deactivateOthers"
  | "hasLinkedTests"
  | "deleteById"
>;

export class QuestionariosService {
  constructor(
    private readonly questionariosRepository: QuestionariosRepositoryContract =
      new QuestionariosRepository(),
  ) {}

  async list(): Promise<QuestionarioResumo[]> {
    return this.questionariosRepository.findAllBasic();
  }

  async getActive(): Promise<QuestionarioCompleto> {
    const questionario =
      await this.questionariosRepository.findActiveComplete();

    if (!questionario) {
      throw notFound("Questionario ativo nao encontrado.");
    }

    return questionario;
  }

  async getById(id: string): Promise<QuestionarioCompleto> {
    const questionario = await this.questionariosRepository.findCompleteById(id);

    if (!questionario) {
      throw notFound("Questionario nao encontrado.");
    }

    return questionario;
  }

  async create(input: CreateQuestionarioInput): Promise<QuestionarioCompleto> {
    const questionarioId = await this.questionariosRepository.create(input);

    if (input.ativo === true) {
      await this.questionariosRepository.deactivateOthers(questionarioId);
    }

    return this.getById(questionarioId);
  }

  async update(
    id: string,
    input: UpdateQuestionarioInput,
  ): Promise<QuestionarioCompleto> {
    const existing = await this.getById(id);

    const questoesAlteradas =
      input.questoes !== undefined &&
      !this.questoesIguais(existing.questoes, input.questoes);

    if (questoesAlteradas) {
      const hasLinkedTests =
        await this.questionariosRepository.hasLinkedTests(id);

      // Quando ja existem testes respondidos, nao alteramos as perguntas no
      // lugar (isso corromperia o historico). Criamos uma nova versao ativa e
      // mantemos a anterior intacta para os testes ja vinculados a ela.
      if (hasLinkedTests) {
        return this.create({
          titulo: input.titulo ?? existing.titulo,
          descricao: input.descricao ?? existing.descricao,
          versao: existing.versao + 1,
          ativo: true,
          questoes: input.questoes!,
        });
      }
    }

    if (input.ativo === true) {
      await this.questionariosRepository.deactivateOthers(id);
    }

    await this.questionariosRepository.updateScalars(id, input);

    if (questoesAlteradas) {
      await this.questionariosRepository.replaceQuestoes(id, input.questoes!);
    }

    return this.getById(id);
  }

  async activate(id: string): Promise<QuestionarioCompleto> {
    await this.ensureExists(id);
    await this.questionariosRepository.deactivateOthers(id);
    await this.questionariosRepository.setActive(id, true);

    return this.getById(id);
  }

  async deactivate(id: string): Promise<QuestionarioCompleto> {
    await this.ensureExists(id);
    await this.questionariosRepository.setActive(id, false);

    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);

    const hasLinkedTests = await this.questionariosRepository.hasLinkedTests(id);

    if (hasLinkedTests) {
      throw conflict(
        "Questionario ja possui testes vinculados e deve ser desativado.",
      );
    }

    await this.questionariosRepository.deleteById(id);
  }

  private questoesIguais(
    atuais: Questao[],
    novas: QuestaoInput[],
  ): boolean {
    if (atuais.length !== novas.length) {
      return false;
    }

    return atuais.every((atual, index) => {
      const nova = novas[index];

      if (
        atual.posicao !== nova.posicao ||
        atual.pergunta.trim() !== nova.pergunta.trim() ||
        atual.alternativas.length !== nova.alternativas.length
      ) {
        return false;
      }

      return atual.alternativas.every((alternativa, alternativaIndex) => {
        const novaAlternativa = nova.alternativas[alternativaIndex];

        return (
          alternativa.posicao === novaAlternativa.posicao &&
          alternativa.texto.trim() === novaAlternativa.texto.trim() &&
          alternativa.valor === novaAlternativa.valor
        );
      });
    });
  }

  private async ensureExists(id: string): Promise<void> {
    const questionario = await this.questionariosRepository.findCompleteById(id);

    if (!questionario) {
      throw notFound("Questionario nao encontrado.");
    }
  }
}
