import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css'; // Asegúrate de vincular el CSS nuevo

interface RegisterProps {
  onRegisterSuccess?: () => void; // Opcional por ahora
}

export const Register = ({ onRegisterSuccess }: RegisterProps) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validación de ingeniería básica en frontend
    if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
    }

    if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    try {
      // Simulación de envío (descomentar cuando el backend esté listo)
      /*
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.mensaje);
      */

      alert('¡Cuenta creada exitosamente! Redirigiendo al login...');
      if (onRegisterSuccess) onRegisterSuccess();
      navigate('/'); // Redirección automática

    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor');
    }
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-card">
        
        {/* --- RECUADRO NEGRO PARA IMAGEN/LOGO --- */}
        <div className="logo-image-placeholder">
            {/* Aquí puedes poner un <img> cuando estés listo */}
            <span>Logo</span> 
        </div>
        {/* -------------------------------------- */}

        <div className="register-header">
            <h2 className="register-title">Crear Cuenta</h2>
            <p className="register-subtitle">Ingresa tus datos para registrarte en el sistema.</p>
        </div>
        
        {error && <div className="register-error-banner">{error}</div>}

        <form className="register-form-improved" onSubmit={handleSubmit}>
          
          <div className="input-group-improved">
            <label>Nombre Completo</label>
            <input
              type="text"
              placeholder="Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="input-group-improved">
            <label>Correo Electrónico</label>
            <input
              type="email"
              placeholder="ejemplo@upeu.edu.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-row-improved">
              <div className="input-group-improved">
                <label>Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="input-group-improved">
                <label>Confirmar</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
          </div>

          <button className="register-button-improved" type="submit">
            Registrar Usuario
          </button>

          <p className="register-switch-improved">
            ¿Ya tienes una cuenta? 
            <Link to="/login" className="register-link-improved"> Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
};