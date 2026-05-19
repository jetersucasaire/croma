import { useState, useEffect } from 'react';
import type { Material } from '../../types';
import './PasoConfig.css';

interface ConfigSeleccionada {
  materialId?: number;
  material?: Material;
  cantidad: number;
  opciones?: Record<string, unknown>;
}

interface PasoConfigProps {
  materiales: Material[];
  onSeleccionar: (config: ConfigSeleccionada) => void;
  seleccionActual: ConfigSeleccionada | null;
}

export const PasoConfig = ({ materiales, onSeleccionar, seleccionActual }: PasoConfigProps) => {
  const [materialId, setMaterialId] = useState<number>(seleccionActual?.materialId || 0);
  const [cantidad, setCantidad] = useState<number>(seleccionActual?.cantidad || 1);
  const [materialSeleccionado, setMaterialSeleccionado] = useState<Material | undefined>(
    seleccionActual?.material
  );

  useEffect(() => {
    if (materialId > 0) {
      const mat = materiales.find(m => m.id === materialId);
      if (mat) {
        setMaterialSeleccionado(mat);
      }
    }
  }, [materialId]);

  const handleMaterialChange = (id: number) => {
    setMaterialId(id);
    const mat = materiales.find(m => m.id === id);
    if (mat) {
      setMaterialSeleccionado(mat);
      onSeleccionar({
        materialId: id,
        material: mat,
        cantidad: cantidad,
      });
    }
  };

  const handleCantidadChange = (cant: number) => {
    setCantidad(cant);
    if (materialSeleccionado) {
      onSeleccionar({
        materialId: materialId,
        material: materialSeleccionado,
        cantidad: cant,
      });
    }
  };

  const materialesDisponibles = materiales.filter(m => m.disponible !== false);

  const calcularSubtotal = () => {
    if (!materialSeleccionado) return 0;
    return materialSeleccionado.precioUnitario * cantidad;
  };

  const stockSuficiente = materialSeleccionado ? cantidad <= materialSeleccionado.stock : true;

  return (
    <div className="paso-config">
      <h2>Paso 2: Configuración</h2>
      <p className="paso-desc">Selecciona el material y cantidad</p>

      <div className="config-section">
        <label className="config-label">Material</label>
        <div className="materiales-list">
          {materialesDisponibles.length === 0 ? (
            <p className="no-materiales">No hay materiales disponibles</p>
          ) : (
            materialesDisponibles.map((mat) => (
              <div
                key={mat.id}
                className={`material-card ${materialId === mat.id ? 'selected' : ''}`}
                onClick={() => handleMaterialChange(mat.id)}
              >
                <div className="material-info">
                  <h3>{mat.nombre}</h3>
                  <p className="material-tipo">{mat.tipo}</p>
                </div>
                <div className="material-precio">
                  <span className="precio">S/ {mat.precioUnitario.toFixed(2)}</span>
                  <span className="stock">Stock: {mat.stock}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="config-section">
        <label className="config-label">Cantidad</label>
        <div className="cantidad-input">
          <button
            className="cantidad-btn"
            onClick={() => handleCantidadChange(Math.max(1, cantidad - 1))}
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => handleCantidadChange(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <button
            className="cantidad-btn"
            onClick={() => handleCantidadChange(cantidad + 1)}
          >
            +
          </button>
        </div>
        {!stockSuficiente && (
          <p className="error-stock">Cantidad excede el stock disponible</p>
        )}
      </div>

      <div className="config-total">
        <div className="total-breakdown">
          <div className="total-row">
            <span>Precio unitario:</span>
            <span>S/ {materialSeleccionado?.precioUnitario.toFixed(2) || '0.00'}</span>
          </div>
          <div className="total-row">
            <span>Cantidad:</span>
            <span>{cantidad}</span>
          </div>
          <div className="total-row total-final">
            <span>Total:</span>
            <span>S/ {calcularSubtotal().toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};