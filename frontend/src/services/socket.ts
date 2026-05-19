import { io, Socket } from 'socket.io-client';
import { config } from '../config';

type PedidoEventCallback = (data: {
  pedidoId: number;
  trackingId: string;
  fase: string;
  estado: string;
  mensaje?: string;
}) => void;

type MensajeEventCallback = (data: {
  id: number;
  pedidoId: number;
  contenido: string;
  createdAt: string;
}) => void;

export type NotificacionSocketPayload = {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  referenciaId?: number;
  leido?: boolean;
  createdAt?: string;
  meta?: {
    pedidoId?: number;
    trackingId?: string;
    itemNombre?: string;
    clienteNombre?: string;
    asignadoPor?: string;
    responsableNombre?: string;
    responsableRol?: string;
    estado?: string;
    urlDescarga?: string;
  };
};

type NotificacionEventCallback = (data: NotificacionSocketPayload) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(config.socket.url, {
      ...config.socket.options,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Conectado al servidor');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Desconectado:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Error de conexión:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinPedido(pedidoId: number) {
    this.socket?.emit('join:pedido', pedidoId);
  }

  leavePedido(pedidoId: number) {
    this.socket?.emit('leave:pedido', pedidoId);
  }

  joinUsuario(usuarioId: number) {
    this.socket?.emit('join:usuario', usuarioId);
  }

  onPedidoEstado(callback: PedidoEventCallback) {
    this.socket?.on('pedido:estado', callback);
    return () => this.socket?.off('pedido:estado', callback);
  }

  onMensajeNuevo(callback: MensajeEventCallback) {
    this.socket?.on('mensaje:nuevo', callback);
    return () => this.socket?.off('mensaje:nuevo', callback);
  }

  onNotificacion(callback: NotificacionEventCallback) {
    this.socket?.on('notificacion', callback);
    return () => this.socket?.off('notificacion', callback);
  }

  onPedidoActualizacion(callback: (pedido: any) => void) {
    this.socket?.on('pedido:actualizacion', callback);
    return () => this.socket?.off('pedido:actualizacion', callback);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
export default socketService;