import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wizardApi } from '../api/endpoints';
import { config } from '../config';

type FaseWizard = 'diseño' | 'configuracion' | 'produccion' | 'completado';

interface PedidoEnCurso {
  servicio: { id: number; slug: string; nombre: string; icono: string };
  fase: FaseWizard;
  diseno: { disenoId?: number; diseno?: any; archivoUrl?: string; archivoNombre?: string; tipoCarga: string } | null;
  configuracion: { material: any; cantidad: number; precioUnitario: number };
  archivo: { nombre: string; url: string; tamaño: number; formato: string } | null;
}

interface PedidoState {
  pedidoEnCurso: PedidoEnCurso | null;
  misPedidos: any[];
  isLoading: boolean;
  error: string | null;

  iniciarPedido: (servicio: any) => void;
  setDiseno: (diseno: any) => void;
  setArchivo: (archivo: any) => void;
  setMaterial: (material: any, cantidad: number, precioUnitario: number) => void;
  avanzarFase: () => void;
  retrocederFase: () => void;
  confirmarPedido: () => Promise<any | null>;
  cancelarPedido: () => void;
  cargarMisPedidos: () => Promise<void>;
  getPedidoById: (id: number) => Promise<any | null>;
  actualizarPedidoLocal: (pedido: any) => void;
}

export const usePedidoStore = create<PedidoState>()(
  persist(
    (set, get) => ({
      pedidoEnCurso: null,
      misPedidos: [],
      isLoading: false,
      error: null,

      iniciarPedido: (servicio: any) => {
        set({
          pedidoEnCurso: {
            servicio,
            fase: 'diseño',
            diseno: null,
            configuracion: { material: null, cantidad: 1, precioUnitario: 0 },
            archivo: null,
          },
        });
      },

      setDiseno: (diseno: any) => {
        set((state) => ({
          pedidoEnCurso: state.pedidoEnCurso ? { ...state.pedidoEnCurso, diseno } : null,
        }));
      },

      setArchivo: (archivo: any) => {
        set((state) => ({
          pedidoEnCurso: state.pedidoEnCurso ? { ...state.pedidoEnCurso, archivo } : null,
        }));
      },

      setMaterial: (material: any, cantidad: number, precioUnitario: number) => {
        set((state) => ({
          pedidoEnCurso: state.pedidoEnCurso
            ? { ...state.pedidoEnCurso, configuracion: { material, cantidad, precioUnitario } }
            : null,
        }));
      },

      avanzarFase: () => {
        const secuencia: FaseWizard[] = ['diseño', 'configuracion', 'produccion', 'completado'];
        set((state) => {
          if (!state.pedidoEnCurso) return state;
          const idx = secuencia.indexOf(state.pedidoEnCurso.fase);
          if (idx >= secuencia.length - 1) return state;
          return { pedidoEnCurso: { ...state.pedidoEnCurso, fase: secuencia[idx + 1] } };
        });
      },

      retrocederFase: () => {
        const secuencia: FaseWizard[] = ['diseño', 'configuracion', 'produccion', 'completado'];
        set((state) => {
          if (!state.pedidoEnCurso) return state;
          const idx = secuencia.indexOf(state.pedidoEnCurso.fase);
          if (idx <= 0) return state;
          return { pedidoEnCurso: { ...state.pedidoEnCurso, fase: secuencia[idx - 1] } };
        });
      },

      confirmarPedido: async () => {
        const { pedidoEnCurso } = get();
        if (!pedidoEnCurso) return null;
        
        set({ isLoading: true, error: null });
        
        try {
          const disenoData = pedidoEnCurso.diseno || {};
          const configData = {
            materialId: pedidoEnCurso.configuracion.material?.id,
            cantidad: pedidoEnCurso.configuracion.cantidad,
            precioUnitario: pedidoEnCurso.configuracion.precioUnitario,
          };

          const response = await wizardApi.crearPedido(pedidoEnCurso.servicio.slug, disenoData, configData);

          if (response.success && response.data) {
            set((state) => ({
              pedidoEnCurso: null,
              misPedidos: [response.data, ...state.misPedidos],
              isLoading: false,
            }));
            return response.data;
          }
          set({ error: response.mensaje || 'Error', isLoading: false });
          return null;
        } catch (err: any) {
          set({ error: err.message || 'Error', isLoading: false });
          return null;
        }
      },

      cancelarPedido: () => set({ pedidoEnCurso: null }),

      cargarMisPedidos: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await wizardApi.getPedidos();
          if (response.success && response.data) {
            set({ misPedidos: response.data, isLoading: false });
          } else {
            set({ error: response.mensaje, isLoading: false });
          }
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      getPedidoById: async (id: number) => {
        try {
          const response = await wizardApi.getPedido(id);
          return response.success ? response.data : null;
        } catch { return null; }
      },

      actualizarPedidoLocal: (pedido: any) => {
        set((state) => ({
          misPedidos: state.misPedidos.map((p: any) => p.id === pedido.id ? pedido : p),
        }));
      },
    }),
    { name: config.storage.keys.wizardProgress }
  )
);

export default usePedidoStore;