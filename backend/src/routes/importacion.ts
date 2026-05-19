import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { runQuery, runInsert, runUpdate } from '../database';
import { adminOnly } from '../middleware/auth';
import { success, error } from '../interfaces/responses';
import path from 'path';
import fs from 'fs';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = 'uploads/importaciones';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `import-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel o CSV'));
    }
  }
});

// Importar pedidos desde Excel/CSV
router.post('/pedidos', adminOnly, upload.single('archivo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json(error('Archivo no proporcionado', 'NO_FILE', 400));
    }

    const uuid = uuidv4();
    const importId = runInsert(`
      INSERT INTO importaciones (uuid, archivo_original, estado)
      VALUES (?, ?, 'procesando')
    `, [uuid, req.file.filename]);

    // Por ahora, simulate processing
    // En una implementación real, usariamos 'xlsx' library para parsear el archivo
    
    // Simular éxito por ahora
    runUpdate(`
      UPDATE importaciones SET registros_exitosos = ?, estado = 'completado'
      WHERE id = ?
    `, [0, importId]);

    res.json(success({
      importId,
      message: 'Importación iniciada. Use el ID para consultar el resultado.',
      file: req.file.filename
    }));
  } catch (err: any) {
    console.error('Error en importación:', err);
    res.status(500).json(error('Error del servidor'));
  }
});

// Obtener resultado de importación
router.get('/:id/resultado', adminOnly, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const importacion = runQuery('SELECT * FROM importaciones WHERE id = ?', [id])[0];

    if (!importacion) {
      return res.status(404).json(error('Importación no encontrada', 'NOT_FOUND', 404));
    }

    res.json(success(importacion));
  } catch (err: any) {
    res.status(500).json(error('Error del servidor'));
  }
});

// Listar importaciones
router.get('/admin/todas', adminOnly, (req: Request, res: Response) => {
  try {
    const importaciones = runQuery(`
      SELECT id, uuid, archivo_original, registros_exitosos, errores_json, estado, created_at
      FROM importaciones
      ORDER BY created_at DESC
    `);

    res.json(success(importaciones));
  } catch (err: any) {
    res.status(500).json(error('Error del servidor'));
  }
});

export default router;