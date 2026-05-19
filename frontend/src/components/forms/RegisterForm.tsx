import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '../../schemas/auth';
import { Button, Input } from '../ui';
import { useAuthStore, useUIStore } from '../../stores';
import { useNavigate } from 'react-router-dom';
import styles from './RegisterForm.module.css';

export function RegisterForm() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { showToast } = useUIStore();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      confirmPassword: '',
      whatsapp: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data.nombre, data.email, data.password, data.whatsapp || undefined);
      showToast({
        tipo: 'success',
        titulo: '¡Bienvenido!',
        mensaje: 'Tu cuenta ha sido creada exitosamente',
      });
      navigate('/');
    } catch {
      // Error manejado en el store
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <button type="button" onClick={clearError} className={styles.errorClose}>
            ✕
          </button>
        </div>
      )}

      <Input
        label="Nombre completo"
        type="text"
        placeholder="Juan Pérez"
        error={errors.nombre?.message}
        {...registerField('nombre')}
      />

      <Input
        label="Correo electrónico"
        type="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...registerField('email')}
      />

      <Input
        label="WhatsApp (opcional)"
        type="tel"
        placeholder="+51 987 654 321"
        error={errors.whatsapp?.message}
        {...registerField('whatsapp')}
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        helperText="Mínimo 12 caracteres, mayúscula, minúscula, número y especial"
        error={errors.password?.message}
        {...registerField('password')}
      />

      <Input
        label="Confirmar contraseña"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...registerField('confirmPassword')}
      />

      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        size="lg"
      >
        Crear Cuenta
      </Button>

      <p className={styles.loginLink}>
        ¿Ya tienes cuenta?{' '}
        <a href="/login">Inicia sesión</a>
      </p>
    </form>
  );
}

export default RegisterForm;