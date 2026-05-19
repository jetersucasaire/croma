import React, { useState } from 'react';
import './Login.css'; //Para importar como en HTML
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLoginSuccess: (user: { id: number; nombre: string; email: string; token: string }) => void;
}

export const Login = ({ onLoginSuccess }: LoginProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.usuario);
        navigate('/admin');
      } else {
        setError(data.mensaje || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className='login-title'>Bienvenido a croma</h1>
        <h2 className="login-title">Iniciar Sesión</h2>
        
        {error && <p className="login-error">{error}</p>}

        <input
          className="login-input"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="login-input"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <a href="/olvidar-contrasena" style={{ textAlign: 'right', display: 'block', marginTop: '-0.5rem', marginBottom: '1rem', color: '#646cff', textDecoration: 'none', fontSize: '0.9rem' }}>
          Olvidaste tu contrasena?
        </a>
        <button className="login-button" type="submit">
          Ingresar al Sistema
        </button>
      </form>
    </div>
  );
};