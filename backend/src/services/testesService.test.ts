import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TestesService } from "./testesService";
import type { TestesRepositoryContract } from "./testesService";
import type {
  Avaliado,
  CompleteTesteInput,
  Contato,
  CreateAvaliadoInput,
  CreateContatoInput,
  CreateTesteInput,
  QuestionarioParaTeste,
  TesteCompleto,
  UpdateAvaliadoInput,
  UpdateContatoInput,
  UpdateTesteInput,
} from "../types/testes";

class FakeTestesRepository implements TestesRepositoryContract {
  private createdTeste: TesteCompleto | null = null;

  constructor(private readonly questionario: QuestionarioParaTeste) {}

  async findByUserId(): Promise<TesteCompleto[]> {
    return this.createdTeste ? [this.createdTeste] : [];
  }

  async findCompleteById(): Promise<TesteCompleto | null> {
    return this.createdTeste;
  }

  async findQuestionarioParaTeste(): Promise<QuestionarioParaTeste | null> {
    return this.questionario;
  }

  async create(): Promise<string> {
    return "teste-1";
  }

  async createCompleted(
    input: CompleteTesteInput,
    userId: string,
    result: {
      pontuacao_total: number;
      classificacao: string;
      respostas: Array<{ id_questao: string; id_alternativa: string; valor: number }>;
    },
  ): Promise<string> {
    this.createdTeste = {
      id: "teste-1",
      id_user: userId,
      id_avaliado: input.id_avaliado ?? null,
      id_questionario: input.id_questionario,
      status: "concluido",
      pontuacao_total: result.pontuacao_total,
      classificacao: result.classificacao,
      started_at: null,
      finished_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      questionario: null,
      avaliado: null,
      respostas: [],
    };

    return "teste-1";
  }

  async update(_id: string, _input: UpdateTesteInput): Promise<void> {}

  async deleteById(): Promise<void> {}

  async findAvaliadosByUserId(): Promise<Avaliado[]> {
    return [];
  }

  async findAvaliadoById(): Promise<Avaliado | null> {
    return null;
  }

  async createAvaliado(_input: CreateAvaliadoInput): Promise<string> {
    return "avaliado-1";
  }

  async updateAvaliado(_id: string, _input: UpdateAvaliadoInput): Promise<void> {}

  async deleteAvaliadoById(): Promise<void> {}

  async findContato(): Promise<Contato | null> {
    return null;
  }

  async createContato(_input: CreateContatoInput): Promise<string> {
    return "contato-1";
  }

  async updateContato(_input: UpdateContatoInput): Promise<void> {}
}

function buildAq10Questionario(): QuestionarioParaTeste {
  return {
    id: "aq-10",
    questoes: Array.from({ length: 10 }, (_, index) => ({
      id: `questao-${index + 1}`,
      alternativas: [
        { id: `questao-${index + 1}-nao-pontua`, valor: 0 },
        { id: `questao-${index + 1}-pontua`, valor: 1 },
      ],
    })),
  };
}

async function completeAq10(score: number): Promise<TesteCompleto> {
  const repository = new FakeTestesRepository(buildAq10Questionario());
  const service = new TestesService(repository);

  return service.complete(
    {
      id_questionario: "aq-10",
      respostas: Array.from({ length: 10 }, (_, index) => ({
        id_questao: `questao-${index + 1}`,
        id_alternativa:
          index < score
            ? `questao-${index + 1}-pontua`
            : `questao-${index + 1}-nao-pontua`,
      })),
    },
    "user-1",
  );
}

describe("TestesService", () => {
  it("classifica AQ-10 abaixo de 4 como baixa probabilidade", async () => {
    const teste = await completeAq10(3);

    assert.equal(teste.pontuacao_total, 3);
    assert.equal(teste.classificacao, "Baixa probabilidade");
  });

  it("classifica AQ-10 de 4 a 5 como resultado limitrofe", async () => {
    const teste = await completeAq10(4);

    assert.equal(teste.pontuacao_total, 4);
    assert.equal(teste.classificacao, "Resultado limítrofe");
  });

  it("classifica AQ-10 com 6 ou mais como triagem positiva", async () => {
    const teste = await completeAq10(6);

    assert.equal(teste.pontuacao_total, 6);
    assert.equal(teste.classificacao, "Triagem positiva para TEA");
  });
});
