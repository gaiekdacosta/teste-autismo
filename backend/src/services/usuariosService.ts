import type { User } from "@supabase/supabase-js";
import { badRequest } from "../errors/AppError";
import { AdministradoresRepository } from "../repositories/administradoresRepository";
import { UsuariosRepository } from "../repositories/usuariosRepository";
import type { TesteCompleto } from "../types/testes";
import type { UsuarioAvaliado, UsuarioSistema } from "../types/usuarios";

type AuthUserWithRawMetadata = User & {
  raw_user_meta_data?: Record<string, unknown>;
  rawUserMetaData?: Record<string, unknown>;
};

export type UsuariosRepositoryContract = Pick<
  UsuariosRepository,
  | "findAuthUsers"
  | "findAvaliadosByUserIds"
  | "findTestesByUserIds"
  | "findComprasByUserIds"
  | "setContatado"
  | "deleteUserCompletely"
>;

export type ContatadoStatus = {
  id: string;
  contatado: boolean;
  contatado_em: string | null;
};

export class UsuariosService {
  constructor(
    private readonly usuariosRepository: UsuariosRepositoryContract =
      new UsuariosRepository(),
    private readonly administradoresRepository: Pick<
      AdministradoresRepository,
      "existsByUserId"
    > = new AdministradoresRepository(),
  ) {}

  async listAll(): Promise<UsuarioSistema[]> {
    const authUsers = await this.usuariosRepository.findAuthUsers();
    const userIds = authUsers.map((user) => user.id);
    const [avaliados, testes, compras] = await Promise.all([
      this.usuariosRepository.findAvaliadosByUserIds(userIds),
      this.usuariosRepository.findTestesByUserIds(userIds),
      this.usuariosRepository.findComprasByUserIds(userIds),
    ]);

    const avaliadosByUserId = this.groupByUserId(avaliados);
    const testesByUserId = this.groupByUserId(testes);
    const comprasByUserId = this.groupByUserId(compras);

    return authUsers.map((user) => ({
      id: user.id,
      email: this.firstText(user.email, this.getMetadataText(user, "email")),
      name:
        this.getMetadataText(user, "name") ??
        this.getMetadataText(user, "full_name"),
      phone: this.firstText(user.phone, this.getMetadataText(user, "phone")),
      avatarUrl: this.getMetadataText(user, "avatar_url"),
      created_at: user.created_at,
      updated_at: user.updated_at ?? null,
      last_sign_in_at: user.last_sign_in_at ?? null,
      avaliados: avaliadosByUserId.get(user.id) ?? [],
      testes: testesByUserId.get(user.id) ?? [],
      compras: comprasByUserId.get(user.id) ?? [],
      ...this.readContatado(user),
    }));
  }

  async setContatado(
    userId: string,
    contatado: boolean,
  ): Promise<ContatadoStatus> {
    const contatadoEm = contatado ? new Date().toISOString() : null;
    const updated = await this.usuariosRepository.setContatado(
      userId,
      contatado,
      contatadoEm,
    );

    return { id: updated.id, ...this.readContatado(updated) };
  }

  async deleteUser(userId: string, requesterId: string): Promise<void> {
    if (userId === requesterId) {
      throw badRequest("Você não pode excluir a própria conta.");
    }

    // A FK administradores.id_user -> auth.users e NO ACTION: excluir a conta
    // de um administrador falharia por violacao de FK. Bloqueamos com uma
    // mensagem clara — o acesso de admin deve ser removido antes.
    const isAdministrador =
      await this.administradoresRepository.existsByUserId(userId);

    if (isAdministrador) {
      throw badRequest(
        "Este usuário é um administrador. Remova o acesso de administrador antes de excluí-lo.",
      );
    }

    await this.usuariosRepository.deleteUserCompletely(userId);
  }

  private readContatado(user: User): {
    contatado: boolean;
    contatado_em: string | null;
  } {
    const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
    const contatadoEm = appMetadata.contatado_em;

    return {
      contatado: appMetadata.contatado === true,
      contatado_em:
        typeof contatadoEm === "string" && contatadoEm.trim().length > 0
          ? contatadoEm
          : null,
    };
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
