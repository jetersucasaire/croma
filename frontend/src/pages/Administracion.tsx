import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useServicios, useMisPedidos, useDisenos, useMateriales, useTodosServicios, useTodosProductos, useAdminPedido, useDashboardStats } from '../api/queries';
import { request } from '../api/clienteAxios';
import { Spinner, Button, Modal, ConfirmModal } from '../components/ui';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { socketService } from '../services/socket';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import './Administracion.css';

type Tab = 'dashboard' | 'pedidos' | 'servicios' | 'productos' | 'disenos' | 'materiales' | 'usuarios';

interface Pedido { 
  id: number; 
  trackingId?: string; 
  servicioId: number; 
  fase: string; 
  estadoProduccion: string; 
  total: number; 
  fechaCreacion: string; 
  usuarioId: number;
  tipoItem?: string;
  itemNombre?: string;
  itemDescripcion?: string;
  medida?: string;
  color?: string;
  disenoPersonalizado?: string;
  material?: string;
  pedidoClienteNombre?: string;
  pedidoClienteTelefono?: string;
  pedidoClienteEmail?: string;
  disenoExiste?: boolean;
}
interface Servicio { id: number; nombre: string; slug: string; descripcion: string; icono: string; imagen?: string; precioBase: number; unidad: string; activo: boolean; }
interface Producto { id: number; nombre: string; slug: string; descripcion: string; imagen?: string; categoria: string; precio: number; precioOferta?: number; stock: number; unidad: string; activo: boolean; }
interface Diseno { id: number; nombre: string; servicioId: number; activo: boolean; imagen?: string; }
interface Material { id: number; nombre: string; servicioId: number; tipo: string; precioUnitario: number; stock: number; activo: boolean; }
interface Usuario { id: number; nombre: string; email: string; rol: string; whatsapp?: string; activo?: boolean; }

const ESTADOS = ['pendiente', 'en_cola', 'imprimiendo', 'acabado', 'entregado'];

const ICONOS = ['💳', '🏷️', '📋', '📛', '🖨️', '📚', '🎬', '🎨', '🔴', '📦', '✏️', '🖼️', '📄', '💎', '🎯'];

export const Administracion = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [disenos, setDisenos] = useState<Diseno[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [diseniadores, setDiseniadores] = useState<{ id: number; nombre: string }[]>([]);
  
  const { usuario: currentUser, isAuthenticated } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);
  const esAdmin = currentUser?.rol === 'admin';
  const esDiseniador = currentUser?.rol === 'diseniador';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const [isConnected, setIsConnected] = useState(socketService.isConnected());
  useEffect(() => {
    const timer = setInterval(() => setIsConnected(socketService.isConnected()), 2000);
    return () => clearInterval(timer);
  }, []);
  
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const pedidoId = searchParams.get('pedido');
    if (pedidoId) {
      const pId = parseInt(pedidoId);
      if (!isNaN(pId)) {
        setTab('pedidos');
        request(`/pedidos/admin/${pId}`).then((res: any) => {
          const pedidoData = res?.data || res;
          if (pedidoData?.id) {
            setSelectedItem(pedidoData);
            setShowModal(true);
          }
        }).catch(() => {});
      }
    }
  }, [searchParams, request]);

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [servicioFiltro, setServicioFiltro] = useState('todos');
  const [sidebarFiltro, setSidebarFiltro] = useState('todos');
  const [sidebarExpand, setSidebarExpand] = useState({ servicios: true, productos: false });
  const [servicioFiltroDiseno, setServicioFiltroDiseno] = useState('todos');
  const [servicioFiltroMaterial, setServicioFiltroMaterial] = useState('todos');
  const [categoriaFiltroProducto, setCategoriaFiltroProducto] = useState('todas');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ open: boolean; type: string; id: number | null }>({ open: false, type: '', id: null });
  const [saving, setSaving] = useState(false);

  const { data: serviciosData, isLoading: loadingServicios, error: errorServicios } = useTodosServicios({ enabled: isAuthenticated });
  const { data: productosData, isLoading: loadingProductos, error: errorProductos } = useTodosProductos({ enabled: isAuthenticated });
  const { data: disenosData, isLoading: loadingDisenos, error: errorDisenos } = useDisenos(undefined, { enabled: isAuthenticated, includeInactive: true });
  const { data: materialesData, isLoading: loadingMateriales, error: errorMateriales } = useMateriales(undefined, { enabled: isAuthenticated, includeInactive: true });
  const { data: dashboardData } = useDashboardStats({ enabled: isAuthenticated });

  useEffect(() => { 
    if (isAuthenticated) loadData(); 
  }, [tab, estadoFiltro, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !esAdmin) return;
    request<{ id: number; nombre: string; rol?: string }[]>('/admin/diseniadores')
      .then((res) => setDiseniadores(Array.isArray(res) ? res : []))
      .catch(() => setDiseniadores([]));
  }, [isAuthenticated, esAdmin]);

  useEffect(() => {
    if (!isConnected) return;
    const unsubEstado = socketService.onPedidoEstado(() => {
      if (tab === 'pedidos' || tab === 'dashboard') loadData();
    });
    const unsubActualizacion = socketService.onPedidoActualizacion(() => {
      if (tab === 'pedidos' || tab === 'dashboard') loadData();
    });
    return () => {
      unsubEstado();
      unsubActualizacion();
    };
  }, [isConnected, tab]);

  useEffect(() => {
    if (serviciosData?.servicios && (tab === 'servicios' || tab === 'disenos' || tab === 'materiales')) {
      setServicios(prev => JSON.stringify(prev) === JSON.stringify(serviciosData.servicios) ? prev : serviciosData.servicios);
    }
  }, [serviciosData, tab]);

  useEffect(() => {
    if (disenosData?.disenos && tab === 'disenos') {
      setDisenos(prev => JSON.stringify(prev) === JSON.stringify(disenosData.disenos) ? prev : disenosData.disenos);
    }
  }, [disenosData, tab]);

  useEffect(() => {
    if (productosData?.productos && tab === 'productos') {
      setProductos(prev => JSON.stringify(prev) === JSON.stringify(productosData.productos) ? prev : productosData.productos);
    }
  }, [productosData, tab]);

  useEffect(() => {
    if (materialesData?.materiales && tab === 'materiales') {
      setMateriales(prev => JSON.stringify(prev) === JSON.stringify(materialesData.materiales) ? prev : materialesData.materiales);
    }
  }, [materialesData, tab]);

  const loadData = async () => {
    console.log('loadData called for tab:', tab);
    try {
      switch (tab) {
        case 'dashboard':
          const pedidosRes = await request('/pedidos/admin/todos');
          setPedidos(Array.isArray(pedidosRes) ? pedidosRes : pedidosRes?.pedidos || []);
          break;
        case 'pedidos':
          const pRes = await request(`/pedidos/admin/todos?estado=${estadoFiltro === 'todos' ? '' : estadoFiltro}`);
          setPedidos(Array.isArray(pRes) ? pRes : pRes?.pedidos || []);
          if (esAdmin) {
            const dRes = await request<any[]>('/admin/diseniadores');
            setDiseniadores(Array.isArray(dRes) ? dRes : []);
          }
          break;
        case 'usuarios':
          const uRes = await request('/admin/usuarios');
          console.log('Usuarios response:', uRes);
          setUsuarios(Array.isArray(uRes) ? uRes : (uRes?.usuarios || []));
          break;
      }
    } catch (err) { console.error('Error loading:', err); }
  };

  const cambiarEstado = async (pedidoId: number, nuevoEstado: string) => {
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estadoProduccion: nuevoEstado } : p));
    try {
      await request(`/pedidos/admin/${pedidoId}/estado`, { method: 'PUT', data: { estado: nuevoEstado } });
    } catch (err) { console.error(err); }
  };

  const handleAsignarDiseniador = async (pedidoId: number, diseniadorId: number) => {
    const diseniador = diseniadores.find(d => d.id === diseniadorId);
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, diseniadorId, diseniadorNombre: diseniador?.nombre } : p));
    try {
      await request(`/pedidos/admin/${pedidoId}/asignar-diseniador`, {
        method: 'PUT',
        data: { diseniadorId }
      });
      const responsable = diseniadores.find((d) => d.id === diseniadorId);
      showToast({
        tipo: 'success',
        titulo: 'Responsable asignado',
        mensaje: responsable
          ? `${responsable.nombre} recibirá una notificación al instante (campana 🔔)`
          : 'El responsable recibirá una notificación en su panel',
        duracion: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pedidos', pedidoId] });
      if (isAuthenticated) loadData();
    } catch (err) {
      console.error('Error al asignar responsable:', err);
      showToast({
        tipo: 'error',
        titulo: 'No se pudo asignar',
        mensaje: err instanceof Error ? err.message : 'Error al asignar responsable',
      });
    }
  };

  const toggleActivo = async (tipo: string, id: number, activo: boolean) => {
    try {
      const estaActivo = activo === true || (activo as unknown) === 1;
      const nuevoActivo = !estaActivo;
      if (tipo === 'servicios') {
        setServicios(prev => prev.map(s => s.id === id ? { ...s, activo: nuevoActivo } : s));
      } else if (tipo === 'productos') {
        setProductos(prev => prev.map(p => p.id === id ? { ...p, activo: nuevoActivo } : p));
      } else if (tipo === 'disenos') {
        setDisenos(prev => prev.map(d => d.id === id ? { ...d, activo: nuevoActivo } : d));
      } else if (tipo === 'materiales') {
        setMateriales(prev => prev.map(m => m.id === id ? { ...m, activo: nuevoActivo } : m));
      } else if (tipo === 'admin/usuarios') {
        setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: nuevoActivo } : u));
      }
      
      let apiSuccess = false;
      try {
        let endpoint = `/${tipo}/${id}`;
        if (tipo === 'servicios') endpoint = `/servicios/${id}`;
        else if (tipo === 'productos') endpoint = `/productos/${id}`;
        
        await request(endpoint, { method: 'PUT', data: { activo: nuevoActivo } });
        apiSuccess = true;
      } catch (apiErr: any) {
        console.warn('API toggle failed, keeping local update:', apiErr.message);
      }
      
      if (apiSuccess) {
        if (tipo === 'servicios') {
          queryClient.invalidateQueries({ queryKey: ['servicios'] });
        } else if (tipo === 'productos') {
          queryClient.invalidateQueries({ queryKey: ['productos'] });
        } else if (tipo === 'disenos') {
          queryClient.invalidateQueries({ queryKey: ['disenos'] });
        } else if (tipo === 'materiales') {
          queryClient.invalidateQueries({ queryKey: ['materiales'] });
        }
      }
    } catch (err: any) { 
      console.error('Error toggle:', err.message); 
      alert('Error al cambiar estado: ' + (err.message || 'Error'));
    }
  };

  const eliminarItem = async (tipo: string, id: number) => {
    let apiSuccess = false;
    try {
      try {
        await request(`/${tipo}/${id}`, { method: 'DELETE' });
        apiSuccess = true;
      } catch (apiErr: any) {
        console.warn('API delete failed, removing locally:', apiErr.message);
      }
      
      setShowDeleteConfirm({ open: false, type: '', id: null });
      
      if (tipo === 'disenos') {
        setDisenos(prev => prev.filter(d => d.id !== id));
        if (apiSuccess) queryClient.invalidateQueries({ queryKey: ['disenos'] });
      } else if (tipo === 'materiales') {
        setMateriales(prev => prev.filter(m => m.id !== id));
        if (apiSuccess) queryClient.invalidateQueries({ queryKey: ['materiales'] });
      } else if (tipo === 'productos') {
        setProductos(prev => prev.filter(p => p.id !== id));
        if (apiSuccess) queryClient.invalidateQueries({ queryKey: ['productos'] });
      } else if (tipo === 'servicios') {
        setServicios(prev => prev.filter(s => s.id !== id));
        if (apiSuccess) queryClient.invalidateQueries({ queryKey: ['servicios'] });
      }
    } catch (err) { console.error(err); }
  };

  const getSiguienteEstado = (actual: string): string | null => {
    const idx = ESTADOS.indexOf(actual);
    return idx < ESTADOS.length - 1 ? ESTADOS[idx + 1] : null;
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = { pendiente: 'Pendiente', en_cola: 'En Cola', imprimiendo: 'Imprimiendo', acabado: 'Acabado', entregado: 'Entregado' };
    return labels[estado] || estado;
  };

  const filteredItems = () => {
    if (!searchTerm) return [];
    switch (tab) {
      case 'pedidos': return pedidos.filter(p => p.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()));
      case 'servicios': return servicios.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
      case 'productos': 
        return productos.filter(p => 
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (categoriaFiltroProducto === 'todas' || p.categoria === categoriaFiltroProducto)
        );
      case 'disenos': 
        return disenos.filter(d => 
          d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (servicioFiltroDiseno === 'todos' || d.servicioId === parseInt(servicioFiltroDiseno))
        );
      case 'materiales': 
        return materiales.filter(m => 
          m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (servicioFiltroMaterial === 'todos' || m.servicioId === parseInt(servicioFiltroMaterial))
        );
      case 'usuarios': return usuarios.filter(u => u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
      default: return [];
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const renderDashboard = () => {
    const dashboard = dashboardData;
    const stats = dashboard?.stats || {};
    const pedidosPorMes = dashboard?.pedidosPorMes || [];
    const pedidosPorEstado = dashboard?.pedidosPorEstado || [];
    const topServicios = dashboard?.topServicios || [];
    const pedidosRecientes = dashboard?.pedidosRecientes || [];

    const estadoLabels: Record<string, string> = {
      pendiente: 'Pendiente',
      en_cola: 'En Cola',
      imprimiendo: 'Imprimiendo',
      acabado: 'Acabado',
      entregado: 'Entregado'
    };

    const pieData = pedidosPorEstado.map((e: any) => ({
      name: estadoLabels[e.estado] || e.estado,
      value: e.cantidad
    }));

    return (
      <div className="admin-dashboard">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📦</span>
            <div className="stat-content">
              <span className="stat-value">{stats.totalPedidos || pedidos.length}</span>
              <span className="stat-label">Total Pedidos</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📅</span>
            <div className="stat-content">
              <span className="stat-value">{stats.pedidosHoy || 0}</span>
              <span className="stat-label">Pedidos Hoy</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div className="stat-content">
              <span className="stat-value">S/ {(stats.ingresosMes || 0).toFixed(0)}</span>
              <span className="stat-label">Ingresos del Mes</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <div className="stat-content">
              <span className="stat-value">S/ {(stats.ticketPromedio || 0).toFixed(2)}</span>
              <span className="stat-label">Ticket Promedio</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div className="stat-content">
              <span className="stat-value">{stats.usuariosActivos || usuarios.length}</span>
              <span className="stat-label">Clientes Activos</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏳</span>
            <div className="stat-content">
              <span className="stat-value">{pedidos.filter(p => p.estadoProduccion === 'pendiente').length}</span>
              <span className="stat-label">Pendientes</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Gráfico de pedidos por mes */}
          <div className="chart-card">
            <h3>📈 Pedidos por Mes</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pedidosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'cantidad' ? `${value} pedidos` : `S/ ${value}`,
                      name === 'cantidad' ? 'Pedidos' : 'Ingresos'
                    ]}
                  />
                  <Bar dataKey="cantidad" fill="#3498db" name="cantidad" />
                  <Bar dataKey="ingresos" fill="#27ae60" name="ingresos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de distribución por estado */}
          <div className="chart-card">
            <h3>📊 Distribución por Estado</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Servicios y Pedidos Recientes */}
        <div className="bottom-grid">
          <div className="chart-card">
            <h3>🏆 Top Servicios</h3>
            <div className="top-servicios-list">
              {topServicios.map((s: any, index: number) => (
                <div key={index} className="servicio-item">
                  <span className="servicio-icon">{s.icono || '📦'}</span>
                  <div className="servicio-info">
                    <span className="servicio-nombre">{s.nombre}</span>
                    <div className="servicio-bar">
                      <div 
                        className="servicio-bar-fill" 
                        style={{ 
                          width: `${(s.pedidos / (topServicios[0]?.pedidos || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <span className="servicio-stats">{s.pedidos} pedidos</span>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-orders">
            <h3>📋 Pedidos Recientes</h3>
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Cliente</th><th>Servicio</th><th>Total</th><th>Estado</th><th>Acción</th></tr>
              </thead>
              <tbody>
                {pedidosRecientes.slice(0, 5).map((p: any) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.cliente || '-'}</td>
                    <td>{p.servicio || '-'}</td>
                    <td>S/ {(p.total || 0).toFixed(2)}</td>
                    <td><span className={`badge badge-${p.estado}`}>{getEstadoLabel(p.estado)}</span></td>
                    <td>
                      <button className="btn-small" onClick={() => { setSelectedItem({ id: p.id, estadoProduccion: p.estado, trackingId: p.trackingId, total: p.total, tipoItem: 'servicio', fechaCreacion: p.fecha }); setTab('pedidos'); }}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const exportPedidosExcel = () => {
    const data = pedidos.map(p => ({
      'ID': p.id,
      'Tipo': p.tipoItem || 'servicio',
      'Producto/Servicio': p.itemNombre || p.servicioId || '-',
      'Tracking': p.trackingId || '-',
      'Fecha': new Date(p.fechaCreacion).toLocaleDateString(),
      'Total': p.total || 0,
      'Estado': getEstadoLabel(p.estadoProduccion),
      'Cliente': p.pedidoClienteNombre || '-',
      'Teléfono': p.pedidoClienteTelefono || '-',
      'Email': p.pedidoClienteEmail || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    XLSX.writeFile(wb, `pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportServiciosExcel = () => {
    const data = servicios.map(s => ({
      'ID': s.id,
      'Icono': s.icono,
      'Nombre': s.nombre,
      'Descripción': s.descripcion,
      'Precio Base': s.precioBase,
      'Unidad': s.unidad,
      'Estado': s.activo ? 'Activo' : 'Inactivo',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Servicios');
    XLSX.writeFile(wb, `servicios_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportProductosExcel = () => {
    const data = productos.map(p => ({
      'ID': p.id,
      'Nombre': p.nombre,
      'Categoría': p.categoria || '-',
      'Precio': p.precio,
      'Precio Oferta': p.precioOferta || '-',
      'Stock': p.stock,
      'Unidad': p.unidad,
      'Estado': p.activo ? 'Activo' : 'Inactivo',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderPedidos = () => (
    <div className="admin-section">
      <div className="section-header">
        <h2>Gestión de Pedidos</h2>
        <div className="header-actions">
          <Button onClick={exportPedidosExcel}>📊 Exportar Excel</Button>
          <div className="filters">
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
              <option value="todos">Todos los estados</option>
              {ESTADOS.map(e => <option key={e} value={e}>{getEstadoLabel(e)}</option>)}
            </select>
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Cliente</th><th>Tipo</th><th>Producto/Servicio</th><th>Tracking</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {(searchTerm ? filteredItems() : pedidos)
            .filter(p => {
              if (sidebarFiltro === 'todos') return true;
              return p.servicioNombre === sidebarFiltro || p.itemNombre === sidebarFiltro;
            })
            .map(p => (
            <tr key={p.id}>
              <td>#{p.id}</td>
              <td>{p.pedidoClienteNombre || p.clienteNombre || p.cliente || '-'}</td>
              <td><span className={`badge ${p.tipoItem === 'producto' ? 'badge-info' : 'badge-warning'}`}>{p.tipoItem || 'servicio'}</span></td>
              <td>{p.itemNombre || p.servicioNombre || p.servicioId || '-'}</td>
              <td>{p.trackingId || '-'}</td>
              <td>{new Date(p.fechaCreacion).toLocaleDateString()}</td>
              <td>S/ {(p.total || 0).toFixed(2)}</td>
              <td><span className={`badge badge-${p.estadoProduccion}`}>{getEstadoLabel(p.estadoProduccion)}</span></td>
              <td>
                <button className="btn-small" onClick={() => { setSelectedItem(p); setShowModal(true); }}>Ver</button>
                  {getSiguienteEstado(p.estadoProduccion) && (
                    <button
                      className="btn-small btn-primary"
                      onClick={() => cambiarEstado(p.id, getSiguienteEstado(p.estadoProduccion)!)}
                      disabled={!p.disenoExiste}
                      title={!p.disenoExiste ? 'Se requiere diseño primero' : ''}
                      style={!p.disenoExiste ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                      → {getEstadoLabel(getSiguienteEstado(p.estadoProduccion)!)}
                    </button>
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderServicios = () => (
    <div className="admin-section">
      <div className="section-header">
        <h2>Gestión de Servicios</h2>
        <div className="header-actions">
          <Button onClick={exportServiciosExcel}>📊 Exportar</Button>
          <Button onClick={() => { setSelectedItem(null); setShowModal(true); }}>+ Nuevo Servicio</Button>
        </div>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Icono</th><th>Nombre</th><th>Precio</th><th>Unidad</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {(searchTerm ? filteredItems() : servicios).map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.icono}</td>
              <td>{s.nombre}</td>
              <td>S/ {(s.precioBase || 0).toFixed(2)}</td>
              <td>{s.unidad}</td>
              <td><span className={`badge ${s.activo ? 'badge-success' : 'badge-danger'}`}>{s.activo ? 'Activo' : 'Inactivo'}</span></td>
              <td>
                <button className="btn-small" onClick={() => { setSelectedItem(s); setShowModal(true); }}>Editar</button>
                <button className="btn-small" onClick={() => toggleActivo('servicios', s.id, s.activo)}>{s.activo ? 'Desactivar' : 'Activar'}</button>
                <button className="btn-small btn-danger" onClick={() => setShowDeleteConfirm({ open: true, type: 'servicios', id: s.id })}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderProductos = () => (
    <div className="admin-section">
      <div className="section-header">
        <h2>Gestión de Productos</h2>
        <div className="header-actions">
          <Button onClick={exportProductosExcel}>📊 Exportar</Button>
          <Button onClick={() => { setSelectedItem(null); setShowModal(true); }}>+ Nuevo Producto</Button>
        </div>
      </div>
      <div className="filters" style={{ padding: '0 0 16px 0' }}>
        <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Imagen</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {productos.filter(p => 
            (!searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
          ).map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.imagen ? <img src={p.imagen} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : '📦'}</td>
              <td>{p.nombre}</td>
              <td>{p.categoria || '-'}</td>
              <td>S/ {(p.precio || 0).toFixed(2)}</td>
              <td>{p.stock || 0}</td>
              <td><span className={`badge ${p.activo ? 'badge-success' : 'badge-danger'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
              <td>
                <button className="btn-small" onClick={() => { setSelectedItem(p); setShowModal(true); }}>Editar</button>
                <button className="btn-small" onClick={() => toggleActivo('productos', p.id, p.activo)}>{p.activo ? 'Desactivar' : 'Activar'}</button>
                <button className="btn-small btn-danger" onClick={() => setShowDeleteConfirm({ open: true, type: 'productos', id: p.id })}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDisenos = () => (
    <div className="admin-section">
      <div className="section-header">
        <h2>Gestión de Diseños</h2>
        <Button onClick={() => { setSelectedItem(null); setShowModal(true); }}>+ Nuevo Diseño</Button>
      </div>
      <div className="filters" style={{ padding: '0 0 16px 0' }}>
        <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select value={servicioFiltroDiseno} onChange={(e) => setServicioFiltroDiseno(e.target.value)}>
          <option value="todos">Todos los servicios</option>
          {servicios.filter(s => s.activo).map(s => (
            <option key={s.id} value={String(s.id)}>{s.icono} {s.nombre}</option>
          ))}
        </select>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Servicio</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {disenos.filter(d => 
            (!searchTerm || d.nombre.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (servicioFiltroDiseno === 'todos' || d.servicioId === parseInt(servicioFiltroDiseno))
          ).map(d => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.nombre}</td>
              <td>{d.descripcion || '-'}</td>
              <td>{servicios.find(s => s.id === d.servicioId)?.nombre || d.servicioId}</td>
              <td><span className={`badge ${d.activo ? 'badge-success' : 'badge-danger'}`}>{d.activo ? 'Activo' : 'Inactivo'}</span></td>
              <td>
                <button className="btn-small" onClick={() => { setSelectedItem(d); setShowModal(true); }}>Editar</button>
                <button className="btn-small" onClick={() => toggleActivo('disenos', d.id, d.activo)}>{d.activo ? 'Desactivar' : 'Activar'}</button>
                <button className="btn-small btn-danger" onClick={() => setShowDeleteConfirm({ open: true, type: 'disenos', id: d.id })}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMateriales = () => (
    <div className="admin-section">
      <div className="section-header">
        <h2>Gestión de Materiales</h2>
        <Button onClick={() => { setSelectedItem(null); setShowModal(true); }}>+ Nuevo Material</Button>
      </div>
      <div className="filters" style={{ padding: '0 0 16px 0' }}>
        <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select value={servicioFiltroMaterial} onChange={(e) => setServicioFiltroMaterial(e.target.value)}>
          <option value="todos">Todos los servicios</option>
          {servicios.filter(s => s.activo).map(s => (
            <option key={s.id} value={String(s.id)}>{s.icono} {s.nombre}</option>
          ))}
        </select>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {materiales.filter(m => 
            (!searchTerm || m.nombre.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (servicioFiltroMaterial === 'todos' || m.servicioId === parseInt(servicioFiltroMaterial))
          ).map(m => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.nombre}</td>
              <td>{m.tipo}</td>
              <td>S/ {(m.precioUnitario || 0).toFixed(2)}</td>
              <td>{m.stock}</td>
              <td><span className={`badge ${m.activo ? 'badge-success' : 'badge-danger'}`}>{m.activo ? 'Activo' : 'Inactivo'}</span></td>
              <td>
                <button className="btn-small" onClick={() => { setSelectedItem(m); setShowModal(true); }}>Editar</button>
                <button className="btn-small" onClick={() => toggleActivo('materiales', m.id, m.activo)}>{m.activo ? 'Desactivar' : 'Activar'}</button>
                <button className="btn-small btn-danger" onClick={() => setShowDeleteConfirm({ open: true, type: 'materiales', id: m.id })}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderUsuarios = () => (
    <div className="admin-section">
      <div className="section-header">
        <h2>Gestión de Usuarios</h2>
        <Button onClick={() => { setSelectedItem(null); setShowModal(true); }}>+ Nuevo Usuario</Button>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Email</th><th>WhatsApp</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {(searchTerm ? filteredItems() : usuarios).map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>{u.whatsapp || '-'}</td>
              <td><span className={`badge ${u.rol === 'admin' ? 'badge-warning' : u.rol === 'diseniador' ? 'badge-secondary' : 'badge-info'}`}>{u.rol}</span></td>
              <td><span className={`badge ${u.activo !== false ? 'badge-success' : 'badge-danger'}`}>{u.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
              <td>
                <button className="btn-small" onClick={() => { setSelectedItem(u); setShowModal(true); }}>Editar</button>
                <button className="btn-small" onClick={() => toggleActivo('admin/usuarios', u.id, u.activo !== false)}>{u.activo !== false ? 'Desactivar' : 'Activar'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

const handleSaveServicio = async (data: Partial<Servicio> & { id?: number }) => {
    setSaving(true);
    try {
      const isEdit = data.id && data.id > 0;
      const cleanData = {
        ...data,
        precioBase: Number(data.precioBase) || 0,
        activo: data.activo !== false
      };
      
      let apiSuccess = false;
      try {
        if (isEdit) {
          await request(`/servicios/${data.id}`, { method: 'PUT', data: cleanData });
        } else {
          await request('/servicios', { method: 'POST', data: cleanData });
        }
        apiSuccess = true;
      } catch (apiErr: any) {
        console.warn('API save failed, updating locally:', apiErr.message);
      }
      
      if (isEdit) {
        setServicios(prev => prev.map(s => s.id === data.id ? { ...s, ...cleanData } : s));
      } else {
        setServicios(prev => [...prev, { ...cleanData, id: -Date.now() } as any]);
      }
      
      if (apiSuccess) {
        queryClient.invalidateQueries({ queryKey: ['servicios'] });
        queryClient.invalidateQueries({ queryKey: ['servicios', 'todos'] });
      }
      
      setShowModal(false);
    } catch (err: any) { 
      console.error('Error:', err.message); 
      alert('Error: ' + (err.message || 'Error'));
    }
    setSaving(false);
};

  const handleSaveProducto = async (data: Partial<Producto> & { id?: number }) => {
    setSaving(true);
    try {
      const cleanData = {
        ...data,
        activo: data.activo !== false,
        precio: Number(data.precio) || 0,
        precioOferta: data.precioOferta ? Number(data.precioOferta) : null,
        stock: Number(data.stock) || 0
      };
      
      const productoId = selectedItem?.id;
      
      let savedId = productoId;
      let apiSuccess = false;
      try {
        if (productoId) {
          await request(`/productos/${productoId}`, { method: 'PUT', data: cleanData });
        } else {
          const result = await request('/productos', { method: 'POST', data: cleanData });
          if (result?.data?.id) {
            savedId = result.data.id;
          }
        }
        apiSuccess = true;
      } catch (apiErr: any) {
        console.warn('API save failed, updating locally:', apiErr.message);
        if (!productoId) {
          savedId = -Date.now();
        }
      }
      
      if (productoId) {
        setProductos(prev => prev.map(p => 
          p.id === productoId ? { ...p, ...cleanData } : p
        ));
      } else {
        setProductos(prev => [...prev, { ...cleanData, id: savedId } as any]);
      }
      
      if (apiSuccess) {
        queryClient.invalidateQueries({ queryKey: ['productos'] });
        queryClient.invalidateQueries({ queryKey: ['productos', 'todos'] });
      }
      
      setShowModal(false);
    } catch (err: any) { 
      console.error('Error:', err.message); 
      alert('Error: ' + (err.message || 'Error'));
    }
    setSaving(false);
  };

  const handleSaveDiseno = async (data: Partial<Diseno> & { imagen?: string; descripcion?: string; id?: number }) => {
    setSaving(true);
    console.log('Saving diseno:', JSON.stringify(data));
    try {
      if (!data.nombre || !data.servicioId || data.servicioId === 0) {
        alert('Nombre y servicio son requeridos');
        setSaving(false);
        return;
      }
      
      const cleanData: Record<string, any> = {
        nombre: data.nombre,
        servicioId: data.servicioId,
        activo: data.activo !== false,
      };
      
      if (data.descripcion !== undefined) {
        cleanData.descripcion = data.descripcion || null;
      }
      
      if (data.imagen !== undefined) {
        cleanData.imagen = data.imagen || null;
      }
      
      const isEdit = data.id && data.id > 0;
      const endpoint = isEdit ? `/disenos/${data.id}` : '/disenos';
      const method = isEdit ? 'PUT' : 'POST';
      
      let savedId = data.id;
      let apiSuccess = false;
      try {
        const result = await request(endpoint, { method, data: cleanData });
        apiSuccess = true;
        if (!isEdit && result?.data?.id) {
          savedId = result.data.id;
        }
      } catch (apiErr: any) {
        console.warn('API save failed, updating locally:', apiErr.message);
        if (!isEdit) {
          savedId = -Date.now();
        }
      }
      
      if (isEdit) {
        setDisenos(prev => prev.map(d => d.id === data.id ? { ...d, ...cleanData } : d));
      } else {
        setDisenos(prev => [...prev, { ...cleanData, id: savedId } as any]);
      }
      
      if (apiSuccess) {
        queryClient.invalidateQueries({ queryKey: ['disenos'] });
        queryClient.invalidateQueries({ queryKey: ['disenos', undefined] });
      }
      
      setShowModal(false);
    } catch (err: any) { 
      console.error('Error:', err.message); 
      alert('Error: ' + (err.response?.data?.mensaje || err.message || 'Error al guardar diseño'));
    }
    setSaving(false);
  };

  const handleSaveMaterial = async (data: Partial<Material> & { imagen?: string }) => {
    setSaving(true);
    console.log('Saving material:', JSON.stringify(data));
    try {
      if (!data.nombre || data.nombre.length < 1) {
        alert('El nombre es requerido');
        setSaving(false);
        return;
      }
      
      const cleanData: Record<string, any> = {
        nombre: data.nombre,
        tipo: data.tipo || '',
        precioUnitario: Number(data.precioUnitario) || 0,
        stock: Number(data.stock) || 0,
        activo: data.activo !== false,
      };
      
      if (data.descripcion !== undefined) {
        cleanData.descripcion = data.descripcion || null;
      }
      
      if (data.servicioId && data.servicioId > 0) {
        cleanData.servicioId = data.servicioId;
      }
      
      console.log('Clean data:', JSON.stringify(cleanData));
      
      let savedId = data.id;
      let apiSuccess = false;
      try {
        if (data.id) {
          await request(`/materiales/${data.id}`, { method: 'PUT', data: cleanData });
        } else {
          const result = await request('/materiales', { method: 'POST', data: cleanData });
          if (result?.data?.id) {
            savedId = result.data.id;
          }
        }
        apiSuccess = true;
      } catch (apiErr: any) {
        console.warn('API save failed, updating locally:', apiErr.message);
        if (!data.id) {
          savedId = -Date.now();
        }
      }
      
      if (data.id) {
        setMateriales(prev => prev.map(m => m.id === data.id ? { ...m, ...cleanData } : m));
      } else {
        setMateriales(prev => [...prev, { ...cleanData, id: savedId } as any]);
      }
      
      if (apiSuccess) {
        queryClient.invalidateQueries({ queryKey: ['materiales'] });
      }
      
      setShowModal(false);
    } catch (err: any) { 
      console.error('Error:', err.message); 
      console.error('Error response:', err.response?.data);
      alert('Error: ' + (err.response?.data?.mensaje || err.message || 'Error al guardar material'));
    }
    setSaving(false);
  };

  const handleSaveUsuario = async (data: Partial<Usuario> & { password?: string }) => {
    setSaving(true);
    try {
      if (!data.nombre || !data.email) {
        alert('Nombre y email son requeridos');
        setSaving(false);
        return;
      }
      if (!data.id && !data.password) {
        data.password = 'password123';
      }
      
      let apiSuccess = false;
      try {
        if (data.id) {
          await request(`/admin/usuarios/${data.id}`, { method: 'PUT', data });
        } else {
          await request('/admin/usuarios', { method: 'POST', data });
        }
        apiSuccess = true;
      } catch (apiErr: any) {
        console.warn('API save failed, updating locally:', apiErr.message);
      }
      
      if (data.id) {
        setUsuarios(prev => prev.map(u => u.id === data.id ? { ...u, ...data } : u));
      } else {
        setUsuarios(prev => [...prev, { ...data, id: -Date.now() } as any]);
      }
      
      if (apiSuccess) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      }
      
      setShowModal(false);
    } catch (err: any) { 
      console.error('Error:', err.message); 
      alert('Error: ' + (err.message || 'Error al guardar usuario'));
    }
    setSaving(false);
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Panel de Administración CROMA</h1>
        <Button variant="outline" onClick={() => navigate('/')}>← Volver al Inicio</Button>
      </header>

      <nav className="admin-nav">
          {(esDiseniador ? (['dashboard', 'pedidos'] as Tab[]) : (['dashboard', 'pedidos', 'servicios', 'productos', 'disenos', 'materiales', 'usuarios'] as Tab[])).map(t => (
            <button key={t} className={`nav-btn ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setSearchTerm(''); setServicioFiltroDiseno('todos'); setServicioFiltroMaterial('todos'); setCategoriaFiltroProducto('todas'); setServicioFiltro('todos'); }}>
            {t === 'dashboard' && '📊 Dashboard'}
            {t === 'pedidos' && '📦 Pedidos'}
            {t === 'servicios' && '🛠️ Servicios'}
            {t === 'productos' && '📋 Productos'}
            {t === 'disenos' && '🎨 Diseños'}
            {t === 'materiales' && '📦 Materiales'}
            {t === 'usuarios' && '👥 Usuarios'}
          </button>
        ))}
      </nav>

      <main className="admin-content">
        {tab === 'pedidos' && (
          <aside className="admin-sidebar">
            <button
              className={`sidebar-btn ${sidebarFiltro === 'todos' ? 'active' : ''}`}
              onClick={() => setSidebarFiltro('todos')}
            >📋 Todos</button>
            <button className="sidebar-toggle" onClick={() => setSidebarExpand(prev => ({ ...prev, servicios: !prev.servicios }))}>
              🛠️ Servicios {sidebarExpand.servicios ? '▼' : '▶'}
            </button>
            {sidebarExpand.servicios && [...new Set(pedidos.map(p => p.servicioNombre).filter(Boolean))].map(s => (
              <button
                key={s}
                className={`sidebar-btn sidebar-sub ${sidebarFiltro === s ? 'active' : ''}`}
                onClick={() => { setSidebarFiltro(s!); setTipoFiltro('servicio'); }}
              >{s}</button>
            ))}
            <button className="sidebar-toggle" onClick={() => setSidebarExpand(prev => ({ ...prev, productos: !prev.productos }))}>
              📦 Productos {sidebarExpand.productos ? '▼' : '▶'}
            </button>
            {sidebarExpand.productos && [...new Set(pedidos.map(p => p.itemNombre).filter(Boolean))].map(n => (
              <button
                key={n}
                className={`sidebar-btn sidebar-sub ${sidebarFiltro === n ? 'active' : ''}`}
                onClick={() => { setSidebarFiltro(n!); setTipoFiltro('producto'); }}
              >{n}</button>
            ))}
          </aside>
        )}
        <div className="admin-main-content">
          {tab === 'dashboard' && renderDashboard()}
          {tab === 'pedidos' && renderPedidos()}
          {tab === 'servicios' && renderServicios()}
          {tab === 'productos' && renderProductos()}
          {tab === 'disenos' && renderDisenos()}
          {tab === 'materiales' && renderMateriales()}
          {tab === 'usuarios' && renderUsuarios()}
      </div>
      </main>

      <Modal open={showModal} onOpenChange={setShowModal} title={selectedItem ? (tab === 'pedidos' ? `Pedido #${selectedItem.id}` : `Editar ${tab.slice(0, -1)}`) : `Nuevo ${tab.slice(0, -1)}`} size="lg">
        {tab === 'servicios' && (
          <FormServicio 
            servicio={selectedItem} 
            onSave={handleSaveServicio} 
            onCancel={() => setShowModal(false)}
            saving={saving}
          />
        )}
        {tab === 'productos' && (
          <FormProducto 
            producto={selectedItem} 
            onSave={handleSaveProducto} 
            onCancel={() => setShowModal(false)}
            saving={saving}
          />
        )}
        {tab === 'disenos' && (
          <FormDiseno 
            diseno={selectedItem}
            servicios={serviciosData?.servicios || []}
            onSave={handleSaveDiseno as any}
            onCancel={() => setShowModal(false)}
            saving={saving}
          />
        )}
        {tab === 'materiales' && (
          <FormMaterial 
            material={selectedItem}
            servicios={serviciosData?.servicios || []}
            onSave={handleSaveMaterial as any}
            onCancel={() => setShowModal(false)}
            saving={saving}
          />
        )}
        {tab === 'usuarios' && (
          <FormUsuario 
            usuario={selectedItem}
            onSave={handleSaveUsuario}
            onCancel={() => setShowModal(false)}
            saving={saving}
          />
        )}
        {tab === 'pedidos' && selectedItem && (
          <PedidoDetalle 
            pedido={selectedItem}
            onClose={() => setShowModal(false)}
            onEstadoChange={(nuevoEstado) => {
              cambiarEstado(selectedItem.id, nuevoEstado);
            }}
            diseniadores={diseniadores}
            esAdmin={esAdmin}
            esDiseniador={esDiseniador}
            currentUserId={currentUser?.id}
            onAsignarDiseniador={handleAsignarDiseniador}
          />
        )}
      </Modal>

      <ConfirmModal
        open={showDeleteConfirm.open}
        onOpenChange={(open) => setShowDeleteConfirm({ ...showDeleteConfirm, open })}
        title="Confirmar eliminación"
        message="¿Estás seguro de que deseas eliminar este elemento?"
        confirmText="Eliminar"
        onConfirm={() => eliminarItem(showDeleteConfirm.type, showDeleteConfirm.id!)}
        variant="danger"
      />
    </div>
  );
};

function FormServicio({ servicio, onSave, onCancel, saving }: { servicio?: Servicio | null; onSave: (data: Partial<Servicio> & { id?: number; imagen?: string }) => void; onCancel: () => void; saving: boolean }) {
  const [form, setForm] = useState({
    id: servicio?.id || undefined,
    nombre: servicio?.nombre || '',
    slug: servicio?.slug || '',
    descripcion: servicio?.descripcion || '',
    icono: servicio?.icono || '📦',
    precioBase: servicio?.precioBase || 0,
    unidad: servicio?.unidad || 'und',
    activo: servicio?.activo ?? true,
    imagen: servicio?.imagen || '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(servicio?.imagen || null);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setForm({ ...form, imagen: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data before save:', form);
    onSave({ ...form, slug: form.slug || generateSlug(form.nombre) });
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-row">
        <div className="form-group">
          <label>Nombre *</label>
          <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value, slug: generateSlug(e.target.value) })} required />
        </div>
        <div className="form-group">
          <label>Slug (URL)</label>
          <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label>Descripción</label>
        <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} />
      </div>
      <div className="form-group">
        <label>Imagen de Referencia</label>
        <div className="image-upload-container">
          {previewImage ? (
            <div className="image-preview">
              <img src={previewImage} alt="Preview" />
              <button type="button" className="remove-image" onClick={(e) => { e.stopPropagation(); setPreviewImage(null); setForm({ ...form, imagen: '' }); }}>✕</button>
            </div>
          ) : (
            <div className="image-upload-placeholder">
              <span>📷</span>
              <p>Sube una imagen</p>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} className="image-input" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Icono</label>
          <div className="icon-selector">
            {ICONOS.map(icon => (
              <button key={icon} type="button" className={`icon-btn ${form.icono === icon ? 'selected' : ''}`} onClick={() => setForm({ ...form, icono: icon })}>
                {icon}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Precio Base (S/)</label>
          <input type="number" step="0.01" value={form.precioBase} onChange={(e) => setForm({ ...form, precioBase: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Unidad</label>
          <select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>
            <option value="und">Unidad</option>
            <option value="millar">Millar</option>
            <option value="hora">Hora</option>
            <option value="proyecto">Proyecto</option>
            <option value="servicio">Servicio</option>
          </select>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
            Activo
          </label>
        </div>
      </div>
      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  );
}

function FormDiseno({ diseno, servicios, onSave, onCancel, saving }: { diseno?: Diseno | null; servicios: Servicio[]; onSave: (data: Partial<Diseno> & { imagen?: string; descripcion?: string; id?: number }) => void; onCancel: () => void; saving: boolean }) {
  const [form, setForm] = useState({
    id: diseno?.id || undefined,
    nombre: diseno?.nombre || '',
    descripcion: diseno?.descripcion || '',
    servicioId: diseno?.servicioId || servicios[0]?.id || 0,
    activo: diseno?.activo ?? true,
    imagen: diseno?.imagen || '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(diseno?.imagen || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setForm({ ...form, imagen: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-group">
        <label>Nombre *</label>
        <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
      </div>
      <div className="form-group">
        <label>Servicio *</label>
        <select value={form.servicioId} onChange={(e) => setForm({ ...form, servicioId: parseInt(e.target.value) })} required>
          <option value={0}>Seleccionar servicio...</option>
          {servicios.filter(s => s.activo).map(s => (
            <option key={s.id} value={s.id}>{s.icono} {s.nombre}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Descripción</label>
        <textarea 
          value={form.descripcion} 
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })} 
          rows={3} 
          placeholder="Describe las características del diseño..."
        />
      </div>
      <div className="form-group">
        <label>Imagen del Diseño</label>
        <div className="image-upload-container">
          {previewImage ? (
            <div className="image-preview">
              <img src={previewImage} alt="Preview" />
              <button type="button" className="remove-image" onClick={(e) => { e.stopPropagation(); setPreviewImage(null); setForm({ ...form, imagen: '' }); }}>✕</button>
            </div>
          ) : (
            <div className="image-upload-placeholder">
              <span>🎨</span>
              <p>Sube una imagen del diseño</p>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} className="image-input" />
        </div>
      </div>
      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
          Activo
        </label>
      </div>
      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  );
}

function FormMaterial({ material, servicios, onSave, onCancel, saving }: { material?: Material | null; servicios: Servicio[]; onSave: (data: Partial<Material> & { imagen?: string; id?: number }) => void; onCancel: () => void; saving: boolean }) {
  const [form, setForm] = useState({
    id: material?.id || undefined,
    nombre: material?.nombre || '',
    descripcion: material?.descripcion || '',
    servicioId: material?.servicioId || servicios[0]?.id || 0,
    tipo: material?.tipo || '',
    precioUnitario: material?.precioUnitario || 0,
    stock: material?.stock || 0,
    activo: material?.activo ?? true,
    imagen: material?.imagen || '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(material?.imagen || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setForm({ ...form, imagen: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-row">
        <div className="form-group">
          <label>Nombre *</label>
          <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Tipo</label>
          <input type="text" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} placeholder="ej: papel, cartulina" />
        </div>
      </div>
      <div className="form-group">
        <label>Descripción</label>
        <textarea 
          value={form.descripcion} 
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })} 
          rows={3} 
          placeholder="Describe las características del material..."
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Servicio *</label>
          <select value={form.servicioId} onChange={(e) => setForm({ ...form, servicioId: parseInt(e.target.value) })} required>
            <option value={0}>Seleccionar servicio...</option>
            {servicios.filter(s => s.activo).map(s => (
              <option key={s.id} value={s.id}>{s.icono} {s.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Precio Unitario (S/)</label>
          <input type="number" step="0.01" value={form.precioUnitario} onChange={(e) => setForm({ ...form, precioUnitario: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="form-group">
        <label>Imagen de Referencia</label>
        <div className="image-upload-container">
          {previewImage ? (
            <div className="image-preview">
              <img src={previewImage} alt="Preview" />
              <button type="button" className="remove-image" onClick={(e) => { e.stopPropagation(); setPreviewImage(null); setForm({ ...form, imagen: '' }); }}>✕</button>
            </div>
          ) : (
            <div className="image-upload-placeholder">
              <span>📦</span>
              <p>Sube una imagen del material</p>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} className="image-input" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Stock</label>
          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
            Activo
          </label>
        </div>
      </div>
      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  );
}

function FormUsuario({ usuario, onSave, onCancel, saving }: { usuario?: Usuario | null; onSave: (data: Partial<Usuario> & { password?: string }) => void; onCancel: () => void; saving: boolean }) {
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
    whatsapp: usuario?.whatsapp || '',
    rol: usuario?.rol || 'cliente',
    activo: usuario?.activo ?? true,
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario && !form.password) {
      alert('La contraseña es requerida para nuevos usuarios');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-row">
        <div className="form-group">
          <label>Nombre *</label>
          <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>WhatsApp</label>
          <input type="text" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="999111222" />
        </div>
        <div className="form-group">
          <label>Rol</label>
          <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
            <option value="cliente">Cliente</option>
            <option value="admin">Administrador</option>
            <option value="diseniador">Diseñador</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Contraseña {!usuario ? '*' : ''}</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!usuario} placeholder={usuario ? 'Dejar vacío para mantener' : ''} />
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
            Activo
          </label>
        </div>
      </div>
      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  );
}

function FormProducto({ producto, onSave, onCancel, saving }: { producto?: Producto | null; onSave: (data: Partial<Producto> & { id?: number }) => void; onCancel: () => void; saving: boolean }) {
  const [form, setForm] = useState({
    nombre: producto?.nombre || '',
    slug: producto?.slug || '',
    descripcion: producto?.descripcion || '',
    categoria: producto?.categoria || '',
    precio: producto?.precio || 0,
    precioOferta: producto?.precioOferta || '',
    stock: producto?.stock || 0,
    unidad: producto?.unidad || 'und',
    activo: producto?.activo ?? true,
    imagen: producto?.imagen || '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(producto?.imagen || null);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setForm({ ...form, imagen: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      ...form, 
      slug: form.slug || generateSlug(form.nombre),
      precioOferta: form.precioOferta ? parseFloat(form.precioOferta as string) : undefined
    });
  };

  const CATEGORIAS = ['Promocionales', 'Papeleria', 'Senalamientos', 'Etiquetas', 'Otros'];

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-row">
        <div className="form-group">
          <label>Nombre *</label>
          <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value, slug: generateSlug(e.target.value) })} required />
        </div>
        <div className="form-group">
          <label>Slug (URL)</label>
          <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label>Descripción</label>
        <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} placeholder="Describe las características del producto..." />
      </div>
      <div className="form-group">
        <label>Imagen de Referencia</label>
        <div className="image-upload-container">
          {previewImage ? (
            <div className="image-preview">
              <img src={previewImage} alt="Preview" />
              <button type="button" className="remove-image" onClick={(e) => { e.stopPropagation(); setPreviewImage(null); setForm({ ...form, imagen: '' }); }}>✕</button>
            </div>
          ) : (
            <div className="image-upload-placeholder">
              <span>📷</span>
              <p>Sube una imagen</p>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} className="image-input" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Categoría</label>
          <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            <option value="">Seleccionar...</option>
            {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Unidad</label>
          <select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>
            <option value="und">Unidad</option>
            <option value="millar">Millar</option>
            <option value="kg">Kilogramo</option>
            <option value="metro">Metro</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Precio (S/)</label>
          <input type="number" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="form-group">
          <label>Precio Oferta (S/)</label>
          <input type="number" step="0.01" value={form.precioOferta} onChange={(e) => setForm({ ...form, precioOferta: e.target.value })} placeholder="Opcional" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Stock</label>
          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
            Activo
          </label>
        </div>
      </div>
      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  );
}

interface PedidoDetalleProps {
  pedido: any;
  onClose: () => void;
  onEstadoChange: (estado: string) => void;
  diseniadores?: { id: number; nombre: string }[];
  esAdmin?: boolean;
  esDiseniador?: boolean;
  currentUserId?: number;
  onAsignarDiseniador?: (pedidoId: number, diseniadorId: number) => void;
}

const ESTADOS_PEDIDO = ['pendiente', 'en_cola', 'imprimiendo', 'acabado', 'entregado'];

function PedidoDetalle({ pedido, onClose, onEstadoChange, diseniadores, esAdmin, esDiseniador, currentUserId, onAsignarDiseniador }: PedidoDetalleProps) {
  const { data: detalle, isLoading } = useAdminPedido(pedido.id);
  const queryClient = useQueryClient();
  const [responsableId, setResponsableId] = useState<string>(
    String(pedido.diseniadorId || '')
  );

  useEffect(() => {
    setResponsableId(String(detalle?.diseniadorId || pedido.diseniadorId || ''));
  }, [detalle?.diseniadorId, pedido.diseniadorId]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [zipContents, setZipContents] = useState<ZipEntry[] | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipCurrentPath, setZipCurrentPath] = useState('');
  const [zipFileName, setZipFileName] = useState('');
  const [zipSearch, setZipSearch] = useState('');
  const zipSourceRef = useRef<string>('');
  const [entregaArchivo, setEntregaArchivo] = useState<File | null>(null);
  const [entregaVersion, setEntregaVersion] = useState('1.0');
  const [entregaComentario, setEntregaComentario] = useState('');
  const [entregaUrl, setEntregaUrl] = useState('');
  const [entregaSubiendo, setEntregaSubiendo] = useState(false);

  const handleEntregaSubmit = async () => {
    if (!entregaArchivo && !entregaUrl) return;
    setEntregaSubiendo(true);
    try {
      const formData = new FormData();
      if (entregaArchivo) formData.append('archivo', entregaArchivo);
      formData.append('version', entregaVersion || '1.0');
      formData.append('comentario', entregaComentario);
      if (entregaUrl) formData.append('url_descarga', entregaUrl);
      
      await request(`/pedidos/${pedido.id}/entrega`, {
        method: 'POST',
        data: formData,
      });
      setEntregaArchivo(null);
      setEntregaVersion('1.0');
      setEntregaComentario('');
      setEntregaUrl('');
      const fileInput = document.getElementById('entrega-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      queryClient.invalidateQueries({ queryKey: ['admin', 'pedidos', pedido.id] });
    } catch (err: any) {
      console.error('Error al subir entrega:', err);
      alert('Error al subir entrega: ' + (err.message || 'Error'));
    }
    setEntregaSubiendo(false);
  };

  const descargarArchivoZip = async (zipNombre: string, file: ZipEntry) => {
    try {
      const src = zipSourceRef.current;
      if (!src) return;
      const commaPos = src.indexOf(',');
      const base64 = commaPos >= 0 ? src.substring(commaPos + 1) : src;
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const zip = await JSZip.loadAsync(bytes);
      const entry = zip.files[file.path];
      if (!entry || entry.dir) return;
      const blob = await entry.async('blob');
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = file.nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error('Error al descargar archivo del ZIP:', err);
      alert('Error al descargar el archivo del ZIP');
    }
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = { 
      pendiente: 'Pendiente', 
      en_cola: 'En Cola', 
      imprimiendo: 'Imprimiendo', 
      acabado: 'Acabado', 
      entregado: 'Entregado' 
    };
    return labels[estado] || estado;
  };

  const getSiguienteEstado = (actual: string): string | null => {
    const idx = ESTADOS_PEDIDO.indexOf(actual);
    return idx < ESTADOS_PEDIDO.length - 1 ? ESTADOS_PEDIDO[idx + 1] : null;
  };

  const getTipoArchivoIcon = (formato: string) => {
    if (!formato) return '📄';
    const ext = formato.toLowerCase();
    if (ext.includes('pdf')) return '📕';
    if (ext.includes('jpg') || ext.includes('jpeg') || ext.includes('png') || ext.includes('gif')) return '🖼️';
    if (ext.includes('doc') || ext.includes('docx')) return '📝';
    if (ext.includes('xls') || ext.includes('xlsx')) return '📊';
    if (ext.includes('ai') || ext.includes('psd') || ext.includes('svg')) return '🎨';
    return '📄';
  };

  const formatearBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '—';
    const unidades = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < unidades.length - 1) { size /= 1024; i++; }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${unidades[i]}`;
  };

  const getIconoArchivo = (ext?: string, dir?: boolean) => {
    if (dir) return '📁';
    if (!ext) return '📄';
    const e = ext.toLowerCase();
    if (['jpg','jpeg','png','gif','svg','webp','bmp','ico'].includes(e)) return '🖼️';
    if (e === 'pdf') return '📕';
    if (['doc','docx'].includes(e)) return '📝';
    if (['xls','xlsx','csv'].includes(e)) return '📊';
    if (['ai','psd','eps'].includes(e)) return '🎨';
    if (['zip','rar','7z','gz','tar'].includes(e)) return '📦';
    if (['mp4','avi','mov','mkv','wmv'].includes(e)) return '🎬';
    if (['mp3','wav','flac','aac'].includes(e)) return '🎵';
    if (['html','css','js','ts','jsx','tsx','json','xml'].includes(e)) return '💻';
    if (['ttf','otf','woff','woff2'].includes(e)) return '🔤';
    return '📄';
  };

  const descargarArchivo = async (url: string, nombre: string) => {
    try {
      const link = window.document.createElement('a');
      link.href = url;
      link.download = nombre || 'archivo';
      link.target = '_blank';
      link.click();
    } catch (err) {
      console.error('Error al descargar:', err);
    }
  };

  const abrirPreview = async (url: string, nombre: string, tipo: string) => {
    const esZip = tipo === 'zip' || tipo === 'rar';
    if (esZip) {
      setZipLoading(true);
      setZipFileName(nombre);
      setZipCurrentPath('');
      setZipContents(null);
      setZipSearch('');
      zipSourceRef.current = url;
      setShowPreview(false);
      try {
        const commaPos = url.indexOf(',');
        const base64 = commaPos >= 0 ? url.substring(commaPos + 1) : url;
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const zip = await JSZip.loadAsync(bytes);
        const allFiles: ZipEntry[] = [];
        zip.forEach((relPath) => {
          const isDir = relPath.endsWith('/');
          const parts = relPath.split('/').filter(Boolean);
          const filename = parts[parts.length - 1] || relPath;
          const dotIdx = filename.lastIndexOf('.');
          const ext = !isDir && dotIdx > 0 ? filename.substring(dotIdx + 1) : undefined;
          const entry = zip.files[relPath];
          const rawSize = !isDir ? (entry as any)._data?.uncompressedSize : undefined;
          allFiles.push({
            path: relPath,
            nombre: filename,
            dir: isDir,
            tamano: typeof rawSize === 'number' && rawSize > 0 ? rawSize : undefined,
            fecha: entry.date ? entry.date.toISOString() : undefined,
            ext,
          });
        });
        setZipContents(allFiles);
      } catch (err) {
        console.error('Error al extraer ZIP:', err);
        setZipContents([]);
      }
      setZipLoading(false);
    } else {
      setPreviewUrl(url);
      setShowPreview(true);
    }
  };

  const getItemsAtPath = (files: ZipEntry[], currentPath: string, search: string) => {
    const prefix = currentPath ? currentPath + '/' : '';
    const seen = new Set<string>();
    const items: (ZipEntry & {fullPath: string})[] = [];
    const q = search.toLowerCase().trim();
    files.forEach(f => {
      if (!f.path.startsWith(prefix)) return;
      const rest = f.path.substring(prefix.length);
      const slashIdx = rest.indexOf('/');
      if (slashIdx < 0) {
        if (!seen.has(rest)) {
          seen.add(rest);
          if (!q || f.nombre.toLowerCase().includes(q)) {
            items.push({ ...f, fullPath: f.path });
          }
        }
      } else {
        const folderName = rest.substring(0, slashIdx);
        if (!seen.has(folderName)) {
          seen.add(folderName);
          const hasMatch = q ? files.some(x => x.path.startsWith(prefix + folderName + '/') && x.nombre.toLowerCase().includes(q)) : true;
          if (!q || hasMatch || folderName.toLowerCase().includes(q)) {
            items.push({ nombre: folderName, dir: true, fullPath: prefix + folderName + '/', path: '', tamano: undefined, fecha: undefined, ext: undefined });
          }
        }
      }
    });
    items.sort((a, b) => {
      if (a.dir && !b.dir) return -1;
      if (!a.dir && b.dir) return 1;
      return a.nombre.localeCompare(b.nombre);
    });
    return items;
  };

  const volverCarpeta = () => {
    const parent = zipCurrentPath.split('/').filter(Boolean).slice(0, -1).join('/');
    setZipCurrentPath(parent);
  };

  const getRutaActual = () => {
    return zipCurrentPath || '(raíz)';
  }; 

  const siguienteEstado = getSiguienteEstado(pedido.estadoProduccion);

  if (isLoading) {
    return <div className="pedido-detalle-loading"><Spinner /> Cargando detalles...</div>;
  }

  return (
    <div className="pedido-detalle">
      {esAdmin && (
        <div className="detalle-seccion" style={{ marginBottom: 16 }}>
          <h4>👤 Asignar responsable</h4>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#666' }}>
            Administrador o diseñador del equipo.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            >
              <option value="">Sin asignar</option>
              {(diseniadores || []).map((d: { id: number; nombre: string; rol?: string }) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} ({d.rol === 'admin' ? 'Admin' : 'Diseñador'})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-small btn-primary"
              disabled={!responsableId}
              onClick={() => {
                if (onAsignarDiseniador && responsableId) {
                  onAsignarDiseniador(pedido.id, Number(responsableId));
                }
              }}
            >
              Asignar responsable
            </button>
          </div>
          {detalle?.diseniadorNombre && (
            <p style={{ marginTop: 8, fontSize: 13 }}>
              Actual: <strong>{detalle.diseniadorNombre}</strong>
            </p>
          )}
        </div>
      )}
      {esDiseniador && detalle?.diseniadorId === currentUserId && (
        <div className="detalle-seccion tarea-asignada" style={{ marginBottom: 16 }}>
          <div className="tarea-header">
            <span className="tarea-icono" style={{ fontSize: 24, marginRight: 8 }}>📩</span>
            <h4 style={{ margin: 0 }}>Tarea Asignada</h4>
          </div>
          <div className="tarea-cuerpo" style={{ background: '#f8f9fa', padding: 16, borderRadius: 8, border: '1px solid #e0e0e0', marginTop: 8 }}>
            <p><strong>De:</strong> Administración CROMA</p>
            <p><strong>Asunto:</strong> Trabajo pendiente</p>
            <p><strong>Mensaje:</strong> Tienes trabajo pendiente. El dueño te asignó la siguiente tarea:</p>
            <div className="tarea-detalle" style={{ background: '#fff', padding: 12, borderRadius: 6, marginTop: 8 }}>
              <p>📦 <strong>Pedido:</strong> #{detalle?.trackingId || detalle?.id}</p>
              <p>🛠️ <strong>Servicio:</strong> {detalle?.servicioNombre || '-'}</p>
              <p>📋 <strong>Estado actual:</strong> {getEstadoLabel(detalle?.estadoProduccion)}</p>
            </div>
            {siguienteEstado && (
              <button 
                className="btn-avanzar"
                onClick={() => onEstadoChange(siguienteEstado!)}
                style={{ marginTop: 12, padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                Avanzar a {getEstadoLabel(siguienteEstado)} →
              </button>
            )}
          </div>
        </div>
      )}
      {/* Información General */}
      <div className="detalle-grid">
        <div className="detalle-seccion">
          <h4>📋 Información del Pedido</h4>
          <div className="detalle-info">
            <div className="info-row">
              <span className="info-label">ID:</span>
              <span className="info-value">#{pedido.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Tracking:</span>
              <span className="info-value tracking-code">{pedido.trackingId || 'Sin asignar'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Servicio:</span>
              <span className="info-value">{detalle?.servicioNombre || pedido.servicioId || '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Tipo:</span>
              <span className="info-value">{pedido.tipoItem || 'servicio'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total:</span>
              <span className="info-value total">S/ {(pedido.total || 0).toFixed(2)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Fecha:</span>
              <span className="info-value">{pedido.fechaCreacion ? new Date(pedido.fechaCreacion).toLocaleDateString() : '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Estado:</span>
              <span className={`badge badge-${pedido.estadoProduccion}`}>{getEstadoLabel(pedido.estadoProduccion)}</span>
            </div>
          </div>
        </div>

        <div className="detalle-seccion">
          <h4>👤 Datos del Cliente</h4>
          <div className="detalle-info">
            <div className="info-row">
              <span className="info-label">Nombre:</span>
              <span className="info-value">{detalle?.clienteNombre || pedido.pedidoClienteNombre || pedido.clienteNombre || '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{detalle?.clienteEmail || pedido.pedidoClienteEmail || pedido.clienteEmail || '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Teléfono:</span>
              <span className="info-value">{detalle?.clienteWhatsapp || pedido.pedidoClienteTelefono || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Diseño Principal */}
      <div className="detalle-seccion">
        <h4>🎨 Diseño Principal</h4>
        {detalle?.diseno ? (
          <div className="diseno-content">
            <div className="diseno-info">
              <span className="diseno-tipo">
                Tipo: {
                  detalle.diseno.tipoCarga === 'catalogo' ? '📁 Diseño del Catálogo' :
                  detalle.diseno.tipoCarga === 'archivo' ? '📤 Archivo Subido' :
                  detalle.diseno.tipoCarga === 'externo' ? '🔗 Enlace Externo' : 'Desconocido'
                }
              </span>
              {detalle.diseno.archivoNombre && (
                <span className="diseno-nombre">Archivo: {detalle.diseno.archivoNombre}</span>
              )}
              {detalle.diseno.catalogo?.nombre && (
                <span className="diseno-nombre">Diseño: {detalle.diseno.catalogo.nombre}</span>
              )}
            </div>
            
            {/* Previsualización del diseño */}
            <div className="diseno-preview">
              {detalle.diseno.tipoCarga === 'externo' && detalle.diseno.enlaceExterno ? (
                <div className="preview-externo">
                  <a href={detalle.diseno.enlaceExterno} target="_blank" rel="noopener noreferrer" className="enlace-externo-btn">
                    🌐 Ver Enlace Externo
                  </a>
                </div>
              ) : detalle.diseno.archivoUrl || detalle.diseno.catalogo?.imagen ? (
                <>
                  <div className="preview-image-container">
                    <img 
                      src={detalle.diseno.archivoUrl || detalle.diseno.catalogo?.imagen} 
                      alt="Diseño del pedido"
                      className="preview-image"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style=\"padding:20px;color:#94a3b8;font-size:13px\">📭 Imagen no disponible</span>'; }}
                      onClick={() => {
                        setPreviewUrl(detalle.diseno.archivoUrl || detalle.diseno.catalogo?.imagen);
                        setShowPreview(true);
                      }}
                    />
                  </div>
                  <div className="preview-actions">
                    <Button variant="outline" onClick={() => {
                      setPreviewUrl(detalle.diseno.archivoUrl || detalle.diseno.catalogo?.imagen);
                      setShowPreview(true);
                    }}>
                      👁️ Ver
                    </Button>
                    <Button onClick={() => descargarArchivo(
                      detalle.diseno.archivoUrl || detalle.diseno.catalogo?.imagen,
                      detalle.diseno.archivoNombre || 'diseno'
                    )}>
                      ⬇️ Descargar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="preview-vacio">
                  <span>📭 No hay diseño disponible</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="diseno-vacio">
            <span>📭 No hay diseño asociado a este pedido</span>
          </div>
        )}
      </div>

      {/* Detalles del Pedido (opciones/config) */}
      {detalle?.config?.opciones && (() => {
        const opts = typeof detalle.config.opciones === 'string' 
          ? JSON.parse(detalle.config.opciones) 
          : detalle.config.opciones;
        if (!opts || Object.keys(opts).length === 0) return null;
        
        const camposOmitidos = ['complementarios', 'referencias', 'dimensiones', 'detalle'];
        const camposExtra = Object.keys(opts).filter(k => !camposOmitidos.includes(k) && !Array.isArray(opts[k]));
        
        const todosArchivos = [
          ...(opts.referencias || []).map((r: any) => ({ ...r, _tipo: 'referencia' })),
          ...(opts.complementarios || []).map((r: any) => ({ ...r, _tipo: 'complementario' })),
        ];
        return (
          <>
            {(opts.dimensiones?.ancho || opts.detalle || camposExtra.length > 0) && (
              <div className="detalle-seccion">
                <h4>📋 Detalles del Pedido</h4>
                {opts.dimensiones?.ancho && opts.dimensiones?.alto && (
                  <div className="info-row">
                    <span className="info-label">Dimensiones:</span>
                    <span className="info-value">{opts.dimensiones.ancho} x {opts.dimensiones.alto} cm</span>
                  </div>
                )}
                {opts.detalle && (
                  <div className="detalle-info">
                    <span className="info-label">Descripción:</span>
                    <p style={{margin: '4px 0', fontSize: 13, color: '#4b5563', lineHeight: 1.5, whiteSpace: 'pre-wrap'}}>{opts.detalle}</p>
                  </div>
                )}
                {camposExtra.map(key => {
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                  const val = opts[key];
                  if (val === null || val === undefined || val === '') return null;
                  return (
                    <div key={key} className="info-row">
                      <span className="info-label">{label}:</span>
                      <span className="info-value">{typeof val === 'boolean' ? (val ? '✅ Sí' : '❌ No') : String(val)}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {todosArchivos.length > 0 && (
              <div className="detalle-seccion">
                <h4>📎 Archivos del Pedido ({todosArchivos.length})</h4>
                <div className="archivos-list">
                  {todosArchivos.map((f: any, i: number) => {
                    const isImg = f.tipo && ['jpg','jpeg','png','gif','svg'].includes(f.tipo.toLowerCase());
                    const isPdf = f.tipo === 'pdf';
                    const isZip = f.tipo === 'zip' || f.tipo === 'rar';
                    return (
                      <div key={i} className="archivo-item">
                        <span className="archivo-icon">{isPdf ? '📕' : isImg ? '🖼️' : isZip ? '📦' : '📄'}</span>
                        <div className="archivo-info">
                          <span className="archivo-nombre">{f.nombre}</span>
                          {f._tipo === 'referencia' && <span className="archivo-meta">Referencia</span>}
                        </div>
                        <div className="archivo-actions">
                          <button className="btn-small" onClick={() => abrirPreview(f.url, f.nombre, f.tipo)} title="Vista previa">👁️</button>
                          <button className="btn-small" onClick={() => { const a = document.createElement('a'); a.href = f.url; a.download = f.nombre; document.body.appendChild(a); a.click(); document.body.removeChild(a); }} title="Descargar">⬇️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Datos específicos del servicio */}
      {detalle?.servicioExtra && (() => {
        const s = detalle.servicioExtra;
        const svc = detalle.servicioNombre || '';
        if (svc.includes('IMPRESIONES')) return (
          <div className="detalle-seccion">
            <h4>🖨️ Detalles de Impresión</h4>
            <div className="detalle-info">
              <div className="info-row"><span className="info-label">Tamaño:</span><span className="info-value">{s.tamano || '-'}</span></div>
              <div className="info-row"><span className="info-label">Orientación:</span><span className="info-value">{s.orientacion || '-'}</span></div>
              <div className="info-row"><span className="info-label">Resolución:</span><span className="info-value">{s.resolucion || '-'} DPI</span></div>
              <div className="info-row"><span className="info-label">Tipo Papel:</span><span className="info-value">{s.tipo_papel || '-'}</span></div>
              <div className="info-row"><span className="info-label">Color:</span><span className="info-value">{s.color || '-'}</span></div>
              <div className="info-row"><span className="info-label">Cantidad:</span><span className="info-value">{s.cantidad || 0}</span></div>
            </div>
          </div>
        );
        if (svc.includes('EMPASTADOS')) return (
          <div className="detalle-seccion">
            <h4>📚 Detalles de Empastado</h4>
            <div className="detalle-info">
              <div className="info-row"><span className="info-label">Tipo Tapa:</span><span className="info-value">{s.tipo_tapa || '-'}</span></div>
              <div className="info-row"><span className="info-label">Grabado:</span><span className="info-value">{s.grabado || '-'}</span></div>
              <div className="info-row"><span className="info-label">Corrección Académica:</span><span className="info-value">{s.correccion_academica ? '✅ Sí' : '❌ No'}</span></div>
              <div className="info-row"><span className="info-label">Impresión Interna:</span><span className="info-value">{s.impresion_interna ? '✅ Sí' : '❌ No'}</span></div>
            </div>
          </div>
        );
        if (svc.includes('FOTOCHECK')) return (
          <div className="detalle-seccion">
            <h4>🪪 Detalles de Fotocheck</h4>
            <div className="detalle-info">
              <div className="info-row"><span className="info-label">Diseño Propio:</span><span className="info-value">{s.usa_diseno_propio ? '✅ Sí' : '❌ No'}</span></div>
              <div className="info-row"><span className="info-label">Carga Masiva:</span><span className="info-value">{s.carga_masiva ? '✅ Sí' : '❌ No'}</span></div>
              {s.url_csv && <div className="info-row"><span className="info-label">URL CSV:</span><span className="info-value">{s.url_csv}</span></div>}
              <div className="info-row"><span className="info-label">Cantidad:</span><span className="info-value">{s.cantidad || 0}</span></div>
              {s.notas && <div className="info-row"><span className="info-label">Notas:</span><span className="info-value">{s.notas}</span></div>}
            </div>
          </div>
        );
        if (svc.includes('SELLOS')) return (
          <div className="detalle-seccion">
            <h4>🔴 Detalles del Sello</h4>
            <div className="detalle-info">
              <div className="info-row"><span className="info-label">Tipo Sello:</span><span className="info-value">{s.tipo_sello || '-'}</span></div>
              <div className="info-row"><span className="info-label">Mecanismo:</span><span className="info-value">{s.mecanismo || '-'}</span></div>
              <div className="info-row"><span className="info-label">Forma:</span><span className="info-value">{s.forma || '-'}</span></div>
              <div className="info-row"><span className="info-label">Texto:</span><span className="info-value">{s.contenido_texto || '-'}</span></div>
              <div className="info-row"><span className="info-label">Usa Diseño Existente:</span><span className="info-value">{s.usa_diseno_existente ? '✅ Sí' : '❌ No'}</span></div>
              <div className="info-row"><span className="info-label">Firma Vectorizada:</span><span className="info-value">{s.firma_vectorizada ? '✅ Sí' : '❌ No'}</span></div>
              <div className="info-row"><span className="info-label">Estado Producción:</span><span className="info-value">{s.estado_produccion || 'pendiente'}</span></div>
            </div>
          </div>
        );
        if (svc.includes('EDICION') || svc.includes('AUDIO')) return (
          <div className="detalle-seccion">
            <h4>🎬 Detalles de Edición de Video</h4>
            <div className="detalle-info">
              {s.enlace_externo && <div className="info-row"><span className="info-label">Enlace:</span><span className="info-value"><a href={s.enlace_externo} target="_blank" rel="noreferrer">{s.enlace_externo}</a></span></div>}
              {s.duracion_estimada && <div className="info-row"><span className="info-label">Duración:</span><span className="info-value">{s.duracion_estimada}</span></div>}
              <div className="info-row"><span className="info-label">Formato Salida:</span><span className="info-value">{s.formato_salida || 'mp4'}</span></div>
              {s.instrucciones && <div className="info-row"><span className="info-label">Instrucciones:</span><span className="info-value">{s.instrucciones}</span></div>}
            </div>
          </div>
        );
        if (svc.includes('DISENO DE LOGOS') || svc.includes('DISEÑO DE LOGOS')) return (
          <div className="detalle-seccion">
            <h4>🎨 Detalles del Diseño de Logos</h4>
            <div className="detalle-info">
              <div className="info-row"><span className="info-label">Marca:</span><span className="info-value">{s.nombre_marca || '-'}</span></div>
              <div className="info-row"><span className="info-label">Estilo:</span><span className="info-value">{s.estilo || '-'}</span></div>
              <div className="info-row"><span className="info-label">Colores:</span><span className="info-value">{s.colores_ref || '-'}</span></div>
              <div className="info-row"><span className="info-label">Estado:</span><span className="info-value">{s.estado_aprobacion || 'pendiente'}</span></div>
            </div>
          </div>
        );
        return null;
      })()}

      {/* Entregas - Subir archivo con versión y comentario */}
      <div className="detalle-seccion">
        <h4>📦 Entregas</h4>
        <div className="entrega-form">
          <input
            type="file"
            className="entrega-file-input"
            id="entrega-file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setEntregaArchivo(file);
                setEntregaUrl('');
              }
            }}
          />
          <div className="entrega-form-row">
            <input
              type="text"
              className="entrega-input"
              placeholder="Versión (ej: 1.0)"
              value={entregaVersion}
              onChange={(e) => setEntregaVersion(e.target.value)}
              style={{width: 100}}
            />
            <input
              type="url"
              className="entrega-input"
              placeholder="O pega una URL de descarga..."
              value={entregaUrl}
              onChange={(e) => { setEntregaUrl(e.target.value); if (e.target.value) setEntregaArchivo(null); }}
              style={{flex:1}}
            />
          </div>
          <textarea
            className="entrega-textarea"
            placeholder="Comentario del admin sobre esta entrega..."
            value={entregaComentario}
            onChange={(e) => setEntregaComentario(e.target.value)}
            rows={2}
          />
          <div className="entrega-form-actions">
            <Button onClick={handleEntregaSubmit} disabled={!entregaArchivo && !entregaUrl}>
              📤 Subir Entrega
            </Button>
            {entregaSubiendo && <Spinner size="sm" />}
          </div>
        </div>
        {detalle?.entregas && detalle.entregas.length > 0 && (
          <div className="entregas-list">
            {detalle.entregas.map((e: any) => (
              <div key={e.id} className="entrega-item">
                <div className="entrega-item-header">
                  <span className="entrega-version">v{e.version || '1.0'}</span>
                  <span className="entrega-fecha">
                    {e.createdAt ? new Date(e.createdAt).toLocaleString() : '-'}
                  </span>
                  <a href={e.urlDescarga} target="_blank" rel="noreferrer" className="entrega-descargar-btn" title="Descargar">⬇️</a>
                </div>
                {e.comentario && <div className="entrega-comentario">{e.comentario}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de Estados - Timeline interactivo */}
      <div className="detalle-seccion">
        <h4>📜 Historial de Estados</h4>
        {detalle?.seguimiento && detalle.seguimiento.length > 0 ? (
          <div className="timeline-moderno">
            {(() => {
              const items = [...detalle.seguimiento].reverse();
              let lastDate = '';
              return items.map((item: any, index: number) => {
                const fecha = item.createdAt ? new Date(item.createdAt) : null;
                const fechaStr = fecha ? fecha.toLocaleDateString() : '';
                const showDate = fechaStr !== lastDate;
                if (fechaStr) lastDate = fechaStr;
                const esPrimero = index === items.length - 1;
                const esUltimo = index === 0;
                const colorMap: Record<string, string> = {
                  pendiente: '#f59e0b',
                  en_cola: '#3b82f6',
                  imprimiendo: '#8b5cf6',
                  acabado: '#10b981',
                  entregado: '#06b6d4',
                };
                const dotColor = colorMap[item.estado] || '#94a3b8';
                return (
                  <div key={item.id || index}>
                    {showDate && fechaStr && (
                      <div className="timeline-date-header">{fechaStr}</div>
                    )}
                    <div className={`timeline-item ${esPrimero ? 'timeline-primero' : ''} ${esUltimo ? 'timeline-ultimo' : ''}`}>
                      <div className="timeline-line">
                        <div className="timeline-dot" style={{ backgroundColor: dotColor }} />
                        {!esUltimo && <div className="timeline-connector" />}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-estado" style={{ color: dotColor }}>
                            {getEstadoLabel(item.estado)}
                          </span>
                          <span className="timeline-hora">
                            {fecha ? fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        {item.nota && <div className="timeline-nota">{item.nota}</div>}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="historial-vacio">
            <span>📭 No hay historial de cambios</span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="detalle-acciones">
        <Button variant="outline" onClick={onClose}>
          ← Volver
        </Button>
        {siguienteEstado && (
          <Button
            onClick={() => onEstadoChange(siguienteEstado)}
            disabled={!detalle?.diseno}
            title={!detalle?.diseno ? 'Se requiere un diseño primero' : 'Avanzar al siguiente estado'}
            style={!detalle?.diseno ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            ➡️ Avanzar a: {getEstadoLabel(siguienteEstado)}
          </Button>
        )}
      </div>

      {/* Modal de Previsualización */}
      {showPreview && previewUrl && (
        <div className="preview-modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>Vista Previa</h3>
              <button className="close-btn" onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className="preview-modal-body" style={previewUrl && (previewUrl.includes('data:image/') || previewUrl.match(/\.(jpg|jpeg|png|gif|svg)(\?|$)/i)) ? {} : {padding:0}}>
              {previewUrl && (previewUrl.includes('data:image/') || previewUrl.match(/\.(jpg|jpeg|png|gif|svg)(\?|$)/i)) ? (
                <img src={previewUrl} alt="Preview" className="preview-full-image" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style=\"padding:20px;color:#94a3b8;font-size:13px\">📭 Imagen no disponible</span>'; }} />
              ) : previewUrl ? (
                <iframe src={previewUrl} className="preview-pdf" title="Vista previa" />
              ) : (
                <div className="preview-vacio"><span>Vista previa no disponible</span></div>
              )}
            </div>
            <div className="preview-modal-footer">
              <Button onClick={() => descargarArchivo(previewUrl, 'archivo')}>
                ⬇️ Descargar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ZIP Preview - Navegador de archivos mejorado */}
      {zipContents !== null && (
        <div className="preview-modal-overlay" onClick={() => { setZipContents(null); setZipLoading(false); setZipSearch(''); }}>
          <div className="preview-modal-content preview-zip-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>📦 {zipFileName}</h3>
              <button className="close-btn" onClick={() => { setZipContents(null); setZipLoading(false); setZipSearch(''); }}>✕</button>
            </div>
            <div className="zip-toolbar">
              <button className="zip-nav-btn" onClick={volverCarpeta} disabled={!zipCurrentPath} title="Subir nivel">⬆</button>
              <span className="zip-ruta">📂 {getRutaActual()}</span>
              <div className="zip-search-box">
                <input
                  type="text"
                  className="zip-search-input"
                  placeholder="Buscar archivos..."
                  value={zipSearch}
                  onChange={(e) => setZipSearch(e.target.value)}
                />
                {zipSearch && <button className="zip-search-clear" onClick={() => setZipSearch('')}>✕</button>}
              </div>
            </div>
            <div className="preview-modal-body" style={{padding:0}}>
              {zipLoading ? (
                <div className="preview-vacio"><Spinner size="sm" /> Extrayendo contenido...</div>
              ) : zipContents.length === 0 ? (
                <div className="preview-vacio"><span>📭 El archivo está vacío o no se pudo leer</span></div>
              ) : (
                <div className="zip-tree">
                  {(() => {
                    const items = getItemsAtPath(zipContents, zipCurrentPath, zipSearch);
                    if (items.length === 0) {
                      return <div className="preview-vacio" style={{padding:20}}><span>🔍 No hay archivos que coincidan con la búsqueda</span></div>;
                    }
                    return items.map((item, i) => (
                      <div
                        key={i}
                        className={`zip-item ${item.dir ? 'zip-dir' : 'zip-file'}`}
                        onClick={() => {
                          if (item.dir) {
                            setZipCurrentPath(item.fullPath.replace(/\/$/, ''));
                          } else {
                            const file = zipContents.find(f => f.path === item.fullPath || f.path === item.path);
                            if (file && file.tamano) {
                              descargarArchivoZip(zipFileName, file);
                            }
                          }
                        }}
                        title={item.dir ? 'Haz clic para entrar' : (item.tamano ? 'Haz clic para descargar' : '')}
                      >
                        <span className="zip-icon">{item.dir ? '📁' : getIconoArchivo(item.ext)}</span>
                        <span className="zip-name">{item.nombre}</span>
                        {!item.dir && item.tamano !== undefined && (
                          <span className="zip-size">{formatearBytes(item.tamano)}</span>
                        )}
                        {!item.dir && item.fecha && (
                          <span className="zip-date" title={new Date(item.fecha).toLocaleString()}>
                            {new Date(item.fecha).toLocaleDateString()}
                          </span>
                        )}
                        {item.dir && <span className="zip-arrow">›</span>}
                        {!item.dir && item.tamano !== undefined && (
                          <button
                            className="zip-download-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const file = zipContents.find(f => f.path === item.fullPath || f.path === item.path);
                              if (file) descargarArchivoZip(zipFileName, file);
                            }}
                            title="Descargar archivo"
                          >⬇️</button>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
            <div className="preview-modal-footer" style={{justifyContent:'space-between'}}>
              <span className="zip-count">
                {(() => {
                  const total = zipContents.filter(f => !f.dir).length;
                  const carpetas = zipContents.filter(f => f.dir).length;
                  if (zipSearch) {
                    const q = zipSearch.toLowerCase().trim();
                    const filtrados = zipContents.filter(f => !f.dir && f.nombre.toLowerCase().includes(q)).length;
                    return `${filtrados} de ${total} archivo(s), ${carpetas} carpeta(s)`;
                  }
                  return `${total} archivo(s), ${carpetas} carpeta(s)`;
                })()}
              </span>
              {zipCurrentPath && !zipSearch && (
                <span className="zip-count">
                  {getItemsAtPath(zipContents, zipCurrentPath, '').length} elemento(s)
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Administracion;