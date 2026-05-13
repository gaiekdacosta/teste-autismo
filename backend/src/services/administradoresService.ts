import { AppError } from "../errors/AppError";
import { AdministradoresRepository } from "../repositories/administradoresRepository";
import type {
  Administrador,
  CreateAdministradorInput,
  UpdateAdministradorInput,
} from "../types/administradores";

export type AdministradoresRepositoryContract = Pick<
  AdministradoresRepository,
  "findAll" | "findActiveByUserId" | "findAuthUserByEmail" | "create" | "update" | "delete"
>;

export class AdministradoresService {
  constructor(
    private readonly administradoresRepository: AdministradoresRepositoryContract =
      new AdministradoresRepository(),
  ) {}

  list(): Promise<Administrador[]> {
    return this.administradoresRepository.findAll();
  }

  findActiveByUserId(userId: string): Promise<Administrador | null> {
    return this.administradoresRepository.findActiveByUserId(userId);
  }

  async create(input: CreateAdministradorInput): Promise<Administrador> {
    const authUser = await this.findAuthUserByEmail(input.email);

    return this.administradoresRepository.create({
      id_user: authUser.id,
      email: authUser.email ?? input.email.trim().toLowerCase(),
      nivel: "super_admin",
      ativo: input.ativo ?? true,
    });
  }

  async update(id: string, input: UpdateAdministradorInput): Promise<Administrador> {
    const payload = { ...input };
    const normalizedEmail = input.email?.trim().toLowerCase();
    let idUser: string | undefined;

    if (normalizedEmail) {
      const authUser = await this.findAuthUserByEmail(normalizedEmail);
      payload.email = authUser.email ?? normalizedEmail;
      idUser = authUser.id;
    }

    const administrador = await this.administradoresRepository.update(id, {
      ...payload,
      id_user: idUser,
      nivel: "super_admin",
    });

    if (!administrador) {
      throw new AppError("Administrador não encontrado.", 404);
    }

    return administrador;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.administradoresRepository.delete(id);

    if (!deleted) {
      throw new AppError("Administrador não encontrado.", 404);
    }
  }

  private async findAuthUserByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const authUser = await this.administradoresRepository.findAuthUserByEmail(normalizedEmail);

    if (!authUser) {
      throw new AppError("Usuário não encontrado no Auth.", 404);
    }

    return authUser;
  }
}
