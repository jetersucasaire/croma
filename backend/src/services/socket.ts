import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../middleware/logger';

let io: SocketServer | null = null;

export interface PedidoEvent {
  pedidoId: number;
  trackingId: string;
  fase: string;
  estado: string;
  mensaje?: string;
}

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Cliente conectado');

    socket.on('join:pedido', (pedidoId: number) => {
      socket.join(`pedido:${pedidoId}`);
      logger.info({ pedidoId, socketId: socket.id }, 'Cliente unió a pedido');
    });

    socket.on('leave:pedido', (pedidoId: number) => {
      socket.leave(`pedido:${pedidoId}`);
    });

    socket.on('join:usuario', (usuarioId: number) => {
      socket.join(`usuario:${usuarioId}`);
      logger.info({ usuarioId, socketId: socket.id }, 'Cliente unió a usuario');
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Cliente desconectado');
    });
  });

  logger.info('Socket.io inicializado');
  return io;
}

export function getIO(): SocketServer | null {
  return io;
}

export function emitCambioEstado(pedido: PedidoEvent): void {
  if (!io) return;

  io.to(`pedido:${pedido.pedidoId}`).emit('pedido:estado', pedido);
  io.to(`usuario:${pedido.pedidoId}`).emit('pedido:estado', pedido);
  
  logger.info({ pedidoId: pedido.pedidoId, fase: pedido.fase }, 'Emitido cambio de estado');
}

export function emitNuevoMensaje(pedidoId: number, mensaje: any): void {
  if (!io) return;

  io.to(`pedido:${pedidoId}`).emit('mensaje:nuevo', mensaje);
  logger.info({ pedidoId }, 'Emitido nuevo mensaje');
}

export function emitNotificacion(usuarioId: number, notificacion: any): void {
  if (!io) return;

  io.to(`usuario:${usuarioId}`).emit('notificacion', notificacion);
  logger.info({ usuarioId }, 'Emitida notificación');
}

export function emitActualizacionPedido(pedido: any): void {
  if (!io) return;

  io.emit('pedido:actualizacion', pedido);
}