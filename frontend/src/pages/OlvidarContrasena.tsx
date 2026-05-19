import { useState } from 'react';

const OlvidarContrasena = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/auth/olvidar-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.mensaje);
      } else {
        setError(data.mensaje || 'Error al procesar solicitud');
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
        <h2 className="login-title">Recuperar Contrasena</h2>
        {error && <p className="login-error">{error}</p>}
        {message && <p style={{ color: '#4caf50', textAlign: 'center', marginBottom: '1rem' }}>{message}</p>}
        <input className="login-input" type="email" placeholder="Correo electronico"
          value={email} onChange={e => setEmail(e.target.value)} required />
        <button className="login-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
        </button>
        <a href="/login" style={{ textAlign: 'center', marginTop: '1rem', textDecoration: 'none', color: '#646cff', display: 'block' }}>
          Volver al inicio de sesion
        </a>
      </form>
    </div>
  );
};

export default OlvidarContrasena;
