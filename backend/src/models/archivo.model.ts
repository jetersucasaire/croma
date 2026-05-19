export interface Archivo {
  id: number;
  uuid: string;
  usuarioId: number;
  nombre: string;
  url: string;
  formato?: string;
  tamano: number;
  createdAt?: string;
}

export interface ArchivoCreate {
  usuarioId: number;
  nombre: string;
  url: string;
  formato?: string;
  tamano?: number;
}

export interface PedidoArchivo {
  id: number;
  uuid: string;
  pedidoId: number;
  tipo: 'diseno' | 'comprobante' | 'otros';
  nombre: string;
  url: string;
  formato?: string;
  tamano?: number;
  createdAt?: string;
}