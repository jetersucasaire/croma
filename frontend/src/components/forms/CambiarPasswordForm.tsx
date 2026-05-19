import React, { useState } from 'react';
import api from '../../api/clienteAxios';
import styles from './CambiarPasswordForm.module.css';

const CambiarPasswordForm = () => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    isLoading: false,
    successMessage: '',
    errorMessage: ''
  });
  const [show, setShow] = useState({ current: false, newP: false, confirm: false });

  const validatePassword = (pw: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (pw.length < 12) errors.push('Minimo 12 caracteres');
    let up = false, low = false, num = false, spec = false;
    for (let i = 0; i < pw.length; i++) {
      const c = pw.charCodeAt(i);
      if (c >= 65 && c <= 90) up = true;
      if (c >= 97 && c <= 122) low = true;
      if (c >= 48 && c <= 57) num = true;
      if ((c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126)) spec = true;
    }
    if (!up) errors.push('Necesita al menos una mayuscula');
    if (!low) errors.push('Necesita al menos una minuscula');
    if (!num) errors.push('Necesita al menos un numero');
    if (!spec) errors.push('Necesita al menos un caracter especial');
    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForm(prev => ({ ...prev, isLoading: true, errorMessage: '', successMessage: '' }));
    try {
      if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) throw new Error('Todos los campos son obligatorios');
      if (form.newPassword !== form.confirmNewPassword) throw new Error('Las nuevas contrasenas no coinciden');
      const val = validatePassword(form.newPassword);
      if (!val.valid) throw new Error('Requisitos: ' + val.errors.join(', '));
      await api.post('/usuarios/cambiar-contrasena', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({
        currentPassword: '', newPassword: '', confirmNewPassword: '',
        isLoading: false, successMessage: 'Contrasena actualizada. Redirigiendo al inicio...', errorMessage: ''
      });
      setTimeout(() => { window.location.href = '/login'; }, 3000);
    } catch (err: any) {
      setForm(prev => ({ ...prev, isLoading: false, errorMessage: err.response?.data?.mensaje || err.message || 'Error al actualizar' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3>Cambiar Contrasena</h3>
      <p className={styles.instructions}>Minimo 12 caracteres, incluye mayuscula, minuscula, numero y caracter especial.</p>
      <div className={styles.formGroup}>
        <label htmlFor="cpwd">Contrasena Actual *</label>
        <div className={styles.passwordInput}>
          <input type={show.current ? 'text' : 'password'} id="cpwd"
            value={form.currentPassword}
            onChange={e => setForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            required autoComplete="current-password" />
          <button type="button" className={styles.togglePassword} onClick={() => setShow(prev => ({ ...prev, current: !prev.current }))}>
            {show.current ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="npwd">Nueva Contrasena *</label>
        <div className={styles.passwordInput}>
          <input type={show.newP ? 'text' : 'password'} id="npwd"
            value={form.newPassword}
            onChange={e => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
            required autoComplete="new-password" />
          <button type="button" className={styles.togglePassword} onClick={() => setShow(prev => ({ ...prev, newP: !prev.newP }))}>
            {show.newP ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="cpwd2">Confirmar Contrasena *</label>
        <div className={styles.passwordInput}>
          <input type={show.confirm ? 'text' : 'password'} id="cpwd2"
            value={form.confirmNewPassword}
            onChange={e => setForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
            required />
          <button type="button" className={styles.togglePassword} onClick={() => setShow(prev => ({ ...prev, confirm: !prev.confirm }))}>
            {show.confirm ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {form.newPassword && form.confirmNewPassword && form.newPassword !== form.confirmNewPassword && (
          <small className={styles.errorText}>Las contrasenas no coinciden</small>
        )}
      </div>
      {form.errorMessage && <div className={styles.alert + ' ' + styles.alertError}>{form.errorMessage}</div>}
      {form.successMessage && <div className={styles.alert + ' ' + styles.alertSuccess}>{form.successMessage}</div>}
      <div className={styles.formActions}>
        <button type="submit" className={styles.btn + ' ' + styles.btnPrimary} disabled={form.isLoading}>
          {form.isLoading ? 'Actualizando...' : 'Cambiar Contrasena'}
        </button>
      </div>
    </form>
  );
};

export default CambiarPasswordForm;
