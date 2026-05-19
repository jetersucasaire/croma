export interface Servicio {
  id: number;
  uuid: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  icono?: string;
  imagen?: string;
  requisitos?: string;
  categoria?: string;
  precioBase: number;
  unidad: string;
  activo: boolean;
  createdAt?: string;
}

export interface ServicioCreate {
  nombre: string;
  slug?: string;
  descripcion?: string;
  icono?: string;
  imagen?: string;
  precioBase?: number;
  unidad?: string;
}

export interface ServicioUpdate {
  nombre?: string;
  slug?: string;
  descripcion?: string;
  icono?: string;
  imagen?: string;
  precioBase?: number;
  unidad?: string;
  activo?: boolean;
}

export interface Portafolio {
  id: number;
  servicioId: number;
  titulo: string;
  descripcion?: string;
  urlImagen: string;
  esPortada: boolean;
  createdAt?: string;
}