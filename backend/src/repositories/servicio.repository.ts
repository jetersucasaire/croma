import { runQuery, runInsert, runUpdate } from '../database';
import { Servicio, Portafolio } from '../models';

export class ServicioRepository {
  
  findAll(activo?: boolean): Servicio[] {
    let whereClause = '';
    if (activo !== undefined) {
      whereClause = activo ? 'WHERE activo = 1' : 'WHERE activo = 0';
    }
    return runQuery(`
      SELECT id, uuid, nombre, slug, descripcion, icono, imagen, precio_base as precioBase, 
             unidad, activo, created_at as createdAt
      FROM servicios ${whereClause}
      ORDER BY nombre
    `) as Servicio[];
  }
  
  findById(id: number): Servicio | undefined {
    const result = runQuery(`
      SELECT id, uuid, nombre, slug, descripcion, icono, imagen, precio_base as precioBase, 
             unidad, activo, created_at as createdAt
      FROM servicios WHERE id = ?
    `, [id]);
    return result[0] as Servicio | undefined;
  }
  
  findBySlug(slug: string): Servicio | undefined {
    const result = runQuery(`
      SELECT id, uuid, nombre, slug, descripcion, icono, imagen, precio_base as precioBase, 
             unidad, activo, created_at as createdAt
      FROM servicios WHERE slug = ? AND activo = 1
    `, [slug]);
    return result[0] as Servicio | undefined;
  }
  
  findBySlugWithAll(slug: string): Servicio | undefined {
    const result = runQuery(`
      SELECT id, uuid, nombre, slug, descripcion, icono, imagen, precio_base as precioBase, 
             unidad, activo, created_at as createdAt
      FROM servicios WHERE slug = ?
    `, [slug]);
    return result[0] as Servicio | undefined;
  }
  
  create(data: Omit<Servicio, 'id' | 'createdAt'>): number {
    return runInsert(
      `INSERT INTO servicios (uuid, nombre, slug, descripcion, icono, imagen, precio_base, unidad, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.uuid, data.nombre, data.slug, data.descripcion || null, data.icono || null, 
       data.imagen || null, data.precioBase || 0, data.unidad || 'und', data.activo !== false ? 1 : 0]
    );
  }
  
  update(id: number, data: Partial<Servicio>): void {
    const fields: string[] = [];
    const params: any[] = [];
    
    if (data.nombre !== undefined) { fields.push('nombre = ?'); params.push(data.nombre); }
    if (data.slug !== undefined) { fields.push('slug = ?'); params.push(data.slug); }
    if (data.descripcion !== undefined) { fields.push('descripcion = ?'); params.push(data.descripcion); }
    if (data.icono !== undefined) { fields.push('icono = ?'); params.push(data.icono); }
    if (data.imagen !== undefined) { fields.push('imagen = ?'); params.push(data.imagen); }
    if (data.precioBase !== undefined) { fields.push('precio_base = ?'); params.push(data.precioBase); }
    if (data.unidad !== undefined) { fields.push('unidad = ?'); params.push(data.unidad); }
    if (data.activo !== undefined) { fields.push('activo = ?'); params.push(data.activo ? 1 : 0); }
    
    if (fields.length > 0) {
      runUpdate(`UPDATE servicios SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    }
  }
  
  softDelete(id: number): void {
    runUpdate('UPDATE servicios SET activo = 0 WHERE id = ?', [id]);
  }
  
  existsBySlugOrNombre(slug: string, nombre: string, excludeId?: number): boolean {
    let query = 'SELECT id FROM servicios WHERE (slug = ? OR nombre = ?) AND activo = 1';
    const params: any[] = [slug, nombre];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const result = runQuery(query, params);
    return result.length > 0;
  }

  findPortafolio(servicioId: number): Portafolio[] {
    return runQuery(`
      SELECT id, servicio_id as servicioId, titulo, descripcion, url_imagen as urlImagen, 
             es_portada as esPortada, created_at as createdAt
      FROM portafolio WHERE servicio_id = ?
      ORDER BY es_portada DESC, created_at DESC
    `, [servicioId]) as Portafolio[];
  }
  
  createPortafolio(data: Omit<Portafolio, 'id' | 'createdAt'>): number {
    return runInsert(
      `INSERT INTO portafolio (servicio_id, titulo, descripcion, url_imagen, es_portada) VALUES (?, ?, ?, ?, ?)`,
      [data.servicioId, data.titulo, data.descripcion || null, data.urlImagen, data.esPortada ? 1 : 0]
    );
  }
  
  deletePortafolio(id: number): void {
    runUpdate('DELETE FROM portafolio WHERE id = ?', [id]);
  }
}