import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { wizardApi } from '../api/endpoints';
import { request } from '../api/clienteAxios';
import { useAuthStore } from '../stores/authStore';
import { Button, Spinner, Modal } from '../components/ui';
import CambiarPasswordForm from '../components/forms/CambiarPasswordForm';
import './Perfil.css';

interface Pedido {
  id: number;
  uuid?: string;
  trackingId?: string;
  servicioId: number;
  servicioNombre?: string;
  servicioIcono?: string;
  fase: string;
  estadoProduccion: string;
  total: number;
  fechaCreacion: string;
  entregas?: Entrega[];
}

interface Entrega {
  id: number;
  urlDescarga: string;
  version: string;
  comentario?: string;
  fechaGeneracion?: string;
  createdAt?: string;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  whatsapp?: string;
  rol: string;
}

const ESTADOS_PEDIDO: Record<string, { label: string; color: string; step: number }> = {
  pendiente: { label: 'Pendiente', color: '#ffc107', step: 1 },
  en_cola: { label: 'En Cola', color: '#17a2b8', step: 2 },
  imprimiendo: { label: 'En Producci??n', color: '#007bff', step: 3 },
  acabado: { label: 'Acabado', color: '#6c757d', step: 4 },
  entregado: { label: 'Entregado', color: '#28a745', step: 5 },
};

export const Perfil = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { usuario, setUsuario, logout } = useAuthStore();
  const [vistaActiva, setVistaActiva] = useState<'datos' | 'pedidos' | 'seguimiento'>('datos');
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  
  const [nombreEditado, setNombreEditado] = useState(usuario?.nombre || '');
  const [whatsappEditado, setWhatsappEditado] = useState(usuario?.whatsapp || '');

  // Abrir tab desde query param (ej: ?tab=pedidos desde notificación)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'pedidos') setVistaActiva('pedidos');
  }, [searchParams]);

  useEffect(() => {
    if (vistaActiva === 'pedidos' || vistaActiva === 'seguimiento') {
      loadPedidos();
    }
  }, [vistaActiva]);

  const loadPedidos = async () => {
    setLoadingPedidos(true);
    try {
      const response = await wizardApi.getPedidos();
      if (response.success && response.data) {
        const pedidosBase = response.data as Pedido[];
        // Cargar entregas para cada pedido
        const pedidosConEntregas = await Promise.all(
          pedidosBase.map(async (p) => {
            try {
              const res = await request<{ success: boolean; data: any[] }>(`/pedidos/${p.id}/entregas`);
              return { ...p, entregas: res?.data || [] };
            } catch {
              return { ...p, entregas: [] };
            }
          })
        );
        setPedidos(pedidosConEntregas);
      }
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
    } finally {
      setLoadingPedidos(false);
    }
  };

  const guardarCambios = async () => {
    if (!usuario) return;
    
    setLoading(true);
    try {
      await request('/auth/actualizar-perfil', {
        method: 'PUT',
        data: { nombre: nombreEditado, whatsapp: whatsappEditado },
      });
      const updatedUser = { ...usuario, nombre: nombreEditado, whatsapp: whatsappEditado };
      setUsuario(updatedUser);
      setEditando(false);
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Error al guardar cambios');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleVerSeguimiento = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setVistaActiva('seguimiento');
  };

  const getEstadoInfo = (estado: string) => {
    return ESTADOS_PEDIDO[estado] || { label: estado, color: '#999', step: 0 };
  };

  const getProgreso = (estado: string) => {
    const info = getEstadoInfo(estado);
    return (info.step / 5) * 100;
  };

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <div className="perfil-avatar-grande">
          {usuario?.nombre?.charAt(0) || "U"}
        </div>
        <h1>{usuario?.nombre || "Usuario"}</h1>
        <p className="perfil-email">{usuario?.email || "usuario@croma.pe"}</p>
        {usuario?.whatsapp && (
          <p className="perfil-whatsapp">?Y" {usuario.whatsapp}</p>
        )}
      </header>

      <nav className="perfil-tabs">
        <button 
          className={`tab-btn ${vistaActiva === 'datos' ? 'active' : ''}`}
          onClick={() => setVistaActiva('datos')}
        >
          Mis Datos
        </button>
        <button 
          className={`tab-btn ${vistaActiva === 'pedidos' ? 'active' : ''}`}
          onClick={() => setVistaActiva('pedidos')}
        >
          Mis Pedidos
        </button>
        <button 
          className={`tab-btn ${vistaActiva === 'seguimiento' ? 'active' : ''}`}
          onClick={() => setVistaActiva('seguimiento')}
        >
          Seguimiento
        </button>
      </nav>

      <main className="perfil-contenido">
        {vistaActiva === 'datos' && (
          <>
            <div className="datos-section">
              <h2>Informaci??n Personal</h2>
              <div className="datos-form">
                <label>
                  Nombre completo
                  <input 
                    type="text" 
                    value={nombreEditado}
                    onChange={(e) => setNombreEditado(e.target.value)}
                    disabled={!editando}
                  />
                </label>
                <label>
                  Correo electr??nico
                  <input type="email" value={usuario?.email || ''} disabled />
                </label>
                <label>
                  WhatsApp
                  <input 
                    type="tel" 
                    value={whatsappEditado}
                    onChange={(e) => setWhatsappEditado(e.target.value)}
                    disabled={!editando}
                    placeholder="+51 999 999 999"
                  />
                </label>
                <label>
                  Rol
                  <input type="text" value={usuario?.rol || 'cliente'} disabled />
                </label>
                <div className="datos-actions">
                  {editando ? (
                    <>
                      <button className="btn-guardar" onClick={guardarCambios} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button className="btn-cancelar" onClick={() => setEditando(false)}>Cancelar</button>
                    </>
                  ) : (
                    <button className="btn-editar" onClick={() => setEditando(true)}>Editar</button>
                  )}
                </div>
              </div>
            </div>
            <div className="datos-section seguridad-section">
              <h2>Seguridad de la Cuenta</h2>
              <CambiarPasswordForm />
            </div>
          </>
        )}

        {vistaActiva === 'pedidos' && (
          <div className="pedidos-section">
            <h2>Historial de Pedidos</h2>
            {loadingPedidos ? (
              <div className="loading-state"><Spinner /></div>
            ) : pedidos.length === 0 ? (
              <div className="empty-state">
                <p>No tienes pedidos a??n</p>
                <Button onClick={() => navigate('/usuario/servicios')}>Ver Servicios</Button>
              </div>
            ) : (
              <table className="pedidos-tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tracking</th>
                    <th>Servicio</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acci??n</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => {
                    const estadoInfo = getEstadoInfo(pedido.estadoProduccion);
                    return (
                      <tr key={pedido.id}>
                        <td>#{pedido.id}</td>
                        <td>{pedido.trackingId || '-'}</td>
                        <td>
                          <span className="servicio-cell">
                            {pedido.servicioIcono} {pedido.servicioNombre || 'Servicio'}
                          </span>
                        </td>
                        <td>{new Date(pedido.fechaCreacion).toLocaleDateString()}</td>
                        <td>S/ {pedido.total.toFixed(2)}</td>
                        <td>
                          <span className={'estado-badge ' + pedido.estadoProduccion} style={{ backgroundColor: estadoInfo.color }}>
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn-ver"
                            onClick={() => handleVerSeguimiento(pedido)}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {vistaActiva === 'seguimiento' && (
          <div className="seguimiento-section">
            <h2>Seguimiento de Pedido</h2>
            {pedidoSeleccionado ? (
              <div className="seguimiento-card">
                <div className="seguimiento-header">
                  <div className="pedido-info">
                    <span className="servicio-icon">{pedidoSeleccionado.servicioIcono}</span>
                    <div>
                      <h3>{pedidoSeleccionado.servicioNombre || 'Pedido'}</h3>
                      <p>Tracking: {pedidoSeleccionado.trackingId || 'N/A'}</p>
                      <p>Total: S/ {pedidoSeleccionado.total.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="estado-actual">
                    <span className="estado-label">Estado:</span>
                    <span 
                      className="estado-value"
                      style={{ backgroundColor: getEstadoInfo(pedidoSeleccionado.estadoProduccion).color }}
                    >
                      {getEstadoInfo(pedidoSeleccionado.estadoProduccion).label}
                    </span>
                  </div>
                </div>

                <div className="progress-tracker">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: getProgreso(pedidoSeleccionado.estadoProduccion) + '%' }} 
                    ></div>
                  </div>
                  <div className="progress-steps">
                    {Object.entries(ESTADOS_PEDIDO).map(([key, info]) => (
                      <div 
                        key={key} 
                        className={'step ' + (pedidoSeleccionado.estadoProduccion === key ? 'active' : '') + ' ' + (ESTADOS_PEDIDO[pedidoSeleccionado.estadoProduccion].step >= info.step ? 'completed' : '')} 
                      >
                        <div className="step-dot" style={{ backgroundColor: info.color }}></div>
                        <span className="step-label">{info.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="seguimiento-actions">
                  <Button variant="outline" onClick={() => setVistaActiva('pedidos')}>
                    ??? Volver a Pedidos
                  </Button>
                  {pedidoSeleccionado.estadoProduccion === 'entregado' && (
                    <Button variant="outline">
                      Descargar Factura
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Selecciona un pedido para ver su seguimiento</p>
                <Button onClick={() => setVistaActiva('pedidos')}>Ver Pedidos</Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Perfil;
