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
}

export type FaseWizard = 'diseño' | 'configuracion' | 'produccion' | 'completado';

export type EstadoProduccion = 'pendiente' | 'en_cola' | 'imprimiendo' | 'acabado' | 'entregado';

export interface Servicio {
  id: number;
  uuid?: string;
  slug?: string;
  nombre: string;
  descripcion: string;
  icono: string;
  precioBase: number;
  unidad: string;
  pasos?: number;
  activo?: boolean;
}

export interface Diseno {
  id: number;
  uuid?: string;
  servicioId: number;
  nombre: string;
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
}

export interface Material {
  id: number;
  uuid?: string;
  servicioId: number;
  nombre: string;
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

// Configuraciones específicas por servicio
export interface ConfigBase {
  materialId?: number;
  cantidad: number;
  precioUnitario?: number;
}

// FOTOCHECK
export interface ConfigFotocheck extends ConfigBase {
  acabado: 'plastificado' | 'mate' | 'hilo';
}

// IMPRESIONES
export interface ConfigImpresiones extends ConfigBase {
  formato: 'A4' | 'A3' | 'personalizado';
  ancho?: number;
  alto?: number;
  orientacion: 'vertical' | 'horizontal';
  resolucion: '150dpi' | '300dpi';
}

// EMPASTADOS
export interface ConfigEmpastados extends ConfigBase {
  tipoFuente: 'digital' | 'fisico';
  archivoUrl?: string;
  descripcionFisico?: string;
  tipoTapa: 'dura' | 'blanda' | 'cuero';
  grabado: 'dorado' | 'plateado' | 'ninguno';
  correccion: boolean;
  cantidadPaginas?: number;
}

// EDICIÓN AUDIO/VIDEO
export interface ConfigEdicion {
  formatoArchivo: string;
  tamaño?: number;
  enlaceExterno?: string;
  requiereMarcasTiempo: boolean;
  instrucciones: string;
  prioridad: 'baja' | 'media' | 'alta';
}

// DISEÑO LOGOS - Briefing
export interface BriefingLogo {
  paletaColores: string[];
  tipografias: string[];
  estilo: 'minimalista' | 'complejo' | 'corporativo';
  valores: string;
  targetAudiencia: string;
  eslogan?: string;
}

// DISEÑO LOGOS - Entregas
export interface EntregaLogo {
  id: number;
  pedidoId: number;
  version: string;
  estado: 'boceto' | 'propuesta' | 'final';
  archivoUrl: string;
  notas?: string;
  createdAt?: string;
}

// DISEÑO LOGOS - Aprobación
export interface AprobacionLogo {
  aprobado: boolean;
  observaciones?: string;
}

// SELLOS
export interface ConfigSellos {
  mecanismo: 'automatico' | 'madera' | 'bolsillo';
  forma: 'circular' | 'rectangular' | 'cuadrada';
  colorTinta: 'negro' | 'rojo' | 'azul' | 'verde';
  armazonId?: number;
  esSelloFirma: boolean;
  archivoFirmaUrl?: string;
}

// Diseno seleccionado en wizard
export interface DisenoSeleccionado {
  disenoId?: number;
  diseno?: Diseno;
  archivoUrl?: string;
  archivoNombre?: string;
  tipoCarga: 'catalogo' | 'archivo' | 'externo' | 'biblioteca';
  enlaceExterno?: string;
  parametros?: Record<string, unknown>;
}

// Pedido completo (legacy para compatibilidad)
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
    tipoCarga: 'catalogo' | 'archivo' | 'externo';
    enlaceExterno?: string;
  };
  configuracion: {
    materialId?: number;
    material?: Material;
    cantidad: number;
    opciones?: Record<string, unknown>;
  };
  total: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  trackingId?: string;
  notas?: string;
}