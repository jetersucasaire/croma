import * as Dialog from '@radix-ui/react-dialog';
import { clsx } from 'clsx';
import { useEffect, type ReactNode } from 'react';
import styles from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={clsx(styles.content, styles[size])}>
          {(title || showClose) && (
            <div className={styles.header}>
              {title && (
                <Dialog.Title className={styles.title}>{title}</Dialog.Title>
              )}
              {description && (
                <Dialog.Description className={styles.description}>
                  {description}
                </Dialog.Description>
              )}
              {showClose && (
                <Dialog.Close asChild>
                  <button className={styles.closeButton} aria-label="Cerrar">
                    ✕
                  </button>
                </Dialog.Close>
              )}
            </div>
          )}
          <div className={styles.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  variant = 'warning',
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm">
      <p className={styles.confirmMessage}>{message}</p>
      <div className={styles.confirmActions}>
        <button
          className={styles.cancelButton}
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          className={clsx(styles.confirmButton, styles[variant])}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Cargando...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}

export default Modal;