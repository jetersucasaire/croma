export interface Notificacion {
  id: number;
  usuarioId?: number;
  tipo: 'pedido' | 'pago' | 'sistema' | 'mensaje' | 'asignacion';
  titulo: string;
  mensaje: string;
  referenciaId?: number;
  leido: boolean;
  createdAt?: string;
}

export interface NotificacionCreate {
  usuarioId?: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  referenciaId?: number;
}

export interface NotificacionUpdate {
  leido?: boolean;
}