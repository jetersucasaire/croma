import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../api/clienteAxios';
import { useUIStore } from '../stores';
import { Button, Spinner, Modal } from '../components/ui';
import './DisenoLogos.css';

interface Proyecto {
  id: number;
  uuid: string;
  nombre: string;
  estado: string;
  fase_actual: number;
  presupuesto: number;
  tracking_id: string;
  created_at: string;
  servicios?: {
    nombre: string;
    icono: string;
  };
}

interface NuevaEntrega {
  empresa: string;
  eslogan: string;
  colores: string[];
  estilo: 'moderno' | 'clasico' | 'minimalista' | 'corporativo' | 'infantil' | '';
  referencia: string;
  descripcion: string;
}

const ESTADOS_PROYECTO: Record<string, { label: string; color: string; desc: string }> = {
  briefing: { label: 'Briefing', color: '#ffc107', desc: 'Definiendo requerimientos' },
  diseno: { label: 'En Diseño', color: '#007bff', desc: 'Creando propuestas' },
  revision: { label: 'Revisión', color: '#17a2b8', desc: 'Aprobando opciones' },
  ajustes: { label: 'Ajustes', color: '#6c757d', desc: 'Realizando cambios' },
  entrega: { label: 'Entregado', color: '#28a745', desc: 'Proyecto completado' },
};

export const DisenoLogos = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [proyectoActual, setProyectoActual] = useState<Proyecto | null>(null);
  const [nuevaEntrega, setNuevaEntrega] = useState<NuevaEntrega>({
    empresa: '',
    eslogan: '',
    colores: [],
    estilo: '',
    referencia: '',
    descripcion: '',
  });

  const coloresPopulares = ['#000000', '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'];

  useEffect(() => {
    loadProyectos();
  }, []);

  const loadProyectos = async () => {
    setLoading(true);
    try {
      const response = await request('/proyectos/mis-proyectos');
      if (response.success) {
        setProyectos(response.proyectos || []);
      }
    } catch (err) {
      console.error('Error al cargar proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearProyecto = async () => {
    if (!nuevaEntrega.empresa || !nuevaEntrega.descripcion) {
      showToast({ tipo: 'error', titulo: 'Error', mensaje: 'Completa los campos requeridos' });
      return;
    }

    setLoading(true);
    try {
      const response = await request('/proyectos/crear', {
        method: 'POST',
        data: {
          nombre: nuevaEntrega.empresa,
          servicioSlug: 'diseno-logos',
          presupuesto: 0,
          preferencias: {
            eslogan: nuevaEntrega.eslogan,
            colores: nuevaEntrega.colores,
            estilo: nuevaEntrega.estilo,
            referencia: nuevaEntrega.referencia,
            descripcion: nuevaEntrega.descripcion,
          },
        },
      });

      if (response.success) {
        showToast({ tipo: 'success', titulo: 'Éxito', mensaje: 'Proyecto creado exitosamente' });
        setShowNewProject(false);
        setNuevaEntrega({
          empresa: '',
          eslogan: '',
          colores: [],
          estilo: '',
          referencia: '',
          descripcion: '',
        });
        loadProyectos();
      }
    } catch (err) {
      showToast({ tipo: 'error', titulo: 'Error', mensaje: 'Error al crear el proyecto' });
    } finally {
      setLoading(false);
    }
  };

  const toggleColor = (color: string) => {
    setNuevaEntrega(prev => ({
      ...prev,
      colores: prev.colores.includes(color)
        ? prev.colores.filter(c => c !== color)
        : [...prev.colores, color].slice(0, 4),
    }));
  };

  const getEstadoInfo = (estado: string) => {
    return ESTADOS_PROYECTO[estado] || { label: estado, color: '#999', desc: '' };
  };

  return (
    <div className="diseno-logos-page">
      <header className="dl-header">
        <Button variant="ghost" onClick={() => navigate('/usuario/servicios')}>
          ← Volver
        </Button>
        <div className="header-content">
          <span className="header-icon">🎨</span>
          <h1>Diseño de Logotipos y Branding</h1>
        </div>
        <p className="header-subtitle">Crea la identidad visual de tu empresa</p>
      </header>

      <main className="dl-content">
        <div className="dl-intro">
          <div className="intro-card">
            <h2>¿Cómo funciona?</h2>
            <ol className="pasos-proceso">
              <li>
                <span className="step-num">1</span>
                <div className="step-content">
                  <h4>Briefing</h4>
                  <p>Cuéntanos sobre tu empresa, valores y preferencias</p>
                </div>
              </li>
              <li>
                <span className="step-num">2</span>
                <div className="step-content">
                  <h4>Propuestas</h4>
                  <p>Recibirás 3 opciones de diseño inicial</p>
                </div>
              </li>
              <li>
                <span className="step-num">3</span>
                <div className="step-content">
                  <h4>Revisión</h4>
                  <p>Selecciona y solicita ajustes</p>
                </div>
              </li>
              <li>
                <span className="step-num">4</span>
                <div className="step-content">
                  <h4>Entrega Final</h4>
                  <p>Recibe todos los formatos (AI, EPS, PNG, JPG)</p>
                </div>
              </li>
            </ol>
            <Button onClick={() => setShowNewProject(true)} className="btn-iniciar">
              Iniciar Nuevo Proyecto
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><Spinner /></div>
        ) : proyectos.length > 0 ? (
          <div className="proyectos-list">
            <h2>Mis Proyectos</h2>
            <div className="proyectos-grid">
              {proyectos.map(proyecto => {
                const estado = getEstadoInfo(proyecto.estado);
                return (
                  <div key={proyecto.id} className="proyecto-card">
                    <div className="proyecto-header">
                      <h3>{proyecto.nombre}</h3>
                      <span className="proyecto-tracking">{proyecto.tracking_id}</span>
                    </div>
                    <div className="proyecto-estado">
                      <span 
                        className="estado-badge"
                        style={{ backgroundColor: estado.color }}
                      >
                        {estado.label}
                      </span>
                      <p className="estado-desc">{estado.desc}</p>
                    </div>
                    <div className="proyecto-fase">
                      <div className="fase-progress">
                        <div 
                          className="fase-fill"
                          style={{ width: `${(proyecto.fase_actual / 4) * 100}%` }}
                        ></div>
                      </div>
                      <span className="fase-text">Fase {proyecto.fase_actual} de 4</span>
                    </div>
                    <div className="proyecto-fecha">
                      Creado: {new Date(proyecto.created_at).toLocaleDateString()}
                    </div>
                    <Button variant="outline" size="sm" className="btn-ver-proyecto">
                      Ver Detalles
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="empty-proyectos">
            <span className="empty-icon">📋</span>
            <p>Aún no tienes proyectos de diseño</p>
          </div>
        )}
      </main>

      {showNewProject && (
        <Modal open={showNewProject} onOpenChange={(open) => { if (!open) setShowNewProject(false); }}>
          <div className="new-project-modal">
            <h2>Nuevo Proyecto de Diseño</h2>
            <p className="modal-subtitle">Cuéntanos sobre tu marca para crear el/logo perfecto</p>
            
            <div className="briefing-form">
              <div className="form-group">
                <label>Nombre de la empresa *</label>
                <input 
                  type="text"
                  value={nuevaEntrega.empresa}
                  onChange={(e) => setNuevaEntrega({ ...nuevaEntrega, empresa: e.target.value })}
                  placeholder="Nombre de tu empresa o negocio"
                />
              </div>

              <div className="form-group">
                <label>Eslogan (opcional)</label>
                <input 
                  type="text"
                  value={nuevaEntrega.eslogan}
                  onChange={(e) => setNuevaEntrega({ ...nuevaEntrega, eslogan: e.target.value })}
                  placeholder="Ej: Calidad que se siente"
                />
              </div>

              <div className="form-group">
                <label>Colores preferidos (hasta 4)</label>
                <div className="colores-selector">
                  {coloresPopulares.map(color => (
                    <button
                      key={color}
                      className={`color-btn ${nuevaEntrega.colores.includes(color) ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => toggleColor(color)}
                      title={color}
                    >
                      {nuevaEntrega.colores.includes(color) && '✓'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Estilo preferido</label>
                <div className="estilo-options">
                  {['moderno', 'clasico', 'minimalista', 'corporativo', 'infantil'].map(estilo => (
                    <label key={estilo} className={`estilo-option ${nuevaEntrega.estilo === estilo ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="estilo" 
                        value={estilo}
                        checked={nuevaEntrega.estilo === estilo}
                        onChange={(e) => setNuevaEntrega({ ...nuevaEntrega, estilo: e.target.value as any })}
                      />
                      <span>{estilo.charAt(0).toUpperCase() + estilo.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Referencias (opcional)</label>
                <input 
                  type="text"
                  value={nuevaEntrega.referencia}
                  onChange={(e) => setNuevaEntrega({ ...nuevaEntrega, referencia: e.target.value })}
                  placeholder="Links a logotipos que te gusten"
                />
              </div>

              <div className="form-group">
                <label>Descripción del negocio *</label>
                <textarea 
                  value={nuevaEntrega.descripcion}
                  onChange={(e) => setNuevaEntrega({ ...nuevaEntrega, descripcion: e.target.value })}
                  placeholder="¿Qué haces? ¿Quién es tu público objetivo? ¿Qué valores transmite tu marca?"
                  rows={4}
                />
              </div>

              <div className="modal-actions">
                <Button variant="outline" onClick={() => setShowNewProject(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCrearProyecto} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Proyecto'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DisenoLogos;