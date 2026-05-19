export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  descripcion: string;
  ventas: number;
  fechaAgregado: string;
  enOferta: boolean;
  imagen?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'cliente' | 'admin' | 'diseniador';
  whatsapp?: string;
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  usuario: Usuario;
  mensaje?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  mensaje?: string;
  error?: string;
}

export type FaseWizard = 'diseño' | 'configuracion' | 'produccion' | 'completado';

export type EstadoProduccion = 'pendiente' | 'en_cola' | 'imprimiendo' | 'acabado' | 'entregado';

export interface Servicio {
  id: number;
  uuid?: string;
  slug: string;
  nombre: string;
  descripcion: string;
  icono: string;
  precioBase: number;
  unidad: string;
  pasos?: number;
  activo?: boolean;
  createdAt?: string;
}

export interface Diseno {
  id: number;
  uuid?: string;
  servicioId: number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  ancho?: number;
  alto?: number;
  unidad?: string;
  dimensiones?: {
    ancho: number;
    alto: number;
    unidad: string;
  };
  parametros?: Record<string, unknown>;
  activo?: boolean;
}

export interface Material {
  id: number;
  uuid?: string;
  servicioId: number;
  nombre: string;
  descripcion?: string;
  tipo: string;
  precioUnitario: number;
  stock: number;
  disponible?: boolean;
  activo?: boolean;
}

export interface Armazon {
  id: number;
  uuid?: string;
  nombre: string;
  mecanismo: 'automatico' | 'madera' | 'bolsillo';
  forma: 'circular' | 'rectangular' | 'cuadrada';
  dimensionesMax?: string;
  precio: number;
  stock: number;
  activo?: boolean;
}

export interface Archivo {
  id: number;
  uuid?: string;
  usuarioId: number;
  nombre: string;
  url: string;
  formato: string;
  tamaño: number;
  fechaSubida?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  icono?: string;
  servicioId?: number;
  activo?: boolean;
}

export interface Notificacion {
  id: number;
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipo: 'pedido' | 'mensaje' | 'sistema' | 'promocion';
  leido: boolean;
  link?: string;
  createdAt: string;
}

export interface Mensaje {
  id: number;
  pedidoId: number;
  usuarioId: number;
  contenido: string;
  esAdmin: boolean;
  createdAt: string;
  leido?: boolean;
}

export interface Pedido {
  id: number;
  uuid?: string;
  usuarioId: number;
  servicioId: number;
  servicio?: Servicio;
  fase: FaseWizard;
  estadoProduccion: EstadoProduccion;
  diseño: {
    disenoId?: number;
    diseno?: Diseno;
    archivoUrl?: string;
    archivoNombre?: string;
    tipoCarga: 'catalogo' | 'archivo' | 'externo' | 'biblioteca';
    enlaceExterno?: string;
  };
  configuracion: {
    materialId?: number;
    material?: Material;
    cantidad: number;
    opciones?: Record<string, unknown>;
  };
  total: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  trackingId?: string;
  notas?: string;
  diseniadorId?: number;
}

export interface PedidoStats {
  totalPedidos: number;
  pedidosPendientes: number;
  pedidosEnProceso: number;
  pedidosEntregados: number;
  ingresosTotales: number;
  ingresosMes: number;
  pedidosPorDia: { fecha: string; count: number }[];
  serviciosPopulares: { servicio: string; count: number }[];
}

export interface WizardConfig {
  pasoActual: number;
  servicioSlug: string;
  diseno: DisenoSeleccionado | null;
  material: MaterialSeleccionado | null;
  cantidad: number;
  archivo: FileData | null;
}

export interface DisenoSeleccionado {
  disenoId?: number;
  diseno?: Diseno;
  archivoUrl?: string;
  archivoNombre?: string;
  tipoCarga: 'catalogo' | 'archivo' | 'externo' | 'biblioteca';
  enlaceExterno?: string;
}

export interface MaterialSeleccionado {
  materialId: number;
  material: Material;
  cantidad: number;
}

export interface FileData {
  nombre: string;
  url: string;
  tamaño: number;
  formato: string;
}

export interface ToastMessage {
  id: string;
  tipo: 'success' | 'error' | 'warning' | 'info';
  titulo: string;
  mensaje?: string;
  duracion?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

export interface FilterParams {
  buscar?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ServidorResponse<T> {
  success: boolean;
  data?: T;
  mensaje?: string;
}

export interface PedidoStats {
  totalPedidos: number;
  pedidosPendientes: number;
  pedidosEnProceso: number;
  pedidosEntregados: number;
  ingresosTotales: number;
  ingresosMes: number;
  pedidosPorDia: { fecha: string; count: number }[];
  serviciosPopulares: { servicio: string; count: number }[];
}