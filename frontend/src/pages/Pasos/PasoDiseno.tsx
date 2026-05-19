import { useState } from 'react';
import type { Diseno } from '../../types';
import './PasoDiseno.css';

interface DisenoSeleccionado {
  disenoId?: number;
  diseno?: Diseno;
  archivoUrl?: string;
  archivoNombre?: string;
  tipoCarga: 'catalogo' | 'archivo' | 'externo';
  enlaceExterno?: string;
}

interface PasoDisenoProps {
  disenos: Diseno[];
  onSeleccionar: (diseno: DisenoSeleccionado) => void;
  seleccionActual: DisenoSeleccionado | null;
}

export const PasoDiseno = ({ disenos, onSeleccionar, seleccionActual }: PasoDisenoProps) => {
  const [tipoCarga, setTipoCarga] = useState<'catalogo' | 'archivo' | 'externo'>(
    seleccionActual?.tipoCarga || 'catalogo'
  );
  const [archivoNombre, setArchivoNombre] = useState(seleccionActual?.archivoNombre || '');
  const [enlaceExterno, setEnlaceExterno] = useState(seleccionActual?.enlaceExterno || '');

  const handleSeleccionarDiseno = (diseno: Diseno) => {
    onSeleccionar({
      disenoId: diseno.id,
      diseno: diseno,
      tipoCarga: 'catalogo',
    });
  };

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoNombre(file.name);
      onSeleccionar({
        archivoUrl: URL.createObjectURL(file),
        archivoNombre: file.name,
        tipoCarga: 'archivo',
      });
    }
  };

  const handleEnlaceChange = () => {
    if (enlaceExterno) {
      onSeleccionar({
        enlaceExterno: enlaceExterno,
        tipoCarga: 'externo',
      });
    }
  };

  return (
    <div className="paso-diseno">
      <h2>Paso 1: Selección de Diseño</h2>
      <p className="paso-desc">Elige un diseño del catálogo o carga tu propio archivo</p>

      <div className="opciones-carga">
        <button
          className={`opcion-btn ${tipoCarga === 'catalogo' ? 'active' : ''}`}
          onClick={() => setTipoCarga('catalogo')}
        >
          Catálogo
        </button>
        <button
          className={`opcion-btn ${tipoCarga === 'archivo' ? 'active' : ''}`}
          onClick={() => setTipoCarga('archivo')}
        >
          Cargar Archivo
        </button>
        <button
          className={`opcion-btn ${tipoCarga === 'externo' ? 'active' : ''}`}
          onClick={() => setTipoCarga('externo')}
        >
          Enlace Externo
        </button>
      </div>

      {tipoCarga === 'catalogo' && (
        <div className="catalogo-disenos">
          {disenos.length === 0 ? (
            <p className="no-disenos">No hay diseños disponibles en el catálogo</p>
          ) : (
            <div className="disenos-grid">
              {disenos.map((diseno) => (
                <div
                  key={diseno.id}
                  className={`diseno-card ${seleccionActual?.disenoId === diseno.id ? 'selected' : ''}`}
                  onClick={() => handleSeleccionarDiseno(diseno)}
                >
                  <div className="diseno-preview">[IMG]</div>
                  <h3>{diseno.nombre}</h3>
                  <p>{diseno.dimensiones.ancho}x{diseno.dimensiones.alto} {diseno.dimensiones.unidad}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tipoCarga === 'archivo' && (
        <div className="carga-archivo">
          <div className="upload-zone">
            <input
              type="file"
              id="archivo"
              accept=".pdf,.ai,.jpg,.jpeg,.png,.svg"
              onChange={handleArchivoChange}
            />
            <label htmlFor="archivo" className="upload-label">
              <span className="upload-icon">📁</span>
              <span>Haz clic para subir un archivo</span>
              <span className="upload-formats">PDF, AI, JPG, PNG, SVG (max 50MB)</span>
            </label>
          </div>
          {archivoNombre && (
            <div className="archivo-seleccionado">
              <span>✓</span> {archivoNombre}
            </div>
          )}
        </div>
      )}

      {tipoCarga === 'externo' && (
        <div className="enlace-externo">
          <label>
            Ingresa el enlace externo (Google Drive, WeTransfer, etc.)
            <input
              type="url"
              placeholder="https://..."
              value={enlaceExterno}
              onChange={(e) => setEnlaceExterno(e.target.value)}
            />
          </label>
          <button className="btn-validar" onClick={handleEnlaceChange}>
            Validar Enlace
          </button>
        </div>
      )}
    </div>
  );
};