import { useEffect, useCallback } from 'react';
import { socketService, type NotificacionSocketPayload } from '../services/socket';
import { useAuthStore, useNotificacionStore, useUIStore } from '../stores';

function esNotificacionAsignacion(notif: NotificacionSocketPayload): boolean {
  return notif.tipo === 'asignacion' || Boolean(notif.meta?.pedidoId);
}

export function useSocket() {
  const { isAuthenticated, usuario } = useAuthStore();
  const { agregarNotificacion, cargarSinLeer } = useNotificacionStore();
  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    if (!isAuthenticated || !usuario) {
      socketService.disconnect();
      return;
    }

    socketService.connect();
    socketService.joinUsuario(usuario.id);

    const unsubNotif = socketService.onNotificacion((notif) => {
      agregarNotificacion({
        id: notif.id,
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        tipo: notif.tipo,
        referenciaId: notif.referenciaId ?? notif.meta?.pedidoId,
        leido: false,
        createdAt: notif.createdAt || new Date().toISOString(),
        meta: notif.meta,
      });

      if (esNotificacionAsignacion(notif)) {
        const resumen =
          notif.meta?.itemNombre && notif.meta?.clienteNombre
            ? `${notif.meta.itemNombre} · Cliente: ${notif.meta.clienteNombre}`
            : notif.mensaje.split('\n').find((l) => l.trim()) || notif.mensaje;

        showToast({
          tipo: 'info',
          titulo: notif.titulo.replace(/^📋\s*/, ''),
          mensaje: resumen,
          duracion: 9000,
        });
      }

      cargarSinLeer();
    });

    return () => {
      unsubNotif();
    };
  }, [isAuthenticated, usuario?.id, agregarNotificacion, cargarSinLeer, showToast]);

  const joinPedido = useCallback((pedidoId: number) => {
    socketService.joinPedido(pedidoId);
  }, []);

  const leavePedido = useCallback((pedidoId: number) => {
    socketService.leavePedido(pedidoId);
  }, []);

  return {
    isConnected: socketService.isConnected(),
    joinPedido,
    leavePedido,
  };
}

export function usePedidoRealtime(pedidoId: number, onUpdate: (pedido: unknown) => void) {
  useEffect(() => {
    socketService.connect();
    socketService.joinPedido(pedidoId);

    const unsub = socketService.onPedidoEstado((data) => {
      if (data.pedidoId === pedidoId) {
        onUpdate(data);
      }
    });

    return () => {
      unsub();
      socketService.leavePedido(pedidoId);
    };
  }, [pedidoId, onUpdate]);
}

export default useSocket;
