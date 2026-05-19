import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores';
import { Button, Spinner, Modal } from '../components/ui';
import './Multimedia.css';

interface ServicioMultimedia {
  nombre: string;
  descripcion: string;
  precioBase: number;
  unidad: string;
  incluye: string[];
}

const SERVICIOS: ServicioMultimedia[] = [
  {
    nombre: 'Video Corporativo',
    descripcion: 'Videos institucionales para empresas',
    precioBase: 350,
    unidad: 'minuto',
    incluye: ['Guionización', 'Grabación', 'Edición', 'Música', 'Subtítulos'],
  },
  {
    nombre: 'Video Promocional',
    descripcion: 'Videos para redes sociales y publicidad',
    precioBase: 200,
    unidad: 'minuto',
    incluye: ['Brief creativo', 'Edición', 'Efectos', 'Música', 'Exportación múltiples formatos'],
  },
  {
    nombre: 'Edición de Video',
    descripcion: 'Edición de material existente',
    precioBase: 150,
    unidad: 'minuto',
    incluye: ['Corrección de color', 'Transiciones', 'Audio', 'Gráficos'],
  },
  {
    nombre: 'Audio - Voz en Off',
    descripcion: 'Grabación de locuciones profesionales',
    precioBase: 80,
    unidad: 'minuto',
    incluye: ['Estudio profesional', 'Edición básica', 'Entrega en MP3/WAV'],
  },
  {
    nombre: 'Audio - Podcast',
    descripcion: 'Producción completa de podcast',
    precioBase: 120,
    unidad: 'episodio',
    incluye: ['Edición', 'Música', 'Intro/Outro', 'Normalización'],
  },
  {
    nombre: 'Motion Graphics',
    descripcion: 'Animaciones y gráficos en movimiento',
    precioBase: 250,
    unidad: 'segundo',
    incluye: ['Diseño personalizado', 'Animación', 'Renderizado'],
  },
];

interface ProyectoData {
  servicio: string;
  duracion: number;
  descripcion: string;
  referencias: string;
  urgencia: 'normal' | 'urgente';
}

export const Multimedia = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [proyecto, setProyecto] = useState<ProyectoData>({
    servicio: '',
    duracion: 0,
    descripcion: '',
    referencias: '',
    urgencia: 'normal',
  });
  const [resultado, setResultado] = useState<{ precio: number; tiempo: string } | null>(null);

  const handleCotizar = () => {
    const servicioSelected = SERVICIOS.find(s => s.nombre === proyecto.servicio);
    if (!servicioSelected || proyecto.duracion <= 0) {
      showToast({ tipo: 'error', titulo: 'Error', mensaje: 'Completa todos los campos' });
      return;
    }

    let precio = servicioSelected.precioBase * proyecto.duracion;
    
    if (proyecto.urgencia === 'urgente') {
      precio *= 1.5;
    }

    const dias = proyecto.duracion <= 2 ? 2 : Math.ceil(proyecto.duracion / 2) + 2;

    setResultado({
      precio: Math.round(precio),
      tiempo: `${dias} días hábiles`,
    });
  };

  const handleConfirmar = () => {
    if (!resultado) return;
    
    showToast({
      tipo: 'success',
      titulo: 'Proyecto enviado',
      mensaje: 'Nos contactaremos contigo pronto',
    });
    
    setShowBrief(false);
    navigate('/usuario/perfil');
  };

  return (
    <div className="multimedia-page">
      <header className="mm-header">
        <Button variant="ghost" onClick={() => navigate('/usuario/servicios')}>
          ← Volver
        </Button>
        <span className="header-icon">🎬</span>
        <h1>Edición de Audio y Video</h1>
        <p className="header-subtitle">Producción audiovisual profesional</p>
      </header>

      <main className="mm-content">
        <section className="servicios-section">
          <h2>Nuestros Servicios</h2>
          <div className="servicios-grid">
            {SERVICIOS.map(serv => (
              <div key={serv.nombre} className="servicio-card">
                <h3>{serv.nombre}</h3>
                <p className="serv-desc">{serv.descripcion}</p>
                <div className="serv-precio">
                  <span className="precio-amount">S/ {serv.precioBase}</span>
                  <span className="precio-unit">/{serv.unidad}</span>
                </div>
                <ul className="serv-incluye">
                  {serv.incluye.map((inc, i) => (
                    <li key={i}>{inc}</li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setProyecto({ ...proyecto, servicio: serv.nombre });
                    setShowBrief(true);
                  }}
                >
                  Solicitar
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="proceso-section">
          <h2>¿Cómo Trabajamos?</h2>
          <div className="proceso-steps">
            <div className="step">
              <div className="step-num">1</div>
              <h4>Brief</h4>
              <p>Nos cuentas tu idea y objetivos</p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h4>Propuesta</h4>
              <p>Te enviamos un presupuesto detallado</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h4>Producción</h4>
              <p>Creamos el contenido requested</p>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <h4>Entrega</h4>
              <p>Recibes los archivos en tus formatos</p>
            </div>
          </div>
        </section>

        <section className="entregables-section">
          <h2>Formatos de Entrega</h2>
          <div className="entregables-list">
            <div className="entregable">
              <span className="ent-icon">🎥</span>
              <div>
                <h4>Video</h4>
                <p>MP4, MOV, AVI - hasta 4K</p>
              </div>
            </div>
            <div className="entregable">
              <span className="ent-icon">🎵</span>
              <div>
                <h4>Audio</h4>
                <p>MP3, WAV, AIFF</p>
              </div>
            </div>
            <div className="entregable">
              <span className="ent-icon">📁</span>
              <div>
                <h4>Proyecto</h4>
                <p>Archivos originales editable</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showBrief && (
        <Modal open={showBrief} onOpenChange={(open) => { if (!open) setShowBrief(false); }} size="lg">
          <div className="brief-modal">
            <h2>Nuevo Proyecto de {proyecto.servicio || 'Multimedia'}</h2>
            
            <div className="brief-form">
              <div className="form-group">
                <label>Tipo de Servicio</label>
                <select 
                  value={proyecto.servicio}
                  onChange={(e) => setProyecto({ ...proyecto, servicio: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {SERVICIOS.map(s => (
                    <option key={s.nombre} value={s.nombre}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duración (minutos/segundos)</label>
                  <input 
                    type="number"
                    min="1"
                    value={proyecto.duracion}
                    onChange={(e) => setProyecto({ ...proyecto, duracion: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Urgencia</label>
                  <select 
                    value={proyecto.urgencia}
                    onChange={(e) => setProyecto({ ...proyecto, urgencia: e.target.value as any })}
                  >
                    <option value="normal">Normal (+50%)</option>
                    <option value="urgente">Urgente (+50%)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descripción del Proyecto</label>
                <textarea 
                  value={proyecto.descripcion}
                  onChange={(e) => setProyecto({ ...proyecto, descripcion: e.target.value })}
                  placeholder="Describe qué necesitas crear..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Referencias (links)</label>
                <input 
                  type="text"
                  value={proyecto.referencias}
                  onChange={(e) => setProyecto({ ...proyecto, referencias: e.target.value })}
                  placeholder="Links a videos o estilos que te gusten"
                />
              </div>

              <Button onClick={handleCotizar} className="btn-cotizar">
                Calcular Precio
              </Button>

              {resultado && (
                <div className="resultado-brief">
                  <div className="resultado-content">
                    <div className="resultado-item">
                      <span className="label">Precio Estimado:</span>
                      <span className="value">S/ {resultado.precio}</span>
                    </div>
                    <div className="resultado-item">
                      <span className="label">Tiempo de Entrega:</span>
                      <span className="value">{resultado.tiempo}</span>
                    </div>
                  </div>
                  <Button onClick={handleConfirmar} className="btn-confirmar">
                    Confirmar y Enviar
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

export default Multimedia;