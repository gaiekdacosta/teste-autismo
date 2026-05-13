export type NivelAdministrador = "admin" | "super_admin";

export type Administrador = {
  id: string;
  id_user: string;
  email: string;
  ativo: boolean;
  nivel: NivelAdministrador;
  created_at: string;
  updated_at: string;
};

export type CreateAdministradorInput = {
  email: string;
  ativo?: boolean;
};

export type UpdateAdministradorInput = Partial<{
  email: string;
  ativo: boolean;
}>;
