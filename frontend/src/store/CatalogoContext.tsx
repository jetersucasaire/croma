import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { Servicio, Diseno, Material, Archivo, Pedido } from '../types';

const serviciosDemo: Servicio[] = [
  { id: 1, nombre: 'TARJETAS PERSONALES', descripcion: 'Tarjetas de presentación personalizadas', icono: '💳', precioBase: 50, unidad: 'millar', pasos: 3 },
  { id: 2, nombre: 'LANYARDS', descripcion: 'Lanyards con diseño personalizado', icono: '🏷️', precioBase: 30, unidad: 'und', pasos: 3 },
  { id: 3, nombre: 'MENÚS', descripcion: 'Menús para restaurantes', icono: '📋', precioBase: 40, unidad: 'und', pasos: 3 },
  { id: 4, nombre: 'FOTOCHECK', descripcion: 'Fotochecks para eventos', icono: '📛', precioBase: 25, unidad: 'und', pasos: 3 },
  { id: 5, nombre: 'IMPRESIONES', descripcion: 'Servicios de impresión digital', icono: '🖨️', precioBase: 10, unidad: 'und', pasos: 3 },
  { id: 6, nombre: 'EMPASTADOS', descripcion: 'Encuadernación y empaste de documentos', icono: '📚', precioBase: 80, unidad: 'und', pasos: 3 },
  { id: 7, nombre: 'EDICIÓN DE AUDIO/VIDEO', descripcion: 'Edición profesional de multimedia', icono: '🎬', precioBase: 150, unidad: 'hora', pasos: 3 },
  { id: 8, nombre: 'DISEÑO DE LOGOS', descripcion: 'Diseño de identidad visual', icono: '🎨', precioBase: 200, unidad: 'proyecto', pasos: 3 },
  { id: 9, nombre: 'SELLOS PERSONALIZADOS', descripcion: 'Sellos grabados personalizados', icono: '🔴', precioBase: 60, unidad: 'und', pasos: 3 },
];

const disenosDemo: Diseno[] = [
  { id: 1, servicioId: 1, nombre: 'Tarjeta Clásica', imagen: '', dimensiones: { ancho: 9, alto: 5, unidad: 'cm' }, parametros: {} },
  { id: 2, servicioId: 1, nombre: 'Tarjeta Moderna', imagen: '', dimensiones: { ancho: 9, alto: 5, unidad: 'cm' }, parametros: {} },
  { id: 3, servicioId: 1, nombre: 'Tarjeta Premium', imagen: '', dimensiones: { ancho: 9, alto: 5, unidad: 'cm' }, parametros: {} },
  { id: 4, servicioId: 2, nombre: 'Lanyard Básico', imagen: '', dimensiones: { ancho: 2, alto: 45, unidad: 'cm' }, parametros: {} },
  { id: 5, servicioId: 2, nombre: 'Lanyard Corporativo', imagen: '', dimensiones: { ancho: 2, alto: 45, unidad: 'cm' }, parametros: {} },
  { id: 6, servicioId: 3, nombre: 'Menú Restaurante', imagen: '', dimensiones: { ancho: 15, alto: 21, unidad: 'cm' }, parametros: {} },
  { id: 7, servicioId: 4, nombre: 'Fotocheck Básico', imagen: '', dimensiones: { ancho: 5.4, alto: 8.6, unidad: 'cm' }, parametros: {} },
  { id: 8, servicioId: 4, nombre: 'Fotocheck VIP', imagen: '', dimensiones: { ancho: 5.4, alto: 8.6, unidad: 'cm' }, parametros: {} },
  { id: 9, servicioId: 5, nombre: 'A4 Blanco', imagen: '', dimensiones: { ancho: 21, alto: 29.7, unidad: 'cm' }, parametros: {} },
  { id: 10, servicioId: 5, nombre: 'A3 Color', imagen: '', dimensiones: { ancho: 29.7, alto: 42, unidad: 'cm' }, parametros: {} },
  { id: 11, servicioId: 6, nombre: 'Tapa Dura', imagen: '', dimensiones: { ancho: 21, alto: 29.7, unidad: 'cm' }, parametros: {} },
  { id: 12, servicioId: 6, nombre: 'Tapa Blanda', imagen: '', dimensiones: { ancho: 21, alto: 29.7, unidad: 'cm' }, parametros: {} },
  { id: 13, servicioId: 9, nombre: 'Sello Redondo', imagen: '', dimensiones: { ancho: 4, alto: 4, unidad: 'cm' }, parametros: {} },
  { id: 14, servicioId: 9, nombre: 'Sello Cuadrado', imagen: '', dimensiones: { ancho: 5, alto: 5, unidad: 'cm' }, parametros: {} },
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

const misPedidosDemo: Pedido[] = [];

interface CatalogoContextType {
  servicios: Servicio[];
  disenos: Diseno[];
  materiales: Material[];
  archivos: Archivo[];
  pedidos: Pedido[];
  disenosPorServicio: (servicioId: number) => Diseno[];
  materialesPorServicio: (servicioId: number) => Material[];
  agregarDiseno: (diseno: Diseno) => void;
  actualizarDiseno: (diseno: Diseno) => void;
  eliminarDiseno: (id: number) => void;
  agregarMaterial: (material: Material) => void;
  actualizarMaterial: (material: Material) => void;
  eliminarMaterial: (id: number) => void;
  agregarArchivo: (archivo: Archivo) => void;
  eliminarArchivo: (id: number) => void;
  agregarPedido: (pedido: Pedido) => void;
  actualizarPedido: (pedido: Pedido) => void;
  getPedidoById: (id: number) => Pedido | undefined;
}

const CatalogoContext = createContext<CatalogoContextType | undefined>(undefined);

export const CatalogoProvider = ({ children }: { children: ReactNode }) => {
  const [servicios] = useState<Servicio[]>(serviciosDemo);
  const [disenos, setDisenos] = useState<Diseno[]>(disenosDemo);
  const [materiales, setMateriales] = useState<Material[]>(materialesDemo);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>(misPedidosDemo);

  const disenosPorServicio = useMemo(
    () => (servicioId: number): Diseno[] => disenos.filter(d => d.servicioId === servicioId),
    [disenos]
  );

  const materialesPorServicio = useMemo(
    () => (servicioId: number): Material[] => materiales.filter(m => m.servicioId === servicioId),
    [materiales]
  );

  const getPedidoById = useMemo(
    () => (id: number): Pedido | undefined => pedidos.find(p => p.id === id),
    [pedidos]
  );

  const value = useMemo(() => ({
    servicios,
    disenos,
    materiales,
    archivos,
    pedidos,
    disenosPorServicio,
    materialesPorServicio,
    agregarDiseno: (diseno: Diseno) => setDisenos(prev => [...prev, { ...diseno, id: Date.now() }]),
    actualizarDiseno: (diseno: Diseno) => setDisenos(prev => prev.map(d => d.id === diseno.id ? diseno : d)),
    eliminarDiseno: (id: number) => setDisenos(prev => prev.filter(d => d.id !== id)),
    agregarMaterial: (material: Material) => setMateriales(prev => [...prev, { ...material, id: Date.now() }]),
    actualizarMaterial: (material: Material) => setMateriales(prev => prev.map(m => m.id === material.id ? material : m)),
    eliminarMaterial: (id: number) => setMateriales(prev => prev.filter(m => m.id !== id)),
    agregarArchivo: (archivo: Archivo) => setArchivos(prev => [...prev, { ...archivo, id: Date.now() }]),
    eliminarArchivo: (id: number) => setArchivos(prev => prev.filter(a => a.id !== id)),
    agregarPedido: (pedido: Pedido) => setPedidos(prev => [...prev, pedido]),
    actualizarPedido: (pedido: Pedido) => setPedidos(prev => prev.map(p => p.id === pedido.id ? pedido : p)),
    getPedidoById,
  }), [servicios, disenos, materiales, archivos, pedidos, disenosPorServicio, materialesPorServicio, getPedidoById]);

  return (
    <CatalogoContext.Provider value={value}>
      {children}
    </CatalogoContext.Provider>
  );
};

export const useCatalogo = () => {
  const context = useContext(CatalogoContext);
  if (!context) {
    throw new Error('useCatalogo debe usarse dentro de CatalogoProvider');
  }
  return context;
};