import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const RestablecerContrasena = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2 className="login-title">Enlace invalido</h2>
          <p style={{ textAlign: 'center', color: '#ff4d4d' }}>El enlace de recuperacion es invalido o ha expirado.</p>
          <a href="/olvidar-contrasena" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', color: '#646cff', marginTop: '1rem' }}>
            Solicitar nuevo enlace
          </a>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contrasenas no coinciden');
      return;
    }
    if (nuevaContrasena.length < 12) {
      setError('La contrasena debe tener al menos 12 caracteres');
      return;
    }
    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/auth/restablecer-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaContrasena })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.mensaje || 'Contrasena actualizada. Redirigiendo...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.mensaje || 'Error al restablecer contrasena');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Restablecer Contrasena</h2>
        {error && <p className="login-error">{error}</p>}
        {message && <p style={{ color: '#4caf50', textAlign: 'center', marginBottom: '1rem' }}>{message}</p>}
        <input className="login-input" type="password" placeholder="Nueva contrasena"
          value={nuevaContrasena} onChange={e => setNuevaContrasena(e.target.value)} required />
        <input className="login-input" type="password" placeholder="Confirmar contrasena"
          value={confirmarContrasena} onChange={e => setConfirmarContrasena(e.target.value)} required />
        <button className="login-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Restableciendo...' : 'Restablecer Contrasena'}
        </button>
        <a href="/login" style={{ textAlign: 'center', marginTop: '1rem', textDecoration: 'none', color: '#646cff', display: 'block' }}>
          Volver al inicio de sesion
        </a>
      </form>
    </div>
  );
};

export default RestablecerContrasena;
