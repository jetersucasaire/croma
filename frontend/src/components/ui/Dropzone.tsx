import { useCallback, useState, useRef } from 'react';
import { clsx } from 'clsx';
import styles from './Dropzone.module.css';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

interface FilePreview {
  file: File;
  preview: string;
}

export function Dropzone({
  onFileSelect,
  accept = 'pdf,ai,jpg,jpeg,png,svg',
  maxSize = 50,
  disabled = false,
}: DropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = accept.split(',').map((e) => e.trim().toLowerCase());

    if (!extension || !allowedExtensions.includes(extension)) {
      return `Tipo de archivo no permitido. Solo: ${accept}`;
    }

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      return `Archivo muy grande. Máximo: ${maxSize}MB`;
    }

    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview({
            file,
            preview: e.target?.result as string,
          });
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview({ file, preview: '' });
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [handleFile, disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const removeFile = () => {
    setFilePreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={clsx(
          styles.dropzone,
          dragActive && styles.dragActive,
          disabled && styles.disabled,
          error && styles.error
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className={styles.input}
          disabled={disabled}
        />

        {uploading ? (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={styles.progressText}>{progress}%</span>
          </div>
        ) : filePreview ? (
          <div className={styles.preview}>
            {filePreview.preview ? (
              <img
                src={filePreview.preview}
                alt={filePreview.file.name}
                className={styles.previewImage}
              />
            ) : (
              <div className={styles.fileIcon}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
            )}
            <span className={styles.fileName}>{filePreview.file.name}</span>
            <button
              type="button"
              className={styles.removeButton}
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.icon}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className={styles.text}>
              Arrastra un archivo aquí o{' '}
              <span className={styles.browse}>explorar</span>
            </p>
            <p className={styles.subtext}>
              Formatos: {accept} • Máximo: {maxSize}MB
            </p>
          </div>
        )}
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}