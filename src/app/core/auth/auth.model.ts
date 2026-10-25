export type Permiso =
  | 'CATALOGO_LEER'
  | 'CATALOGO_ESCRIBIR'
  | 'CLIENTES_LEER'
  | 'CLIENTES_ESCRIBIR'
  | 'VENTAS_LEER'
  | 'VENTAS_REGISTRAR'
  | 'REPORTES_VER'
  | 'USUARIOS_ADMINISTRAR';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  username: string;
  nombreCompleto: string;
  roles: string[];
  permisos: Permiso[];
}

export interface Sesion {
  token: string;

  expiraEn: number;
  username: string;
  nombreCompleto: string;
  roles: string[];
  permisos: Permiso[];
}

/** Datos del usuario autenticado, sin token ni contraseña. */
export interface PerfilUsuario {
  username: string;
  nombreCompleto: string;
  roles: string[];
  permisos: Permiso[];
}

/** El backend local usa empleadoNombre; la guía usa nombreCompleto. */
export interface PerfilResponse {
  username: string;
  nombreCompleto?: string;
  empleadoNombre?: string;
  roles: string[];
  permisos: Permiso[];
}
