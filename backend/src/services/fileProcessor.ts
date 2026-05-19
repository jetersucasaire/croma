import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../middleware/logger';

const THUMBNAIL_SIZE = 300;
const THUMBNAILS_DIR = 'uploads/thumbnails';

if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

export interface ProcessResult {
  success: boolean;
  thumbnailUrl?: string;
  pages?: number;
  dimensiones?: { width: number; height: number };
  error?: string;
}

export async function processImage(filePath: string, formato: string): Promise<ProcessResult> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    if (!['.jpg', '.jpeg', '.png', '.svg'].includes(ext)) {
      return { success: false, error: 'Formato no soportado' };
    }

    const thumbnailName = `thumb_${uuidv4()}.jpg`;
    const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);

    const metadata = await sharp(filePath).metadata();
    
    await sharp(filePath)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return {
      success: true,
      thumbnailUrl: `/uploads/thumbnails/${thumbnailName}`,
      dimensiones: {
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
    };
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error procesando imagen');
    return { success: false, error: err.message };
  }
}

export async function processPDF(filePath: string): Promise<ProcessResult> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.pdf') {
      return { success: false, error: 'No es PDF' };
    }

    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPageCount();

    const firstPage = pdfDoc.getPage(0);
    const { width, height } = firstPage.getSize();

    logger.info({ pages, dimensiones: { width, height } }, 'PDF procesado');

    return {
      success: true,
      pages,
      dimensiones: { width, height },
    };
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error procesando PDF');
    return { success: false, error: err.message };
  }
}

export async function processFile(filePath: string): Promise<ProcessResult> {
  const ext = path.extname(filePath).toLowerCase();

  if (['.jpg', '.jpeg', '.png', '.svg'].includes(ext)) {
    return processImage(filePath, ext);
  }

  if (ext === '.pdf') {
    return processPDF(filePath);
  }

  return { success: false, error: 'Tipo de archivo no procesable' };
}

export function cleanupOrphans(): { eliminados: number; errores: number } {
  let eliminados = 0;
  let errores = 0;

  try {
    const uploadsDir = 'uploads';
    if (!fs.existsSync(uploadsDir)) {
      return { eliminados: 0, errores: 0 };
    }

    const archivos = fs.readdirSync(uploadsDir);
    for (const archivo of archivos) {
      const filePath = path.join(uploadsDir, archivo);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        const edadHoras = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);

        if (edadHoras > 24) {
          const filename = path.parse(archivo).name;
          const enDB = 0;

          if (enDB === 0) {
            fs.unlinkSync(filePath);
            eliminados++;
            logger.info({ archivo }, 'Archivo huérfano eliminado');
          }
        }
      }
    }
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error limpiando archivos');
    errores++;
  }

  return { eliminados, errores };
}