import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Producto } from '../types';

interface CarritoItem extends Producto {
  cantidad: number;
  descripcion?: string;
}

interface CarritoContextType {
  items: CarritoItem[];
  agregarProducto: (producto:Producto) => void;
  eliminarProducto: (id:number) => void;
  actualizarCantidad: (id: number, cantidad: number) => void;
  vaciarCarrito: () => void;
  total: number;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export const CarritoProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CarritoItem[]>([]);

  const agregarProducto = (producto: Producto) => {
    setItems(prev => {
      const existe = prev.find(item => item.id === producto.id);
      if (existe) {
        return prev.map(item => 
          item.id === producto.id 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const eliminarProducto = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const actualizarCantidad = (id: number, cantidad: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, cantidad } : item
    ));
  };

  const vaciarCarrito = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  return (
    <CarritoContext.Provider value={{ items, agregarProducto, eliminarProducto, actualizarCantidad, vaciarCarrito, total }}>
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  return context;
};