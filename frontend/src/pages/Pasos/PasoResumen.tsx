import type { Servicio, Diseno, Material } from '../../types';
import './PasoResumen.css';

interface DisenoSeleccionado {
  disenoId?: number;
  diseno?: Diseno;
  archivoUrl?: string;
  archivoNombre?: string;
  tipoCarga: 'catalogo' | 'archivo' | 'externo';
  enlaceExterno?: string;
}

interface ConfigSeleccionada {
  materialId?: number;
  material?: Material;
  cantidad: number;
  opciones?: Record<string, unknown>;
}

interface PasoResumenProps {
  servicio: Servicio;
  diseno: DisenoSeleccionado | null;
  config: ConfigSeleccionada | null;
  total: number;
}

export const PasoResumen = ({ servicio, diseno, config, total }: PasoResumenProps) => {
  return (
    <div className="paso-resumen">
      <h2>Paso 3: Resumen del Pedido</h2>
      <p className="paso-desc">Revisa los detalles antes de confirmar</p>

      <div className="resumen-card">
        <div className="resumen-seccion">
          <h3>Servicio</h3>
          <div className="resumen-item">
            <span className="item-icon">{servicio.icono}</span>
            <span className="item-value">{servicio.nombre}</span>
          </div>
        </div>

        <div className="resumen-seccion">
          <h3>Diseño</h3>
          {diseno?.tipoCarga === 'catalogo' && diseno.diseno && (
            <div className="resumen-item">
              <span>Diseño:</span>
              <span>{diseno.diseno.nombre}</span>
            </div>
          )}
          {diseno?.tipoCarga === 'catalogo' && diseno.diseno && (
            <div className="resumen-item">
              <span>Dimensiones:</span>
              <span>
                {diseno.diseno.dimensiones.ancho}x{diseno.diseno.dimensiones.alto}{' '}
                {diseno.diseno.dimensiones.unidad}
              </span>
            </div>
          )}
          {diseno?.tipoCarga === 'archivo' && diseno.archivoNombre && (
            <div className="resumen-item">
              <span>Archivo:</span>
              <span>{diseno.archivoNombre}</span>
            </div>
          )}
          {diseno?.tipoCarga === 'externo' && diseno.enlaceExterno && (
            <div className="resumen-item">
              <span>Enlace externo:</span>
              <span className="enlace">{diseno.enlaceExterno}</span>
            </div>
          )}
        </div>

        <div className="resumen-seccion">
          <h3>Configuración</h3>
          {config?.material && (
            <div className="resumen-item">
              <span>Material:</span>
              <span>{config.material.nombre}</span>
            </div>
          )}
          {config?.material && (
            <div className="resumen-item">
              <span>Tipo:</span>
              <span>{config.material.tipo}</span>
            </div>
          )}
          <div className="resumen-item">
            <span>Cantidad:</span>
            <span>{config?.cantidad || 0}</span>
          </div>
          {config?.material && (
            <div className="resumen-item">
              <span>Precio unitario:</span>
              <span>S/ {config.material.precioUnitario.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="resumen-total">
          <span>Total a pagar:</span>
          <span className="total-amount">S/ {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="resumen-nota">
        <p>
          <strong>Nota:</strong> Al confirmar tu pedido, recibirás un correo con el
          seguimiento y podrás ver el estado en tu perfil.
        </p>
      </div>
    </div>
  );
};