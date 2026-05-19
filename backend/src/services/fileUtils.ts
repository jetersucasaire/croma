import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { logger } from '../middleware/logger';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_STORAGE_MB = 500;
const ALLOWED_TYPES = ['pdf', 'ai', 'jpg', 'jpeg', 'png', 'svg'];

export interface FileLimits {
  maxFileSize: number;
  maxStorageMB: number;
  allowedTypes: string[];
}

export function getLimits(usuarioId?: number): FileLimits {
  return {
    maxFileSize: MAX_FILE_SIZE,
    maxStorageMB: MAX_STORAGE_MB,
    allowedTypes: ALLOWED_TYPES,
  };
}

export function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: `Archivo muy grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }
  return { valid: true };
}

export function validateFileType(filename: string): { valid: boolean; error?: string } {
  const ext = path.extname(filename).toLowerCase().slice(1);
  if (!ALLOWED_TYPES.includes(ext)) {
    return { valid: false, error: `Tipo no permitido. Solo: ${ALLOWED_TYPES.join(', ')}` };
  }
  return { valid: true };
}

export async function checkStorageLimit(usuarioId: number): Promise<{ allowed: boolean; usedMB: number; limitMB: number }> {
  const usedResult = { usedMB: 0 };
  const limitMB = MAX_STORAGE_MB;

  if (usedResult.usedMB >= limitMB) {
    logger.warn({ usuarioId, usedMB: usedResult.usedMB, limitMB }, 'Storage limit exceeded');
  }

  return {
    allowed: usedResult.usedMB < limitMB,
    usedMB: usedResult.usedMB,
    limitMB,
  };
}

export function streamDownload(req: Request, res: Response, filePath: string, filename: string): void {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', fileSize);
  res.setHeader('Accept-Ranges', 'bytes');

  if (!range) {
    res.status(200).send(fs.createReadStream(filePath));
    return;
  }

  const parts = range.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  const chunkSize = end - start + 1;

  res.setHeader('Content-Length', chunkSize);
  res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
  res.status(206);

  const stream = fs.createReadStream(filePath, { start, end });
  stream.pipe(res);
}

export function cleanupTempFiles(): number {
  let eliminados = 0;
  const tempDir = 'uploads/temp';

  if (!fs.existsSync(tempDir)) {
    return 0;
  }

  const archivos = fs.readdirSync(tempDir);
  for (const archivo of archivos) {
    const filePath = path.join(tempDir, archivo);
    const stat = fs.statSync(filePath);
    const edadHoras = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);

    if (edadHoras > 24) {
      fs.unlinkSync(filePath);
      eliminados++;
    }
  }

  return eliminados;
}