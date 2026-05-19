import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logger';
import { uploadBuffer } from './s3';

export interface BackupConfig {
  localPath: string;
  s3Path?: string;
  retentionDays: number;
  scheduleCron?: string;
}

export interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  location?: string;
  error?: string;
}

let config: BackupConfig | null = null;

export function initBackup(conf: BackupConfig): void {
  config = conf;
  logger.info({ localPath: conf.localPath, retentionDays: conf.retentionDays }, 'Backup configurado');
}

export async function createBackup(databasePath?: string): Promise<BackupResult> {
  const dbPath = databasePath || 'croma.db';
  
  try {
    if (!fs.existsSync(dbPath)) {
      return { success: false, error: 'Base de datos no encontrada' };
    }

    const stat = fs.statSync(dbPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `croma_backup_${timestamp}.db`;
    const backupDir = config?.localPath || 'backups';
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = path.join(backupDir, filename);
    fs.copyFileSync(dbPath, backupPath);

    const uploadToS3 = config?.s3Path && uploadBuffer;
    let s3Url: string | undefined;

    if (uploadToS3) {
      const buffer = fs.readFileSync(backupPath);
      const result = await uploadBuffer(buffer, `backups/${filename}`);
      if (result.success && result.url) {
        s3Url = result.url;
      }
    }

    logger.info({ filename, size: stat.size, s3Url }, 'Backup creado');

    return {
      success: true,
      filename,
      size: stat.size,
      location: s3Url || backupPath,
    };
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error creando backup');
    return { success: false, error: err.message };
  }
}

export async function cleanupOldBackups(): Promise<{ eliminados: number; errores: number }> {
  if (!config?.localPath || !fs.existsSync(config.localPath)) {
    return { eliminados: 0, errores: 0 };
  }

  let eliminados = 0;
  let errores = 0;
  const retentionMs = (config.retentionDays || 7) * 24 * 60 * 60 * 1000;
  const now = Date.now();

  try {
    const files = fs.readdirSync(config.localPath);
    for (const file of files) {
      if (!file.startsWith('croma_backup_')) continue;
      
      const filePath = path.join(config.localPath, file);
      const stat = fs.statSync(filePath);
      
      if (now - stat.mtimeMs > retentionMs) {
        fs.unlinkSync(filePath);
        eliminados++;
        logger.info({ file }, 'Backup antiguo eliminado');
      }
    }
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error limpiando backups');
    errores++;
  }

  return { eliminados, errores };
}

export async function listBackups(): Promise<{ filename: string; size: number; createdAt: Date }[]> {
  const backupDir = config?.localPath;
  if (!backupDir || !fs.existsSync(backupDir)) {
    return [];
  }

  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('croma_backup_'))
    .map(f => {
      const stat = fs.statSync(path.join(backupDir, f));
      return {
        filename: f,
        size: stat.size,
        createdAt: stat.birthtime,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return files;
}

export async function restoreBackup(filename: string, targetPath?: string): Promise<BackupResult> {
  const backupDir = config?.localPath;
  const sourcePath = path.join(backupDir || 'backups', filename);
  const destPath = targetPath || 'croma.db';

  try {
    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: 'Backup no encontrado' };
    }

    fs.copyFileSync(sourcePath, destPath);
    logger.info({ filename, restoredTo: destPath }, 'Backup restaurado');

    return { success: true, filename };
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error restaurando backup');
    return { success: false, error: err.message };
  }
}