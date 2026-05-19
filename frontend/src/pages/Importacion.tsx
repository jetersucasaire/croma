import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../api/clienteAxios';
import { Button, Spinner } from '../components/ui';
import './Importacion.css';

interface ImportacionProps {
  type?: 'pedidos' | 'productos' | 'clientes';
}

interface ImportResult {
  exitosos: number;
  errores: string[];
  total: number;
}

export const Importacion = ({ type = 'pedidos' }: ImportacionProps) => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        setFile(selectedFile);
        setResult(null);
      }
    }
  };

  const isValidFile = (f: File): boolean => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      alert('Por favor seleccione un archivo Excel (.xlsx, .xls) o CSV');
      return false;
    }
    if (f.size > 10 * 1024 * 1024) {
      alert('El archivo excede el límite de 10MB');
      return false;
    }
    return true;
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('archivo', file);

      const response = await request('/importacion/pedidos', {
        method: 'POST',
        data: formData,
      });

      if (response.success) {
        setResult({
          exitosos: response.registros_exitosos || 0,
          errores: response.errores || [],
          total: response.total_procesado || 0,
        });
      } else {
        alert(response.mensaje || 'Error al importar');
      }
    } catch (err: any) {
      console.error('Error:', err);
      alert('Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templates: Record<string, string[]> = {
      pedidos: ['Nombre,Email,Teléfono,Servicio,Cantidad,Notas'],
      productos: ['Nombre,Precio,Stock,Categoría,Descripción'],
      clientes: ['Nombre,Email,Teléfono,Dirección'],
    };

    const csvContent = templates[type]?.join('\n') || '';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plantilla_${type}.csv`;
    link.click();
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'pedidos': return 'Pedidos';
      case 'productos': return 'Productos';
      case 'clientes': return 'Clientes';
      default: return 'Registros';
    }
  };

  return (
    <div className="importacion-page">
      <header className="importacion-header">
        <Button variant="ghost" onClick={() => navigate('/admin')}>
          ← Volver al Admin
        </Button>
        <h1>Importar {getTypeLabel()}</h1>
      </header>

      <main className="importacion-content">
        <div className="import-section">
          <div className="instructions">
            <h3>Instrucciones</h3>
            <ol>
              <li>Descargue la plantilla CSV para el formato correcto</li>
              <li>Complete los datos en el archivo siguiendo las columnas</li>
              <li>Suba el archivo completado</li>
              <li>Revise los resultados de la importación</li>
            </ol>
          </div>

          <Button variant="outline" onClick={downloadTemplate} className="download-btn">
            📥 Descargar Plantilla
          </Button>
        </div>

        <div 
          className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            id="file-upload" 
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="file-input"
          />
          
          {!file ? (
            <label htmlFor="file-upload" className="drop-label">
              <span className="drop-icon">📁</span>
              <span className="drop-text">
                Arrastre su archivo aquí o haga clic para seleccionar
              </span>
              <span className="drop-formats">
                Formatos permitidos: .xlsx, .xls, .csv (máx 10MB)
              </span>
            </label>
          ) : (
            <div className="file-selected">
              <span className="file-icon">📄</span>
              <span className="file-name">{file.name}</span>
              <span className="file-size">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { e.preventDefault(); setFile(null); }}
              >
                Cambiar
              </Button>
            </div>
          )}
        </div>

        {file && (
          <div className="import-actions">
            <Button 
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" /> Procesando...
                </>
              ) : (
                'Importar Datos'
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="import-result">
            <h3>Resultado de la Importación</h3>
            <div className="result-stats">
              <div className="stat success">
                <span className="stat-value">{result.exitosos}</span>
                <span className="stat-label">Registros importados</span>
              </div>
              <div className="stat total">
                <span className="stat-value">{result.total}</span>
                <span className="stat-label">Total procesados</span>
              </div>
              {result.errores.length > 0 && (
                <div className="stat error">
                  <span className="stat-value">{result.errores.length}</span>
                  <span className="stat-label">Errores</span>
                </div>
              )}
            </div>

            {result.errores.length > 0 && (
              <div className="error-list">
                <h4>Errores encontrados:</h4>
                <ul>
                  {result.errores.slice(0, 10).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errores.length > 10 && (
                    <li className="more">...y {result.errores.length - 10} más</li>
                  )}
                </ul>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={() => { setFile(null); setResult(null); }}
            >
              Importar Otro Archivo
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Importacion;