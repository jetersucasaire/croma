import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Pedido, Servicio, Diseno, Material, FaseWizard, EstadoProduccion } from '../types';

interface DisenoSeleccionado {
  disenoId?: number;
  diseno?: Diseno;
  archivoUrl?: string;
  archivoNombre?: string;
  tipoCarga: 'catalogo' | 'archivo' | 'externo';
  enlaceExterno?: string;
}

interface ConfiguracionSeleccionada {
  materialId?: number;
  material?: Material;
  cantidad: number;
  opciones?: Record<string, unknown>;
}

interface PedidoContextType {
  pedidoEnCurso: Pedido | null;
  servicioActual: Servicio | null;
  faseActual: FaseWizard;
  disenoSeleccionado: DisenoSeleccionado | null;
  configuracionSeleccionada: ConfiguracionSeleccionada | null;
  iniciarPedido: (servicio: Servicio) => void;
  establecerDiseno: (diseno: DisenoSeleccionado) => void;
  establecerConfiguracion: (config: ConfiguracionSeleccionada) => void;
  avanzarFase: () => void;
  retrocederFase: () => void;
  calcularTotal: () => number;
  confirmarPedido: () => Pedido | null;
  cancelarPedido: () => void;
  setEstadoProduccion: (estado: EstadoProduccion) => void;
}

const PedidoContext = createContext<PedidoContextType | undefined>(undefined);

export const PedidoProvider = ({ children }: { children: ReactNode }) => {
  const [pedidoEnCurso, setPedidoEnCurso] = useState<Pedido | null>(null);
  const [servicioActual, setServicioActual] = useState<Servicio | null>(null);
  const [faseActual, setFaseActual] = useState<FaseWizard>('diseño');
  const [disenoSeleccionado, setDisenoSeleccionado] = useState<DisenoSeleccionado | null>(null);
  const [configuracionSeleccionada, setConfiguracionSeleccionada] = useState<ConfiguracionSeleccionada | null>(null);

  const iniciarPedido = (servicio: Servicio) => {
    const nuevoPedido: Pedido = {
      id: Date.now(),
      usuarioId: 1,
      servicioId: servicio.id,
      servicio: servicio,
      fase: 'diseño',
      estadoProduccion: 'pendiente',
      diseño: {
        tipoCarga: 'catalogo',
      },
      configuracion: {
        cantidad: 1,
      },
      total: 0,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };
    setServicioActual(servicio);
    setPedidoEnCurso(nuevoPedido);
    setFaseActual('diseño');
    setDisenoSeleccionado(null);
    setConfiguracionSeleccionada(null);
  };

  const establecerDiseno = (diseno: DisenoSeleccionado) => {
    setDisenoSeleccionado(diseno);
    if (pedidoEnCurso) {
      setPedidoEnCurso({
        ...pedidoEnCurso,
        diseño: diseno,
        fechaActualizacion: new Date().toISOString(),
      });
    }
  };

  const establecerConfiguracion = (config: ConfiguracionSeleccionada) => {
    setConfiguracionSeleccionada(config);
    if (pedidoEnCurso) {
      setPedidoEnCurso({
        ...pedidoEnCurso,
        configuracion: config,
        fechaActualizacion: new Date().toISOString(),
      });
    }
  };

  const calcularTotal = (): number => {
    if (!configuracionSeleccionada || !configuracionSeleccionada.material) return 0;
    return configuracionSeleccionada.cantidad * configuracionSeleccionada.material.precioUnitario;
  };

  const avanzarFase = () => {
    const secuencia: FaseWizard[] = ['diseño', 'configuracion', 'produccion', 'completado'];
    const indiceActual = secuencia.indexOf(faseActual);
    if (indiceActual < secuencia.length - 1) {
      const nuevaFase = secuencia[indiceActual + 1];
      setFaseActual(nuevaFase);
      if (pedidoEnCurso) {
        setPedidoEnCurso({
          ...pedidoEnCurso,
          fase: nuevaFase,
          fechaActualizacion: new Date().toISOString(),
        });
      }
    }
  };

  const retrocederFase = () => {
    const secuencia: FaseWizard[] = ['diseño', 'configuracion', 'produccion', 'completado'];
    const indiceActual = secuencia.indexOf(faseActual);
    if (indiceActual > 0) {
      const nuevaFase = secuencia[indiceActual - 1];
      setFaseActual(nuevaFase);
      if (pedidoEnCurso) {
        setPedidoEnCurso({
          ...pedidoEnCurso,
          fase: nuevaFase,
          fechaActualizacion: new Date().toISOString(),
        });
      }
    }
  };

  const confirmarPedido = (): Pedido | null => {
    if (!pedidoEnCurso || !disenoSeleccionado || !configuracionSeleccionada) return null;
    
    const total = calcularTotal();
    const pedidoConfirmado: Pedido = {
      ...pedidoEnCurso,
      fase: 'produccion',
      estadoProduccion: 'pendiente',
      total: total,
      trackingId: `CROMA-${pedidoEnCurso.id}`,
      fechaActualizacion: new Date().toISOString(),
    };
    
    setPedidoEnCurso(pedidoConfirmado);
    return pedidoConfirmado;
  };

  const cancelarPedido = () => {
    setPedidoEnCurso(null);
    setServicioActual(null);
    setFaseActual('diseño');
    setDisenoSeleccionado(null);
    setConfiguracionSeleccionada(null);
  };

  const setEstadoProduccion = (estado: EstadoProduccion) => {
    if (pedidoEnCurso) {
      setPedidoEnCurso({
        ...pedidoEnCurso,
        estadoProduccion: estado,
        fechaActualizacion: new Date().toISOString(),
      });
    }
  };

  return (
    <PedidoContext.Provider
      value={{
        pedidoEnCurso,
        servicioActual,
        faseActual,
        disenoSeleccionado,
        configuracionSeleccionada,
        iniciarPedido,
        establecerDiseno,
        establecerConfiguracion,
        avanzarFase,
        retrocederFase,
        calcularTotal,
        confirmarPedido,
        cancelarPedido,
        setEstadoProduccion,
      }}
    >
      {children}
    </PedidoContext.Provider>
  );
};

export const usePedido = () => {
  const context = useContext(PedidoContext);
  if (!context) {
    throw new Error('usePedido debe usarse dentro de PedidoProvider');
  }
  return context;
};