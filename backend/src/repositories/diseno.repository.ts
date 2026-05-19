import { runQuery, runInsert, runUpdate } from '../database';
import { Diseno } from '../models';

export class DisenoRepository {
  
  findAll(servicioId?: number, activo?: boolean): Diseno[] {
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
      SELECT id, uuid, servicio_id as servicioId, nombre, descripcion, imagen, ancho, alto, 
             unidad, parametros, activo, created_at as createdAt
      FROM disenos ${whereClause}
      ORDER BY nombre
    `, params) as Diseno[];
  }
  
  findById(id: number): Diseno | undefined {
    const result = runQuery(`
      SELECT id, uuid, servicio_id as servicioId, nombre, descripcion, imagen, ancho, alto, 
             unidad, parametros, activo, created_at as createdAt
      FROM disenos WHERE id = ?
    `, [id]);
    return result[0] as Diseno | undefined;
  }
  
  create(data: Omit<Diseno, 'id' | 'createdAt'>): number {
    return runInsert(
      `INSERT INTO disenos (uuid, servicio_id, nombre, descripcion, imagen, ancho, alto, 
       unidad, parametros, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.uuid, data.servicioId, data.nombre, data.descripcion || null, data.imagen || null,
       data.ancho || 0, data.alto || 0, data.unidad || 'cm', 
       data.parametros ? JSON.stringify(data.parametros) : null, data.activo !== false ? 1 : 0]
    );
  }
  
  update(id: number, data: Partial<Diseno>): void {
    const fields: string[] = [];
    const params: any[] = [];
    
    if (data.nombre !== undefined) { fields.push('nombre = ?'); params.push(data.nombre); }
    if (data.descripcion !== undefined) { fields.push('descripcion = ?'); params.push(data.descripcion); }
    if (data.imagen !== undefined) { fields.push('imagen = ?'); params.push(data.imagen); }
    if (data.ancho !== undefined) { fields.push('ancho = ?'); params.push(data.ancho); }
    if (data.alto !== undefined) { fields.push('alto = ?'); params.push(data.alto); }
    if (data.unidad !== undefined) { fields.push('unidad = ?'); params.push(data.unidad); }
    if (data.parametros !== undefined) { fields.push('parametros = ?'); params.push(JSON.stringify(data.parametros)); }
    if (data.activo !== undefined) { fields.push('activo = ?'); params.push(data.activo ? 1 : 0); }
    
    if (fields.length > 0) {
      runUpdate(`UPDATE disenos SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    }
  }
  
  softDelete(id: number): void {
    runUpdate('UPDATE disenos SET activo = 0 WHERE id = ?', [id]);
  }
}