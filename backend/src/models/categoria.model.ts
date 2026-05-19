export interface Categoria {
  id: number;
  uuid: string;
  servicioId?: number;
  nombre: string;
  icono?: string;
  activo: boolean;
  createdAt?: string;
}

export interface CategoriaCreate {
  servicioId?: number;
  nombre: string;
  icono?: string;
}

export interface CategoriaUpdate {
  nombre?: string;
  icono?: string;
  activo?: boolean;
}