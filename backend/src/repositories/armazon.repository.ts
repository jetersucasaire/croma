import { runQuery, runInsert, runUpdate } from '../database';
import { Armazon } from '../models';

export class ArmazonRepository {
  
  findAll(mecanismo?: string, activo?: boolean): Armazon[] {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (mecanismo) {
      whereClause += ' AND mecanismo = ?';
      params.push(mecanismo);
    }
    if (activo !== undefined) {
      whereClause += ' AND activo = ?';
      params.push(activo ? 1 : 0);
    }
    
    return runQuery(`
      SELECT id, uuid, nombre, mecanismo, forma, dimensiones_max as dimensionesMax, 
             precio, stock, activo, created_at as createdAt
      FROM armazones ${whereClause} ORDER BY precio
    `, params) as Armazon[];
  }
  
  findById(id: number): Armazon | undefined {
    const result = runQuery(`
      SELECT id, uuid, nombre, mecanismo, forma, dimensiones_max as dimensionesMax, 
             precio, stock, activo, created_at as createdAt
      FROM armazones WHERE id = ?
    `, [id]);
    return result[0] as Armazon | undefined;
  }
  
  create(data: Omit<Armazon, 'id' | 'createdAt'>): number {
    return runInsert(`
      INSERT INTO armazones (uuid, nombre, mecanismo, forma, dimensiones_max, precio, stock, activo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.uuid, data.nombre, data.mecanismo, data.forma || null, 
      data.dimensionesMax || null, data.precio, data.stock || 0, data.activo !== false ? 1 : 0
    ]);
  }
  
  update(id: number, data: Partial<Armazon>): void {
    const fields: string[] = [];
    const params: any[] = [];
    
    if (data.nombre !== undefined) { fields.push('nombre = ?'); params.push(data.nombre); }
    if (data.mecanismo !== undefined) { fields.push('mecanismo = ?'); params.push(data.mecanismo); }
    if (data.forma !== undefined) { fields.push('forma = ?'); params.push(data.forma); }
    if (data.dimensionesMax !== undefined) { fields.push('dimensiones_max = ?'); params.push(data.dimensionesMax); }
    if (data.precio !== undefined) { fields.push('precio = ?'); params.push(data.precio); }
    if (data.stock !== undefined) { fields.push('stock = ?'); params.push(data.stock); }
    if (data.activo !== undefined) { fields.push('activo = ?'); params.push(data.activo ? 1 : 0); }
    
    if (fields.length > 0) {
      runUpdate(`UPDATE armazones SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    }
  }
  
  delete(id: number): void {
    runUpdate('UPDATE armazones SET activo = 0 WHERE id = ?', [id]);
  }
}