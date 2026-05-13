import type { User } from "@supabase/supabase-js";
import { UsuariosRepository } from "../repositories/usuariosRepository";
import type { TesteCompleto } from "../types/testes";
import type { UsuarioAvaliado, UsuarioSistema } from "../types/usuarios";

type AuthUserWithRawMetadata = User & {
  raw_user_meta_data?: Record<string, unknown>;
  rawUserMetaData?: Record<string, unknown>;
};

export type UsuariosRepositoryContract = Pick<
  UsuariosRepository,
  "findAuthUsers" | "findAvaliadosByUserIds" | "findTestesByUserIds"
>;

export class UsuariosService {
  constructor(
    private readonly usuariosRepository: UsuariosRepositoryContract =
      new UsuariosRepository(),
  ) {}

  async listAll(): Promise<UsuarioSistema[]> {
    const authUsers = await this.usuariosRepository.findAuthUsers();
    const userIds = authUsers.map((user) => user.id);
    const [avaliados, testes] = await Promise.all([
      this.usuariosRepository.findAvaliadosByUserIds(userIds),
      this.usuariosRepository.findTestesByUserIds(userIds),
    ]);

    const avaliadosByUserId = this.groupByUserId(avaliados);
    const testesByUserId = this.groupByUserId(testes);

    return authUsers.map((user) => ({
      id: user.id,
      email: this.firstText(user.email, this.getMetadataText(user, "email")),
      name:
        this.getMetadataText(user, "name") ??
        this.getMetadataText(user, "full_name"),
      phone: this.firstText(user.phone, this.getMetadataText(user, "phone")),
      birthDate:
        this.getMetadataText(user, "birthDate") ??
        this.getMetadataText(user, "data_nascimento"),
      gender:
        this.getMetadataText(user, "gender") ??
        this.getMetadataText(user, "genero"),
      avatarUrl: this.getMetadataText(user, "avatar_url"),
      created_at: user.created_at,
      updated_at: user.updated_at ?? null,
      last_sign_in_at: user.last_sign_in_at ?? null,
      avaliados: avaliadosByUserId.get(user.id) ?? [],
      testes: testesByUserId.get(user.id) ?? [],
    }));
  }

  private groupByUserId<T extends { id_user: string }>(items: T[]): Map<string, T[]> {
    const grouped = new Map<string, T[]>();

    for (const item of items) {
      const currentItems = grouped.get(item.id_user) ?? [];
      currentItems.push(item);
      grouped.set(item.id_user, currentItems);
    }

    return grouped;
  }

  private getMetadataText(user: User, key: string): string | null {
    const rawUser = user as AuthUserWithRawMetadata;
    const identityMetadata = user.identities?.find((identity) => {
      const value = identity.identity_data?.[key];
      return typeof value === "string" && value.trim().length > 0;
    })?.identity_data;
    const value =
      user.user_metadata?.[key] ??
      rawUser.raw_user_meta_data?.[key] ??
      rawUser.rawUserMetaData?.[key] ??
      identityMetadata?.[key];

    return this.firstText(value);
  }

  private firstText(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }

    return null;
  }
}
