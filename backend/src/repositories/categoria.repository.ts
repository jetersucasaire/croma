import { runQuery, runInsert, runUpdate } from '../database';
import { Categoria } from '../models';

export class CategoriaRepository {
  
  findAll(servicioId?: number, activo?: boolean): Categoria[] {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (servicioId !== undefined) {
      whereClause += ' AND servicio_id = ?';
      params.push(servicioId);
    }
    if (activo !== undefined) {
      whereClause += ' AND activo = ?';
      params.push(activo ? 1 : 0);
    }
    
    return runQuery(`
      SELECT id, uuid, servicio_id as servicioId, nombre, icono, activo, created_at as createdAt
      FROM categorias ${whereClause} ORDER BY nombre
    `, params) as Categoria[];
  }
  
  findById(id: number): Categoria | undefined {
    const result = runQuery(`
      SELECT id, uuid, servicio_id as servicioId, nombre, icono, activo, created_at as createdAt
      FROM categorias WHERE id = ?
    `, [id]);
    return result[0] as Categoria | undefined;
  }
  
  create(data: Omit<Categoria, 'id' | 'createdAt'>): number {
    return runInsert(
      `INSERT INTO categorias (uuid, servicio_id, nombre, icono, activo) VALUES (?, ?, ?, ?, ?)`,
      [data.uuid, data.servicioId || null, data.nombre, data.icono || null, data.activo !== false ? 1 : 0]
    );
  }
  
  update(id: number, data: Partial<Categoria>): void {
    const fields: string[] = [];
    const params: any[] = [];
    
    if (data.nombre !== undefined) { fields.push('nombre = ?'); params.push(data.nombre); }
    if (data.icono !== undefined) { fields.push('icono = ?'); params.push(data.icono); }
    if (data.activo !== undefined) { fields.push('activo = ?'); params.push(data.activo ? 1 : 0); }
    
    if (fields.length > 0) {
      runUpdate(`UPDATE categorias SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    }
  }
  
  delete(id: number): void {
    runUpdate('UPDATE categorias SET activo = 0 WHERE id = ?', [id]);
  }
}