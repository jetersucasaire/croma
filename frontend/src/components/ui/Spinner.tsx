import { clsx } from 'clsx';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export function Spinner({
  size = 'md',
  color = 'primary',
  className,
}: SpinnerProps) {
  return (
    <div
      className={clsx(styles.spinner, styles[size], styles[color], className)}
      role="status"
      aria-label="Cargando"
    >
      <span className={styles.circle} />
      <span className={styles.circle} />
      <span className={styles.circle} />
    </div>
  );
}

export function LoadingOverlay({
  message = 'Cargando...',
}: {
  message?: string;
}) {
  return (
    <div className={styles.overlay}>
      <Spinner size="lg" />
      <p className={styles.message}>{message}</p>
    </div>
  );
}

export default Spinner;