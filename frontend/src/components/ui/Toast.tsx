import * as ToastPrimitive from '@radix-ui/react-toast';
import { clsx } from 'clsx';
import { useUIStore } from '../../stores';
import styles from './Toast.module.css';

export interface ToastProps {
  className?: string;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, hideToast } = useUIStore();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          className={clsx(styles.toast, styles[toast.tipo])}
          onOpenChange={(open) => !open && hideToast(toast.id)}
          duration={toast.duracion}
        >
          <div className={styles.iconContainer}>
            {toast.tipo === 'success' && '✓'}
            {toast.tipo === 'error' && '✕'}
            {toast.tipo === 'warning' && '⚠'}
            {toast.tipo === 'info' && 'ℹ'}
          </div>
          <div className={styles.content}>
            <ToastPrimitive.Title className={styles.title}>
              {toast.titulo}
            </ToastPrimitive.Title>
            {toast.mensaje && (
              <ToastPrimitive.Description className={styles.message}>
                {toast.mensaje}
              </ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close className={styles.closeButton}>
            ✕
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className={styles.viewport} />
    </ToastPrimitive.Provider>
  );
}

export function useToast() {
  const { showToast } = useUIStore();

  return {
    success: (titulo: string, mensaje?: string) =>
      showToast({ tipo: 'success', titulo, mensaje }),
    error: (titulo: string, mensaje?: string) =>
      showToast({ tipo: 'error', titulo, mensaje }),
    warning: (titulo: string, mensaje?: string) =>
      showToast({ tipo: 'warning', titulo, mensaje }),
    info: (titulo: string, mensaje?: string) =>
      showToast({ tipo: 'info', titulo, mensaje }),
  };
}

export default ToastProvider;