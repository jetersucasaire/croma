import { create } from 'zustand';
import { serviciosApi, disenosApi, materialesApi } from '../api/endpoints';
import type { Servicio, Diseno, Material } from '../types';

const serviciosDemo: Servicio[] = [
  { id: 1, nombre: 'TARJETAS PERSONALES', slug: 'tarjetas-personales', descripcion: 'Tarjetas de presentación personalizadas', icono: '💳', precioBase: 50, unidad: 'millar', pasos: 3, activo: true },
  { id: 2, nombre: 'LANYARDS', slug: 'lanyards', descripcion: 'Lanyards con diseño personalizado', icono: '🏷️', precioBase: 30, unidad: 'und', pasos: 3, activo: true },
  { id: 3, nombre: 'MENÚS', slug: 'menus', descripcion: 'Menús para restaurantes', icono: '📋', precioBase: 40, unidad: 'und', pasos: 3, activo: true },
  { id: 4, nombre: 'FOTOCHECK', slug: 'fotocheck', descripcion: 'Fotochecks para eventos', icono: '📛', precioBase: 25, unidad: 'und', pasos: 3, activo: true },
  { id: 5, nombre: 'IMPRESIONES', slug: 'impresiones', descripcion: 'Servicios de impresión digital', icono: '🖨️', precioBase: 10, unidad: 'und', pasos: 3, activo: true },
  { id: 6, nombre: 'EMPASTADOS', slug: 'empastados', descripcion: 'Encuadernación y empaste de documentos', icono: '📚', precioBase: 80, unidad: 'und', pasos: 3, activo: true },
  { id: 7, nombre: 'EDICIÓN DE AUDIO/VIDEO', slug: 'edicion-audio-video', descripcion: 'Edición profesional de multimedia', icono: '🎬', precioBase: 150, unidad: 'hora', pasos: 3, activo: true },
  { id: 8, nombre: 'DISEÑO DE LOGOS', slug: 'diseno-logos', descripcion: 'Diseño de identidad visual', icono: '🎨', precioBase: 200, unidad: 'proyecto', pasos: 3, activo: true },
  { id: 9, nombre: 'SELLOS PERSONALIZADOS', slug: 'sellos-personalizados', descripcion: 'Sellos grabados personalizados', icono: '🔴', precioBase: 60, unidad: 'und', pasos: 3, activo: true },
];

const disenosDemo: Diseno[] = [
  { id: 1, servicioId: 1, nombre: 'Tarjeta Clásica', dimensiones: { ancho: 9, alto: 5, unidad: 'cm' }, parametros: {} },
  { id: 2, servicioId: 1, nombre: 'Tarjeta Moderna', dimensiones: { ancho: 9, alto: 5, unidad: 'cm' }, parametros: {} },
  { id: 3, servicioId: 1, nombre: 'Tarjeta Premium', dimensiones: { ancho: 9, alto: 5, unidad: 'cm' }, parametros: {} },
  { id: 4, servicioId: 2, nombre: 'Lanyard Básico', dimensiones: { ancho: 2, alto: 45, unidad: 'cm' }, parametros: {} },
  { id: 5, servicioId: 2, nombre: 'Lanyard Corporativo', dimensiones: { ancho: 2, alto: 45, unidad: 'cm' }, parametros: {} },
  { id: 6, servicioId: 3, nombre: 'Menú Restaurante', dimensiones: { ancho: 15, alto: 21, unidad: 'cm' }, parametros: {} },
  { id: 7, servicioId: 4, nombre: 'Fotocheck Básico', dimensiones: { ancho: 5.4, alto: 8.6, unidad: 'cm' }, parametros: {} },
  { id: 8, servicioId: 4, nombre: 'Fotocheck VIP', dimensiones: { ancho: 5.4, alto: 8.6, unidad: 'cm' }, parametros: {} },
  { id: 9, servicioId: 5, nombre: 'A4 Blanco', dimensiones: { ancho: 21, alto: 29.7, unidad: 'cm' }, parametros: {} },
  { id: 10, servicioId: 5, nombre: 'A3 Color', dimensiones: { ancho: 29.7, alto: 42, unidad: 'cm' }, parametros: {} },
  { id: 11, servicioId: 6, nombre: 'Tapa Dura', dimensiones: { ancho: 21, alto: 29.7, unidad: 'cm' }, parametros: {} },
  { id: 12, servicioId: 6, nombre: 'Tapa Blanda', dimensiones: { ancho: 21, alto: 29.7, unidad: 'cm' }, parametros: {} },
  { id: 13, servicioId: 9, nombre: 'Sello Redondo', dimensiones: { ancho: 4, alto: 4, unidad: 'cm' }, parametros: {} },
  { id: 14, servicioId: 9, nombre: 'Sello Cuadrado', dimensiones: { ancho: 5, alto: 5, unidad: 'cm' }, parametros: {} },
];

const materialesDemo: Material[] = [
  { id: 1, servicioId: 1, nombre: 'Cartulina 300g', tipo: 'papel', precioUnitario: 45, stock: 10000, disponible: true },
  { id: 2, servicioId: 1, nombre: 'Papel Mate 250g', tipo: 'papel', precioUnitario: 35, stock: 8000, disponible: true },
  { id: 3, servicioId: 1, nombre: 'Papel Brilloso', tipo: 'papel', precioUnitario: 40, stock: 12000, disponible: true },
  { id: 4, servicioId: 2, nombre: 'Cinta Básica', tipo: 'cinta', precioUnitario: 5, stock: 5000, disponible: true },
  { id: 5, servicioId: 2, nombre: 'Cinta Premium', tipo: 'cinta', precioUnitario: 8, stock: 3000, disponible: true },
  { id: 6, servicioId: 4, nombre: 'Plastificado', tipo: 'plastico', precioUnitario: 2, stock: 20000, disponible: true },
  { id: 7, servicioId: 4, nombre: 'Mate', tipo: 'papel', precioUnitario: 1.5, stock: 15000, disponible: true },
  { id: 8, servicioId: 5, nombre: 'Papel Bond', tipo: 'papel', precioUnitario: 0.5, stock: 50000, disponible: true },
  { id: 9, servicioId: 5, nombre: 'Papel Couché', tipo: 'papel', precioUnitario: 1, stock: 30000, disponible: true },
  { id: 10, servicioId: 5, nombre: 'Adhesivo', tipo: 'papel', precioUnitario: 2, stock: 10000, disponible: true },
  { id: 11, servicioId: 6, nombre: 'Tapa Dura', tipo: 'tapa', precioUnitario: 25, stock: 500, disponible: true },
  { id: 12, servicioId: 6, nombre: 'Tapa Blanda', tipo: 'tapa', precioUnitario: 15, stock: 800, disponible: true },
  { id: 13, servicioId: 9, nombre: 'Goma Natural', tipo: 'goma', precioUnitario: 20, stock: 200, disponible: true },
  { id: 14, servicioId: 9, nombre: 'Goma Premium', tipo: 'goma', precioUnitario: 35, stock: 100, disponible: true },
];

interface CatalogoState {
  servicios: Servicio[];
  disenos: Diseno[];
  materiales: Material[];
  isLoading: boolean;
  error: string | null;

  cargarServicios: () => Promise<void>;
  cargarDisenos: (servicioId?: number) => Promise<void>;
  cargarMateriales: (servicioId?: number) => Promise<void>;
  cargarTodo: () => Promise<void>;

  getServiciosActivos: () => Servicio[];
  getDisenosPorServicio: (servicioId: number) => Diseno[];
  getMaterialesPorServicio: (servicioId: number) => Material[];
  getServicioBySlug: (slug: string) => Servicio | undefined;
}

export const useCatalogoStore = create<CatalogoState>((set, get) => ({
  servicios: serviciosDemo,
  disenos: disenosDemo,
  materiales: materialesDemo,
  isLoading: false,
  error: null,

  cargarServicios: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await serviciosApi.getAll({ activo: true });
      if (response.success && response.data) {
        set({ servicios: response.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.warn('Usando datos demo de servicios');
      set({ isLoading: false });
    }
  },

  cargarDisenos: async (servicioId?: number) => {
    try {
      const response = await disenosApi.getAll(servicioId);
      if (response.success && response.data) {
        set({ disenos: response.data });
      }
    } catch (error) {
      console.warn('Usando datos demo de diseños');
    }
  },

  cargarMateriales: async (servicioId?: number) => {
    try {
      const response = await materialesApi.getAll(servicioId);
      if (response.success && response.data) {
        set({ materiales: response.data });
      }
    } catch (error) {
      console.warn('Usando datos demo de materiales');
    }
  },

  cargarTodo: async () => {
    await Promise.all([
      get().cargarServicios(),
      get().cargarDisenos(),
      get().cargarMateriales(),
    ]);
  },

  getServiciosActivos: () => get().servicios.filter((s) => s.activo !== false),

  getDisenosPorServicio: (servicioId: number) =>
    get().disenos.filter((d) => d.servicioId === servicioId),

  getMaterialesPorServicio: (servicioId: number) =>
    get().materiales.filter((m) => m.servicioId === servicioId),

  getServicioBySlug: (slug: string) =>
    get().servicios.find((s) => s.slug === slug),
}));

export default useCatalogoStore;