import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores';
import { Button, Spinner, Modal } from '../components/ui';
import './Empaste.css';

interface OpcionEmpaste {
  tipo: string;
  descripcion: string;
  precio: number;
  caracteristicas: string[];
}

const TIPOS_EMPASTE: OpcionEmpaste[] = [
  {
    tipo: 'Tapa Dura',
    descripcion: 'Empaste profesional con tapa dura rígida',
    precio: 45,
    caracteristicas: ['Cartulina forrada', 'Guardas decoradas', 'Lomo en piel', 'Alta durabilidad'],
  },
  {
    tipo: 'Tapa Blanda',
    descripcion: 'Empaste económico con tapa blanda',
    precio: 25,
    caracteristicas: ['Cartulina simple', 'Guardas básicas', 'Lomo cuadrado', 'Uso general'],
  },
  {
    tipo: 'Tapa Cuero',
    descripcion: 'Empaste de lujo con tapa de cuero',
    precio: 85,
    caracteristicas: ['Cuero genuino', 'Grabado en oro', 'Guardas especiales', 'Calidad premium'],
  },
  {
    tipo: 'Espiral',
    descripcion: 'Encuadernación con espiral metálico',
    precio: 18,
    caracteristicas: ['Metal resistente', 'Apertura 360°', 'Grapado profesional', 'Ideal para manuales'],
  },
  {
    tipo: 'Anillado',
    descripcion: 'Encuadernación con anillos metálicos',
    precio: 22,
    caracteristicas: ['Anillos dorada/niquel', 'Capacidad alta', 'Diseño corporativo', 'Presentaciones'],
  },
];

interface Cotizacion {
  tipo: string;
  paginas: number;
  copias: number;
  adicional: number;
  total: number;
}

export const Empaste = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [showCotizador, setShowCotizador] = useState(false);
  const [cotizacion, setCotizacion] = useState({
    tipo: 'Tapa Dura',
    paginas: 50,
    copias: 1,
    adicional: 0,
  });
  const [resultado, setResultado] = useState<Cotizacion | null>(null);

  const handleCotizar = () => {
    const tipoSelected = TIPOS_EMPASTE.find(t => t.tipo === cotizacion.tipo);
    if (!tipoSelected) return;

    let total = tipoSelected.precio;
    
    if (cotizacion.paginas > 100) {
      total += (cotizacion.paginas - 100) * 0.5;
    }
    
    total *= cotizacion.copias;
    total += cotizacion.adicional;

    setResultado({
      ...cotizacion,
      total: Math.round(total * 100) / 100,
    });
  };

  const handleConfirmar = () => {
    if (!resultado) return;
    
    showToast({
      tipo: 'success',
      titulo: 'Pedido creado',
      mensaje: 'Serás redirigido al carrito',
    });
    
    setShowCotizador(false);
    navigate('/usuario/wizard/empastados');
  };

  return (
    <div className="empaste-page">
      <header className="empaste-header">
        <Button variant="ghost" onClick={() => navigate('/usuario/servicios')}>
          ← Volver
        </Button>
        <span className="header-icon">📚</span>
        <h1>Empaste y Encuadernación</h1>
        <p className="header-subtitle">Profesionalizamos tus documentos y trabajos</p>
      </header>

      <main className="empaste-content">
        <section className="info-section">
          <h2>Tipos de Empaste Disponibles</h2>
          <div className="tipos-grid">
            {TIPOS_EMPASTE.map(tipo => (
              <div 
                key={tipo.tipo}
                className={`tipo-card ${selectedTipo === tipo.tipo ? 'selected' : ''}`}
                onClick={() => setSelectedTipo(tipo.tipo)}
              >
                <h3>{tipo.tipo}</h3>
                <p className="tipo-desc">{tipo.descripcion}</p>
                <div className="tipo-precio">
                  <span className="precio-label">Desde</span>
                  <span className="precio-value">S/ {tipo.precio}</span>
                </div>
                <ul className="tipo-caract">
                  {tipo.caracteristicas.map((car, i) => (
                    <li key={i}>{car}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="extras-section">
          <h2>Servicios Adicionales</h2>
          <div className="extras-grid">
            <div className="extra-item">
              <span className="extra-icon">🎨</span>
              <div>
                <h4>Impresión a Color</h4>
                <p>S/ 0.50 por página</p>
              </div>
            </div>
            <div className="extra-item">
              <span className="extra-icon">📖</span>
              <div>
                <h4>Índice</h4>
                <p>S/ 5 por hoja</p>
              </div>
            </div>
            <div className="extra-item">
              <span className="extra-icon">✨</span>
              <div>
                <h4>Lomo con Título</h4>
                <p>S/ 15</p>
              </div>
            </div>
            <div className="extra-item">
              <span className="extra-icon">📦</span>
              <div>
                <h4>Bolsa de Regalo</h4>
                <p>S/ 8</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <Button onClick={() => setShowCotizador(true)} size="lg">
            Calcular Precio →
          </Button>
        </section>
      </main>

      {showCotizador && (
        <Modal open={showCotizador} onOpenChange={setShowCotizador} size="lg">
          <div className="cotizador-modal">
            <h2>Calculadora de Precios</h2>
            
            <div className="calc-form">
              <div className="form-group">
                <label>Tipo de Empaste</label>
                <select 
                  value={cotizacion.tipo}
                  onChange={(e) => setCotizacion({ ...cotizacion, tipo: e.target.value })}
                >
                  {TIPOS_EMPASTE.map(t => (
                    <option key={t.tipo} value={t.tipo}>{t.tipo} - S/ {t.precio}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Número de Páginas</label>
                <input 
                  type="number"
                  min="1"
                  value={cotizacion.paginas}
                  onChange={(e) => setCotizacion({ ...cotizacion, paginas: parseInt(e.target.value) || 1 })}
                />
                <span className="help-text">Más de 100 páginas tiene costo adicional</span>
              </div>

              <div className="form-group">
                <label>Cantidad de Copias</label>
                <input 
                  type="number"
                  min="1"
                  value={cotizacion.copias}
                  onChange={(e) => setCotizacion({ ...cotizacion, copias: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="form-group">
                <label>Servicios Adicionales (S/)</label>
                <input 
                  type="number"
                  min="0"
                  value={cotizacion.adicional}
                  onChange={(e) => setCotizacion({ ...cotizacion, adicional: parseFloat(e.target.value) || 0 })}
                />
                <span className="help-text">Índices, bolsas, grabados, etc.</span>
              </div>

              <Button onClick={handleCotizar} className="btn-calcular">
                Calcular Precio
              </Button>

              {resultado && (
                <div className="resultado-cotizacion">
                  <div className="resultado-detalle">
                    <div className="detalle-row">
                      <span>Tipo:</span>
                      <span>{resultado.tipo}</span>
                    </div>
                    <div className="detalle-row">
                      <span>Páginas:</span>
                      <span>{resultado.paginas}</span>
                    </div>
                    <div className="detalle-row">
                      <span>Copias:</span>
                      <span>{resultado.copias}</span>
                    </div>
                    <div className="detalle-row">
                      <span>Adicionales:</span>
                      <span>S/ {resultado.adicional.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="resultado-total">
                    <span>Total:</span>
                    <span>S/ {resultado.total.toFixed(2)}</span>
                  </div>
                  <Button onClick={handleConfirmar} className="btn-confirmar">
                    Confirmar y Continuar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Empaste;