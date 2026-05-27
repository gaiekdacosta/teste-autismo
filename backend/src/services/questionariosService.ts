import { conflict, notFound } from "../errors/AppError";
import { QuestionariosRepository } from "../repositories/questionariosRepository";
import type {
  CreateQuestionarioInput,
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
    await this.ensureExists(id);

    if (input.ativo === true) {
      await this.questionariosRepository.deactivateOthers(id);
    }

    await this.questionariosRepository.updateScalars(id, input);

    if (input.questoes) {
      const hasLinkedTests = await this.questionariosRepository.hasLinkedTests(id);

      if (hasLinkedTests) {
        throw conflict(
          "Não é possível alterar as perguntas de um questionário que já possui testes respondidos.",
        );
      }

      await this.questionariosRepository.replaceQuestoes(id, input.questoes);
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

  private async ensureExists(id: string): Promise<void> {
    const questionario = await this.questionariosRepository.findCompleteById(id);

    if (!questionario) {
      throw notFound("Questionario nao encontrado.");
    }
  }
}
