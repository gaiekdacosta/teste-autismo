import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../errors/AppError";
import { QuestionariosService } from "./questionariosService";
import type { QuestionariosRepositoryContract } from "./questionariosService";
import type {
  CreateQuestionarioInput,
  QuestionarioCompleto,
  QuestionarioResumo,
  QuestaoInput,
  UpdateQuestionarioInput,
} from "../types/questionarios";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function buildQuestionario(
  overrides: Partial<QuestionarioCompleto> = {},
): QuestionarioCompleto {
  return {
    id: overrides.id ?? "questionario-1",
    titulo: overrides.titulo ?? "Questionario base",
    descricao: overrides.descricao ?? "Descricao base",
    versao: overrides.versao ?? 1,
    ativo: overrides.ativo ?? false,
    questoes: overrides.questoes ?? [
      {
        id: "questao-1",
        posicao: 1,
        pergunta: "Pergunta 1",
        alternativas: [
          {
            id: "alternativa-1",
            posicao: 1,
            texto: "Alternativa 1",
            valor: 0,
          },
        ],
      },
    ],
  };
}

function buildQuestaoInput(): QuestaoInput[] {
  return [
    {
      posicao: 1,
      pergunta: "Nova pergunta",
      alternativas: [
        {
          posicao: 1,
          texto: "Nova alternativa",
          valor: 2,
        },
      ],
    },
  ];
}

class FakeQuestionariosRepository implements QuestionariosRepositoryContract {
  private questionarios: QuestionarioCompleto[];
  private linkedTestsQuestionarios = new Set<string>();
  private nextId = 1;

  constructor(questionarios: QuestionarioCompleto[] = []) {
    this.questionarios = questionarios.map(clone);
  }

  addLinkedTests(questionarioId: string): void {
    this.linkedTestsQuestionarios.add(questionarioId);
  }

  async findAllBasic(): Promise<QuestionarioResumo[]> {
    return this.questionarios.map(({ questoes: _questoes, ...questionario }) =>
      clone(questionario),
    );
  }

  async findActiveComplete(): Promise<QuestionarioCompleto | null> {
    const questionario = this.questionarios.find((item) => item.ativo);
    return questionario ? clone(questionario) : null;
  }

  async findCompleteById(id: string): Promise<QuestionarioCompleto | null> {
    const questionario = this.questionarios.find((item) => item.id === id);
    return questionario ? clone(questionario) : null;
  }

  async create(input: CreateQuestionarioInput): Promise<string> {
    const id = `questionario-${this.nextId}`;
    this.nextId += 1;

    this.questionarios.push({
      id,
      titulo: input.titulo,
      descricao: input.descricao,
      versao: input.versao,
      ativo: input.ativo ?? false,
      questoes: this.mapQuestoes(id, input.questoes),
    });

    return id;
  }

  async updateScalars(
    id: string,
    input: UpdateQuestionarioInput,
  ): Promise<void> {
    const questionario = this.questionarios.find((item) => item.id === id);

    if (!questionario) {
      return;
    }

    Object.assign(questionario, {
      titulo: input.titulo ?? questionario.titulo,
      descricao: input.descricao ?? questionario.descricao,
      versao: input.versao ?? questionario.versao,
      ativo: input.ativo ?? questionario.ativo,
    });
  }

  async replaceQuestoes(id: string, questoes: QuestaoInput[]): Promise<void> {
    const questionario = this.questionarios.find((item) => item.id === id);

    if (!questionario) {
      return;
    }

    questionario.questoes = this.mapQuestoes(id, questoes);
  }

  async setActive(id: string, ativo: boolean): Promise<void> {
    const questionario = this.questionarios.find((item) => item.id === id);

    if (questionario) {
      questionario.ativo = ativo;
    }
  }

  async deactivateOthers(activeQuestionarioId: string): Promise<void> {
    this.questionarios = this.questionarios.map((questionario) => ({
      ...questionario,
      ativo:
        questionario.id === activeQuestionarioId ? questionario.ativo : false,
    }));
  }

  async hasLinkedTests(questionarioId: string): Promise<boolean> {
    return this.linkedTestsQuestionarios.has(questionarioId);
  }

  async deleteById(id: string): Promise<void> {
    this.questionarios = this.questionarios.filter((item) => item.id !== id);
  }

  private mapQuestoes(
    questionarioId: string,
    questoes: QuestaoInput[],
  ): QuestionarioCompleto["questoes"] {
    return questoes.map((questao, questaoIndex) => ({
      id: `${questionarioId}-questao-${questaoIndex + 1}`,
      posicao: questao.posicao,
      pergunta: questao.pergunta,
      alternativas: questao.alternativas.map((alternativa, alternativaIndex) => ({
        id: `${questionarioId}-alternativa-${questaoIndex + 1}-${
          alternativaIndex + 1
        }`,
        posicao: alternativa.posicao,
        texto: alternativa.texto,
        valor: alternativa.valor,
      })),
    }));
  }
}

async function assertAppError(
  action: () => Promise<unknown>,
  statusCode: number,
): Promise<void> {
  await assert.rejects(action, (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, statusCode);
    return true;
  });
}

describe("QuestionariosService", () => {
  it("lista questionarios com dados basicos", async () => {
    const repository = new FakeQuestionariosRepository([
      buildQuestionario({ id: "questionario-1" }),
      buildQuestionario({ id: "questionario-2", versao: 2 }),
    ]);
    const service = new QuestionariosService(repository);

    const questionarios = await service.list();

    assert.deepEqual(questionarios, [
      {
        id: "questionario-1",
        titulo: "Questionario base",
        descricao: "Descricao base",
        versao: 1,
        ativo: false,
      },
      {
        id: "questionario-2",
        titulo: "Questionario base",
        descricao: "Descricao base",
        versao: 2,
        ativo: false,
      },
    ]);
  });

  it("busca o questionario ativo completo", async () => {
    const repository = new FakeQuestionariosRepository([
      buildQuestionario({ id: "questionario-1", ativo: true }),
    ]);
    const service = new QuestionariosService(repository);

    const questionario = await service.getActive();

    assert.equal(questionario.id, "questionario-1");
    assert.equal(questionario.questoes[0].alternativas[0].texto, "Alternativa 1");
  });

  it("retorna 404 quando nao existe questionario ativo", async () => {
    const service = new QuestionariosService(new FakeQuestionariosRepository());

    await assertAppError(() => service.getActive(), 404);
  });

  it("busca questionario por id e retorna 404 quando nao existe", async () => {
    const service = new QuestionariosService(
      new FakeQuestionariosRepository([buildQuestionario({ id: "questionario-1" })]),
    );

    const questionario = await service.getById("questionario-1");

    assert.equal(questionario.id, "questionario-1");
    await assertAppError(() => service.getById("questionario-inexistente"), 404);
  });

  it("cria questionario com questoes e alternativas", async () => {
    const service = new QuestionariosService(new FakeQuestionariosRepository());

    const questionario = await service.create({
      titulo: "Novo questionario",
      descricao: "Nova descricao",
      versao: 1,
      ativo: false,
      questoes: buildQuestaoInput(),
    });

    assert.equal(questionario.titulo, "Novo questionario");
    assert.equal(questionario.questoes[0].pergunta, "Nova pergunta");
    assert.equal(questionario.questoes[0].alternativas[0].valor, 2);
  });

  it("atualiza dados, questoes e alternativas", async () => {
    const service = new QuestionariosService(
      new FakeQuestionariosRepository([buildQuestionario({ id: "questionario-1" })]),
    );

    const questionario = await service.update("questionario-1", {
      titulo: "Titulo atualizado",
      descricao: "Descricao atualizada",
      versao: 2,
      ativo: true,
      questoes: buildQuestaoInput(),
    });

    assert.equal(questionario.titulo, "Titulo atualizado");
    assert.equal(questionario.versao, 2);
    assert.equal(questionario.ativo, true);
    assert.equal(questionario.questoes[0].pergunta, "Nova pergunta");
  });

  it("ativa um questionario e desativa os demais", async () => {
    const service = new QuestionariosService(
      new FakeQuestionariosRepository([
        buildQuestionario({ id: "questionario-1", ativo: true }),
        buildQuestionario({ id: "questionario-2", ativo: false }),
      ]),
    );

    const questionario = await service.activate("questionario-2");

    assert.equal(questionario.ativo, true);
    assert.equal((await service.getById("questionario-1")).ativo, false);
  });

  it("desativa um questionario", async () => {
    const service = new QuestionariosService(
      new FakeQuestionariosRepository([
        buildQuestionario({ id: "questionario-1", ativo: true }),
      ]),
    );

    const questionario = await service.deactivate("questionario-1");

    assert.equal(questionario.ativo, false);
  });

  it("bloqueia exclusao quando ha testes vinculados", async () => {
    const repository = new FakeQuestionariosRepository([
      buildQuestionario({ id: "questionario-1" }),
    ]);
    repository.addLinkedTests("questionario-1");
    const service = new QuestionariosService(repository);

    await assertAppError(() => service.delete("questionario-1"), 409);
  });

  it("exclui questionario sem testes e retorna 404 para inexistente", async () => {
    const service = new QuestionariosService(
      new FakeQuestionariosRepository([buildQuestionario({ id: "questionario-1" })]),
    );

    await service.delete("questionario-1");

    await assertAppError(() => service.getById("questionario-1"), 404);
    await assertAppError(() => service.delete("questionario-inexistente"), 404);
  });
});
