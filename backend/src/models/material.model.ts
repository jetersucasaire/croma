export interface Material {
  id: number;
  uuid: string;
  servicioId: number;
  nombre: string;
  descripcion?: string;
  tipo?: string;
  gramaje?: number;
  compatibleFormato?: string;
  precioUnitario: number;
  stock: number;
  activo: boolean;
  createdAt?: string;
}

export interface MaterialCreate {
  servicioId: number;
  nombre: string;
  descripcion?: string;
  tipo?: string;
  gramaje?: number;
  compatibleFormato?: string;
  precioUnitario: number;
  stock?: number;
}

export interface MaterialUpdate {
  nombre?: string;
  descripcion?: string;
  tipo?: string;
  gramaje?: number;
  compatibleFormato?: string;
  precioUnitario?: number;
  stock?: number;
  activo?: boolean;
}