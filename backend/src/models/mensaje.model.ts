export interface Mensaje {
  id: number;
  pedidoId?: number;
  remitenteId?: number;
  tipo: 'mensaje' | 'sistema' | 'alerta';
  contenido: string;
  leido: boolean;
  createdAt?: string;
}

export interface MensajeCreate {
  pedidoId: number;
  contenido: string;
  tipo?: string;
}

export interface HistorialContacto {
  id: number;
  pedidoId?: number;
  canal: 'whatsapp' | 'email' | 'sms';
  mensaje: string;
  enviadoPor?: number;
  createdAt?: string;
}