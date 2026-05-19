import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import styles from './RoleSelector.module.css';

interface RolUsuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'cliente' | 'admin' | 'diseniador';
  icono: string;
  destino: string;
  descripcion: string;
}

const USUARIOS: RolUsuario[] = [
  {
    id: 7,
    nombre: 'Cliente CROMA',
    email: 'cliente@croma.pe',
    rol: 'cliente',
    icono: '👤',
    destino: '/usuario/catalogo',
    descripcion: 'Ver catálogo y realizar pedidos',
  },
  {
    id: 6,
    nombre: 'Administrador CROMA',
    email: 'admin@croma.pe',
    rol: 'admin',
    icono: '⚙️',
    destino: '/admin',
    descripcion: 'Gestión completa del sistema',
  },
  {
    id: 5,
    nombre: 'Pedro Ruiz',
    email: 'pedro@croma.pe',
    rol: 'diseniador',
    icono: '🎨',
    destino: '/diseniador',
    descripcion: 'Diseñador 1',
  },
  {
    id: 4,
    nombre: 'Ana Lopez',
    email: 'ana@croma.pe',
    rol: 'diseniador',
    icono: '🎨',
    destino: '/diseniador',
    descripcion: 'Diseñador 2',
  },
];

export function RoleSelector() {
  const navigate = useNavigate();
  const { loginAs, isLoading, error, clearError } = useAuthStore();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const handleSelect = async (usuario: RolUsuario) => {
    clearError();
    setPendingEmail(usuario.email);
    try {
      await loginAs({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      });
      navigate(usuario.destino);
    } catch {
      /* mensaje en store */
    } finally {
      setPendingEmail(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>CROMA</h1>
        <p className={styles.subtitle}>Sistema de Gestión de Pedidos</p>
        <p className={styles.instruction}>Selecciona un perfil (inicia sesión con el servidor)</p>
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <div className={styles.grid}>
        {USUARIOS.map((u) => (
          <button
            key={u.id}
            type="button"
            className={styles.card}
            disabled={isLoading}
            onClick={() => handleSelect(u)}
          >
            <div className={styles.avatar}>
              <span className={styles.avatarText}>{u.nombre.charAt(0)}</span>
            </div>
            <span className={styles.icono}>{u.icono}</span>
            <span className={styles.name}>{u.nombre}</span>
            <span className={styles.email}>{u.email}</span>
            <span className={styles.rol}>{u.rol}</span>
            <span className={styles.desc}>{u.descripcion}</span>
            {pendingEmail === u.email && isLoading && (
              <span className={styles.desc}>Conectando…</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RoleSelector;
