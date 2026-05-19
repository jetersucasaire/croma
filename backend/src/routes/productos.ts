import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, runInsert, runUpdate } from '../database';
import { success, error } from '../interfaces/responses';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const productos = runQuery(`
      SELECT id, uuid, nombre, slug, descripcion, imagen, categoria, precio, precio_oferta as precioOferta, stock, unidad, activo, created_at as createdAt
      FROM productos 
      WHERE activo = 1
      ORDER BY nombre
    `);

    res.json({ success: true, data: productos });
  } catch (err: any) {
    console.error('Error en productos:', err.message);
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.get('/todos', (_req: Request, res: Response) => {
  try {
    const productos = runQuery(`
      SELECT id, uuid, nombre, slug, descripcion, imagen, categoria, precio, precio_oferta as precioOferta, stock, unidad, activo, created_at as createdAt
      FROM productos 
      ORDER BY nombre
    `);

    res.json({ success: true, data: productos });
  } catch (err: any) {
    console.error('Error en productos:', err.message);
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.get('/categorias', (_req: Request, res: Response) => {
  try {
    const categorias = runQuery(`
      SELECT DISTINCT categoria FROM productos WHERE activo = 1 AND categoria IS NOT NULL ORDER BY categoria
    `);

    res.json({ success: true, data: categorias.map((c: any) => c.categoria) });
  } catch (err: any) {
    console.error('Error en productos/categorias:', err.message);
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const producto = runQuery(`
      SELECT id, uuid, nombre, slug, descripcion, imagen, categoria, precio, precio_oferta as precioOferta, stock, unidad, activo
      FROM productos WHERE id = ? AND activo = 1
    `, [id])[0];
    
    if (!producto) {
      return res.status(404).json(error('Producto no encontrado', 'NOT_FOUND', 404));
    }

    res.json(success(producto));
  } catch (err) {
    res.status(500).json(error('Error del servidor'));
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { nombre, slug, descripcion, imagen, categoria, precio, precioOferta, stock, unidad, activo } = req.body;
    
    if (!nombre || nombre.length < 2) {
      return res.status(400).json({ success: false, mensaje: 'El nombre es requerido' });
    }

    const slugFinal = slug || nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uuid = uuidv4();
    
    const id = runInsert(
      'INSERT INTO productos (uuid, nombre, slug, descripcion, imagen, categoria, precio, precio_oferta, stock, unidad, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [uuid, nombre, slugFinal, descripcion || null, imagen || null, categoria || null, precio || 0, precioOferta || null, stock || 0, unidad || 'und', activo !== false ? 1 : 0]
    );

    res.status(201).json({ success: true, id, uuid });
  } catch (err: any) {
    console.error('Error al crear producto:', err.message);
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { nombre, slug, descripcion, imagen, categoria, precio, precioOferta, stock, unidad, activo } = req.body || {};

    const existing = runQuery('SELECT id FROM productos WHERE id = ?', [id])[0];
    if (!existing) {
      return res.status(404).json({ success: false, mensaje: 'Producto no encontrado' });
    }

    const precioOfertaValue = precioOferta === '' ? null : (precioOferta || null);

    // Si se envía imagen como string vacío, explicitamente se quiere eliminar
    let imagenValue = null;
    if (imagen !== undefined) {
      imagenValue = imagen === '' ? null : (imagen || null);
    }

    // Solo actualizar si se enviaron campos
    if (nombre || slug || descripcion || imagen !== undefined || categoria || precio || precioOferta !== undefined || stock || unidad || activo !== undefined) {
      const fields: string[] = [];
      const params: any[] = [];
      
      if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre); }
      if (slug !== undefined) { fields.push('slug = ?'); params.push(slug); }
      if (descripcion !== undefined) { fields.push('descripcion = ?'); params.push(descripcion); }
      if (imagen !== undefined) { fields.push('imagen = ?'); params.push(imagenValue); }
      if (categoria !== undefined) { fields.push('categoria = ?'); params.push(categoria); }
      if (precio !== undefined) { fields.push('precio = ?'); params.push(precio); }
      if (precioOferta !== undefined) { fields.push('precio_oferta = ?'); params.push(precioOfertaValue); }
      if (stock !== undefined) { fields.push('stock = ?'); params.push(stock); }
      if (unidad !== undefined) { fields.push('unidad = ?'); params.push(unidad); }
      if (activo !== undefined) { fields.push('activo = ?'); params.push(activo ? 1 : 0); }
      
      if (fields.length > 0) {
        runUpdate(`UPDATE productos SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
      }
    }

    res.json({ success: true, mensaje: 'Producto actualizado' });
  } catch (err: any) {
    console.error('Error al actualizar producto:', err.message);
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    runUpdate('UPDATE productos SET activo = 0 WHERE id = ?', [id]);
    res.json(success({ mensaje: 'Producto eliminado' }));
  } catch (err) {
    res.status(500).json(error('Error del servidor'));
  }
});

export default router;