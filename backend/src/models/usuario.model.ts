export interface Usuario {
  id: number;
  uuid: string;
  nombre: string;
  email: string;
  password?: string;
  rol: 'cliente' | 'admin' | 'diseniador';
  whatsapp?: string;
  activo: boolean;
  createdAt?: string;
}

export interface UsuarioCreate {
  nombre: string;
  email: string;
  password: string;
  whatsapp?: string;
}

export interface UsuarioUpdate {
  nombre?: string;
  whatsapp?: string;
  rol?: string;
  activo?: boolean;
}

export interface UsuarioResponse {
  id: number;
  uuid: string;
  nombre: string;
  email: string;
  rol: string;
  whatsapp?: string;
  createdAt?: string;
}

export interface PasswordResetToken {
  id: number;
  userId: number;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}