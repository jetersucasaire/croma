import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCarritoStore, useAuthStore, useNotificacionStore } from '../stores';
import type { NotificacionItem } from '../stores/notificacionStore';
import { ConfirmModal } from '../components/ui';
import styles from './Navbar.module.css';

interface NavbarProps {
  categorias?: string[];
  onSelectCategoria?: (cat: string) => void;
  terminoBusqueda?: string;
  onBuscar?: (texto: string) => void;
}

export const Navbar = ({ categorias, onSelectCategoria, terminoBusqueda, onBuscar }: NavbarProps) => {
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { items, cantidadTotal } = useCarritoStore();
  const { usuario, logout } = useAuthStore();
  const { notificaciones, sinLeer, cargarNotificaciones, cargarSinLeer, marcarLeida, marcarTodasLeidas } = useNotificacionStore();

  useEffect(() => { cargarSinLeer(); }, []);

  const abrirNotif = async () => {
    await cargarNotificaciones();
    setNotifDropdown(!notifDropdown);
  };

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const basePath = usuario?.rol === 'cliente' ? '/usuario' : '/usuario';
  const adminPath = usuario?.rol === 'diseniador' ? '/diseniador' : '/admin';

  const abrirPedidoDesdeNotif = (n: NotificacionItem) => {
    marcarLeida(n.id);
    const pedidoId = n.referenciaId ?? n.meta?.pedidoId;

    // Notificación de entrega → llevar al cliente a su perfil/pedidos
    if (n.tipo === 'entrega') {
      navigate('/usuario/perfil?tab=pedidos');
      setNotifDropdown(false);
      return;
    }

    if (pedidoId && (n.tipo === 'asignacion' || n.tipo === 'pedido')) {
      navigate(`${adminPath}?pedido=${pedidoId}`);
      setNotifDropdown(false);
    }
  };

  return (
    <nav className={styles.container}>
      <div className={styles.logo}>
        <Link to="/">CROMA</Link>
      </div>

      {categorias && onSelectCategoria && (
        <div className={styles.dropdown}>
          <button className={styles.dropdownBtn} onClick={() => setDropdownAbierto(!dropdownAbierto)}>
            Categorías <span className={styles.arrow}>▾</span>
          </button>
          {dropdownAbierto && (
            <ul className={styles.dropdownMenu}>
              {categorias.map((cat) => (
                <li key={cat} onClick={() => { onSelectCategoria(cat); setDropdownAbierto(false); }}>
                  {cat}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {onBuscar && (
        <div className={styles.search}>
          <span className={styles.searchIcon}>🔍</span>
          <input 
            type="text" 
            placeholder="Buscar productos..." 
            value={terminoBusqueda}
            onChange={(e) => onBuscar(e.target.value)}
          />
        </div>
      )}

      <div className={styles.links}>
        {usuario?.rol === 'cliente' && (
          <>
            <Link to={`${basePath}/catalogo`} className={isActive(`${basePath}/catalogo`) ? styles.active : ''}>Catálogo</Link>
            <Link to={`${basePath}/servicios`} className={isActive(`${basePath}/servicios`) ? styles.active : ''}>Servicios</Link>
            <Link to={`${basePath}/carrito`} className={styles.carritoLink}>
              Carrito {cantidadTotal > 0 && <span className={styles.badge}>{cantidadTotal}</span>}
            </Link>
            <Link to={`${basePath}/perfil`} className={isActive(`${basePath}/perfil`) ? styles.active : ''}>Perfil</Link>
          </>
        )}
        {usuario?.rol === 'admin' && (
          <>
            <Link to="/admin" className={isActive('/admin') ? styles.active : ''}>Admin</Link>
            <Link to="/admin/importar" className={isActive('/admin/importar') ? styles.active : ''}>Importar</Link>
          </>
        )}
        {usuario?.rol === 'diseniador' && (
          <>
            <Link to="/diseniador" className={isActive('/diseniador') ? styles.active : ''}>Panel</Link>
          </>
        )}
        <button onClick={() => { logout(); navigate('/'); }} className={styles.linkBtn}>Cambiar Usuario</button>
        <button className={styles.notifBtn} onClick={abrirNotif}>
          🔔 {sinLeer > 0 && <span className={styles.notifBadge}>{sinLeer}</span>}
        </button>
        {notifDropdown && (
          <div className={styles.notifDropdown}>
            <div className={styles.notifHeader}>
              <span>Notificaciones</span>
              {sinLeer > 0 && (
                <button onClick={marcarTodasLeidas}>
                  Marcar todo leído
                </button>
              )}
            </div>
            <div className={styles.notifList}>
              {notificaciones.length === 0 ? (
                <p>No hay notificaciones</p>
              ) : (
                notificaciones.slice(0, 10).map((n) => {
                  const esAsignacion = n.tipo === 'asignacion' || Boolean(n.meta?.pedidoId && n.tipo !== 'entrega');
                  const esEntrega = n.tipo === 'entrega';
                  return (
                  <div
                    key={n.id}
                    className={`${styles.notifItem} ${!n.leido ? styles.noLeido : ''} ${esAsignacion ? styles.notifAsignacion : ''} ${esEntrega ? styles.notifEntrega : ''}`}
                    onClick={() => abrirPedidoDesdeNotif(n)}
                  >
                    <div className={styles.notifItemHead}>
                      <span className={styles.notifIcon}>{esEntrega ? '✅' : esAsignacion ? '📋' : '🔔'}</span>
                      <strong>{n.titulo.replace(/^[✅📋]\s*/, '')}</strong>
                    </div>
                    {n.meta?.asignadoPor && (
                      <p className={styles.notifAsignadoPor}>
                        Asignado por <strong>{n.meta.asignadoPor}</strong>
                      </p>
                    )}
                    {n.meta?.itemNombre && (
                      <p className={styles.notifMetaLine}>
                        <span>Servicio:</span> {n.meta.itemNombre}
                      </p>
                    )}
                    {n.meta?.clienteNombre && (
                      <p className={styles.notifMetaLine}>
                        <span>Cliente:</span> {n.meta.clienteNombre}
                      </p>
                    )}
                    {n.meta?.trackingId && (
                      <p className={styles.notifTracking}>{n.meta.trackingId}</p>
                    )}
                    {!n.meta?.itemNombre && (
                      <p className={styles.notifMensaje}>{n.mensaje}</p>
                    )}
                    <span className={styles.notifFecha}>{new Date(n.createdAt).toLocaleString()}</span>
                    {esEntrega && n.meta?.urlDescarga && (
                      <a
                        href={n.meta.urlDescarga}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.notifActionBtn}
                        onClick={(e) => { e.stopPropagation(); marcarLeida(n.id); }}
                      >
                        ⬇ Descargar trabajo
                      </a>
                    )}
                    {esEntrega && !n.meta?.urlDescarga && (
                      <button
                        type="button"
                        className={styles.notifActionBtn}
                        onClick={(e) => { e.stopPropagation(); abrirPedidoDesdeNotif(n); }}
                      >
                        Ver en Mis Pedidos →
                      </button>
                    )}
                    {esAsignacion && (n.referenciaId ?? n.meta?.pedidoId) && (
                      <button
                        type="button"
                        className={styles.notifActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirPedidoDesdeNotif(n);
                        }}
                      >
                        Ver pedido asignado →
                      </button>
                    )}
                  </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.profile}>
        {usuario ? (
          <>
            <span className={styles.profileName}>{usuario.nombre}</span>
            <button onClick={() => setShowLogoutModal(true)} className={styles.logoutBtn}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <div className={styles.profileAvatar}>👤</div>
        )}
      </div>

      <a 
        href="https://wa.me/51987654321" 
        className={styles.whatsappFloat} 
        target="_blank" 
        rel="noopener noreferrer"
        title="Escríbenos por WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.298-.157-1.256-1.038-2.395-1.306-.29-.071-.498-.106-.698.106-.199.02-.417.297-.525.449-.009.149-.03.299-.06.449l-.566 2.155c-.036.202.157.404.353.506.196.101.417.218.595.274.179.057.348.094.557.144.104.025.198.049.287.074.089.025.173.149.21.224l.375 1.039c.075.149.15.299.224.447.149.299.298.597.595.796.297.298.658.696 1.095 1.094.198.198.396.371.575.546.179.174.348.372.546.536.198.164.297.27.397.348.1.077.249.248.347.424.001.001.025.173.025.173s-.048-.124-.198-.397c-.149-.298-.298-.596-.446-.795l-.646-1.164c-.149-.298-.149-.596-.224-1.093-.075-.497-.149-1.194-.199-1.613-.05-.419-.2-.816-.446-1.193-.099-.149-.248-.347-.447-.595l-.173-.248c-.025-.025-.025-.05-.012-.074.124-.249.099-.546-.075-.77-.174-.224-.397-.595-.546-1.093l-.596-1.164c-.149-.224-.297-.447-.595-.695-.298-.248-.695-.546-1.093-.744-.397-.199-.893-.347-1.193-.496zM12.66 22.163c-.398 0-.795-.099-1.138-.298-.348-.198-.596-.546-.77-.893-.174-.348-.273-.744-.298-1.193-.025-.447.025-.893.173-1.338.149-.447.446-.893.795-1.24.348-.347.795-.546 1.193-.695.397-.149.893-.198 1.338-.124.447.074.893.298 1.24.595l1.516 1.516c.298.298.546.695.744 1.093.173.398.224.795.199 1.193-.025.397-.149.795-.397 1.138-.248.348-.595.646-.991.795-.397.149-.795.198-1.238.124zm-6.664-5.99c-.149 0-.298-.025-.447-.074-.595-.149-1.093-.596-1.24-1.193-.149-.596.025-1.193.274-1.64.397-.696 1.093-1.193 1.839-1.24.597-.025 1.193.124 1.64.397.447.274.695.744.795 1.24.025.149.025.298.025.447l-.348 1.24c-.025.149-.074.298-.149.447-.149.248-.397.546-.695.596-.298.05-.595-.074-.795-.224-.199-.149-.447-.397-.596-.546-.149-.149-.298-.224-.447-.299l-1.24-.348z"/>
        </svg>
        <span>WhatsApp</span>
      </a>

      <ConfirmModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
        title="Cerrar sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        confirmText="Cerrar sesión"
        onConfirm={handleLogout}
        variant="danger"
      />
    </nav>
  );
};

export default Navbar;