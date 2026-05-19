export interface Pedido {
  id: number;
  uuid: string;
  usuarioId?: number;
  servicioId?: number;
  fase: 'diseno' | 'configuracion' | 'pago' | 'produccion' | 'entregado' | 'cancelado';
  estadoProduccion: 'pendiente' | 'procesando' | 'completado' | 'enviado' | 'entregado';
  total: number;
  trackingId?: string;
  notas?: string;
  diseniadorId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PedidoCreate {
  usuarioId?: number;
  servicioId?: number;
  fase?: string;
  total?: number;
  notas?: string;
}

export interface PedidoDisenio {
  id: number;
  pedidoId: number;
  disenoId?: number;
  archivoUrl?: string;
  archivoNombre?: string;
  tipoCarga: 'catalogo' | 'archivo' | 'externo';
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
  createdAt?: string;
}

export interface PedidoCompleto extends Pedido {
  diseno?: PedidoDisenio;
  config?: PedidoConfig;
  seguimiento?: PedidoSeguimiento[];
  servicioNombre?: string;
  servicioIcono?: string;
  diseniadorNombre?: string;
}

export interface Impresion {
  id: number;
  pedidoId: number;
  tamano: string;
  orientacion: string;
  resolucion: number;
  tipoPapel: string;
  cantidad: number;
  color: string;
  createdAt?: string;
}

export interface Empastado {
  id: number;
  pedidoId: number;
  tipoTapa: string;
  grabado: string;
  correccionAcademica: boolean;
  impresionInterna: boolean;
  createdAt?: string;
}

export interface DisenoGrafico {
  id: number;
  pedidoId: number;
  tipoProducto: string;
  tipoTapa?: string;
  material?: string;
  acabado?: string;
  paletaColores?: string;
  tipografia?: string;
  cantidadTiraje: number;
  estado: string;
  usaDisenoExistente: boolean;
  createdAt?: string;
}

export interface Fotocheck {
  id: number;
  pedidoId: number;
  usaDisenoPropio: boolean;
  cargaMasiva: boolean;
  urlCsv?: string;
  cantidad: number;
  notas?: string;
  createdAt?: string;
}

export interface SelloPersonalizado {
  id: number;
  pedidoId: number;
  tipoSello: string;
  mecanismo: string;
  forma: string;
  contenidoTexto: string;
  usaDisenoExistente: boolean;
  firmaVectorizada: boolean;
  estadoProduccion: string;
  createdAt?: string;
}

export interface EdicionVideo {
  id: number;
  pedidoId: number;
  enlaceExterno?: string;
  duracionEstimada?: string;
  formatoSalida: string;
  instrucciones: string;
  createdAt?: string;
}

export interface DisenoLogo {
  id: number;
  pedidoId: number;
  nombreMarca: string;
  estilo: string;
  coloresRef?: string;
  estadoAprobacion: 'pendiente' | 'aprobado' | 'rechazado';
  createdAt?: string;
}

export interface VersionLogo {
  id: number;
  logoId: number;
  numero: number;
  urlPreview: string;
  urlVector?: string;
  estado: string;
  comentarioCliente?: string;
  fechaSubida: string;
}