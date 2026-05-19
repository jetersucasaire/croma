export interface Proyecto {
  id: number;
  uuid: string;
  usuarioId: number;
  servicioId: number;
  estado: 'briefing' | 'diseno' | 'revision' | 'entrega' | 'completado';
  faseActual: number;
  presupuesto: number;
  trackingId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProyectoCreate {
  usuarioId: number;
  servicioId: number;
  presupuesto?: number;
}

export interface ProyectoEntrega {
  id: number;
  proyectoId: number;
  version: string;
  etiqueta: 'boceto' | 'propuesta' | 'final';
  archivosJson?: string;
  observaciones?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  createdAt?: string;
}

export interface ProyectoPreferencias {
  id: number;
  proyectoId: number;
  coloresHex?: string;
  tipografias?: string;
  estilo?: string;
  valoresMarca?: string;
  publicObjetivo?: string;
  eslogan?: string;
  createdAt?: string;
}