export interface Usuario {
  id: number;
  uuid: string;
  nombre: string;
  email: string;
  rol: string;
  whatsapp?: string;
  createdAt: string;
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
}

export interface Servicio {
  id: number;
  uuid: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  icono?: string;
  precioBase: number;
  unidad: string;
  activo: boolean;
  createdAt: string;
}

export interface ServicioCreate {
  nombre: string;
  slug: string;
  descripcion?: string;
  icono?: string;
  precioBase?: number;
  unidad?: string;
}

export interface Material {
  id: number;
  uuid: string;
  servicioId: number;
  nombre: string;
  tipo?: string;
  precioUnitario: number;
  stock: number;
  activo: boolean;
  createdAt: string;
}

export interface MaterialCreate {
  servicioId: number;
  nombre: string;
  tipo?: string;
  precioUnitario: number;
  stock?: number;
}

export interface Diseno {
  id: number;
  uuid: string;
  servicioId: number;
  nombre: string;
  imagen?: string;
  ancho: number;
  alto: number;
  unidad: string;
  parametros?: Record<string, any>;
  activo: boolean;
  createdAt: string;
}

export interface DisenoCreate {
  servicioId: number;
  nombre: string;
  imagen?: string;
  ancho: number;
  alto: number;
  unidad?: string;
  parametros?: Record<string, any>;
}

export interface Armazon {
  id: number;
  uuid: string;
  nombre: string;
  mecanismo: 'automatico' | 'madera' | 'bolsillo';
  forma?: string;
  dimensionesMax?: Record<string, number>;
  precio: number;
  stock: number;
  activo: boolean;
  createdAt: string;
}

export interface ArmazonCreate {
  nombre: string;
  mecanismo: 'automatico' | 'madera' | 'bolsillo';
  forma?: string;
  dimensionesMax?: Record<string, number>;
  precio: number;
  stock?: number;
}

export interface Pedido {
  id: number;
  uuid: string;
  usuarioId: number;
  servicioId: number;
  fase: 'diseno' | 'configuracion' | 'produccion' | 'entrega' | 'completado';
  estadoProduccion: string;
  total: number;
  trackingId: string;
  createdAt: string;
  updatedAt: string;
  servicioNombre?: string;
  servicioIcono?: string;
}

export interface PedidoDetalle extends Pedido {
  diseno?: PedidoDiseno;
  configuracion?: PedidoConfig;
  seguimiento?: PedidoSeguimiento[];
}

export interface PedidoDiseno {
  id: number;
  pedidoId: number;
  disenoId?: number;
  archivoUrl?: string;
  archivoNombre?: string;
  tipoCarga: 'catalogo' | 'archivo' | 'enlace';
  enlaceExterno?: string;
  parametros?: Record<string, any>;
}

export interface PedidoConfig {
  id: number;
  pedidoId: number;
  materialId?: number;
  cantidad: number;
  precioUnitario: number;
  opciones?: Record<string, any>;
}

export interface PedidoSeguimiento {
  id: number;
  pedidoId: number;
  estado: string;
  nota?: string;
  createdAt: string;
}

export interface PedidoCreate {
  servicioId: number;
  diseno?: {
    disenoId?: number;
    archivoUrl?: string;
    archivoNombre?: string;
    tipoCarga?: 'catalogo' | 'archivo' | 'enlace';
    enlaceExterno?: string;
    parametros?: Record<string, any>;
  };
  configuracion?: {
    materialId?: number;
    cantidad?: number;
    precioUnitario?: number;
    opciones?: Record<string, any>;
  };
}

export interface Categoria {
  id: number;
  uuid: string;
  servicioId?: number;
  nombre: string;
  icono?: string;
  activo: boolean;
  createdAt: string;
}

export interface CategoriaCreate {
  servicioId?: number;
  nombre: string;
  icono?: string;
}

export interface Mensaje {
  id: number;
  pedidoId: number;
  remitenteId: number;
  tipo: 'mensaje' | 'nota_interna';
  contenido: string;
  leido: boolean;
  createdAt: string;
  remitenteNombre?: string;
}

export interface MensajeCreate {
  contenido: string;
}

export interface Notificacion {
  id: number;
  usuarioId?: number;
  tipo?: string;
  titulo?: string;
  mensaje?: string;
  referenciaId?: number;
  leido: boolean;
  createdAt: string;
}

export interface Archivo {
  id: number;
  uuid: string;
  usuarioId: number;
  nombre: string;
  url: string;
  formato?: string;
  tamaño: number;
  createdAt: string;
  usuarioNombre?: string;
}