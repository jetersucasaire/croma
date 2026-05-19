import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Producto } from '../types';
import { config } from '../config';

interface CarritoItem extends Producto {
  cantidad: number;
}

interface CarritoState {
  items: CarritoItem[];
  agregarProducto: (producto: Producto) => void;
  eliminarProducto: (id: number) => void;
  actualizarCantidad: (id: number, cantidad: number) => void;
  vaciarCarrito: () => void;
  total: number;
  cantidadTotal: number;
}

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set, get) => ({
      items: [],

      agregarProducto: (producto: Producto) => {
        set((state) => {
          const existe = state.items.find((item) => item.id === producto.id);
          
          if (existe) {
            return {
              items: state.items.map((item) =>
                item.id === producto.id
                  ? { ...item, cantidad: item.cantidad + 1 }
                  : item
              ),
            };
          }
          
          return {
            items: [...state.items, { ...producto, cantidad: 1 }],
          };
        });
      },

      eliminarProducto: (id: number) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      actualizarCantidad: (id: number, cantidad: number) => {
        if (cantidad < 1) {
          get().eliminarProducto(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, cantidad } : item
          ),
        }));
      },

      vaciarCarrito: () => set({ items: [] }),

      get total() {
        return get().items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
      },

      get cantidadTotal() {
        return get().items.reduce((sum, item) => sum + item.cantidad, 0);
      },
    }),
    {
      name: config.storage.keys.cart,
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state && console.log('Carrito hidratado desde localStorage');
      },
    }
  )
);

export default useCarritoStore;