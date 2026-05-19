import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={styles.wrapper}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={clsx(styles.input, className)}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className={styles.label}>
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;