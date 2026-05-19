import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginSchema, type LoginFormData } from '../../schemas/auth';
import { Button, Input, Checkbox } from '../ui';
import { useAuthStore } from '../../stores';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch {
      // El error ya se maneja en el store
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
        label="Correo electrónico"
        type="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className={styles.options}>
        <Checkbox
          label="Recordarme"
          {...register('rememberMe')}
        />
        <a href="#" className={styles.forgotLink}>
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        size="lg"
      >
        Iniciar Sesión
      </Button>

      <p className={styles.registerLink}>
        ¿No tienes cuenta?{' '}
        <a href="/registro">Regístrate aquí</a>
      </p>
    </form>
  );
}

export default LoginForm;