export interface Diseno {
  id: number;
  uuid: string;
  servicioId: number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  ancho: number;
  alto: number;
  unidad: string;
  parametros?: Record<string, any>;
  activo: boolean;
  createdAt?: string;
}

export interface DisenoCreate {
  servicioId: number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  ancho?: number;
  alto?: number;
  unidad?: string;
  parametros?: Record<string, any>;
}

export interface DisenoUpdate {
  nombre?: string;
  descripcion?: string;
  imagen?: string;
  ancho?: number;
  alto?: number;
  unidad?: string;
  parametros?: Record<string, any>;
  activo?: boolean;
}