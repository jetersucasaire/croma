import { create } from 'zustand';
import { notificacionesApi } from '../api/endpoints';

export interface NotificacionItem {
  id: number;
  titulo: string;
  mensaje: string;
  tipo?: string;
  referenciaId?: number;
  leido: boolean;
  createdAt: string;
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
}

interface NotificacionState {
  notificaciones: NotificacionItem[];
  sinLeer: number;
  isLoading: boolean;

  cargarNotificaciones: () => Promise<void>;
  cargarSinLeer: () => Promise<void>;
  marcarLeida: (id: number) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  agregarNotificacion: (notificacion: NotificacionItem) => void;
}

export const useNotificacionStore = create<NotificacionState>((set, get) => ({
  notificaciones: [],
  sinLeer: 0,
  isLoading: false,

  cargarNotificaciones: async () => {
    set({ isLoading: true });
    try {
      const response = await notificacionesApi.getAll();
      if (response.success && response.data) {
        set({ notificaciones: response.data as NotificacionItem[] });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  cargarSinLeer: async () => {
    try {
      const response = await notificacionesApi.getSinLeer();
      if (response.success && response.data) {
        set({ sinLeer: response.data.count });
      }
    } catch (error) { console.error(error); }
  },

  marcarLeida: async (id: number) => {
    try {
      await notificacionesApi.marcarLeida(id);
      set((state) => ({
        notificaciones: state.notificaciones.map((n) => n.id === id ? { ...n, leido: true } : n),
        sinLeer: Math.max(0, state.sinLeer - 1),
      }));
    } catch (error) { console.error(error); }
  },

  marcarTodasLeidas: async () => {
    try {
      await notificacionesApi.marcarTodasLeidas();
      set((state) => ({
        notificaciones: state.notificaciones.map((n) => ({ ...n, leido: true })),
        sinLeer: 0,
      }));
    } catch (error) { console.error(error); }
  },

  agregarNotificacion: (notificacion: NotificacionItem) => {
    set((state) => {
      const yaExiste = state.notificaciones.some((n) => n.id === notificacion.id);
      if (yaExiste) return state;
      return {
        notificaciones: [notificacion, ...state.notificaciones].slice(0, 50),
        sinLeer: state.sinLeer + 1,
      };
    });
  },
}));

export default useNotificacionStore;