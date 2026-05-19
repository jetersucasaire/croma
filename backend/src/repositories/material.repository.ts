import { runQuery, runInsert, runUpdate } from '../database';
import { Material } from '../models';

export class MaterialRepository {
  
  findAll(servicioId?: number, activo?: boolean): Material[] {
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
      SELECT id, uuid, servicio_id as servicioId, nombre, descripcion, tipo, gramaje,
             compatible_formato as compatibleFormato, precio_unitario as precioUnitario, 
             stock, activo, created_at as createdAt
      FROM materiales ${whereClause}
      ORDER BY nombre
    `, params) as Material[];
  }
  
  findById(id: number): Material | undefined {
    const result = runQuery(`
      SELECT id, uuid, servicio_id as servicioId, nombre, descripcion, tipo, gramaje,
             compatible_formato as compatibleFormato, precio_unitario as precioUnitario, 
             stock, activo, created_at as createdAt
      FROM materiales WHERE id = ?
    `, [id]);
    return result[0] as Material | undefined;
  }
  
  create(data: Omit<Material, 'id' | 'createdAt'>): number {
    return runInsert(
      `INSERT INTO materiales (uuid, servicio_id, nombre, descripcion, tipo, gramaje, 
       compatible_formato, precio_unitario, stock, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.uuid, data.servicioId, data.nombre, data.descripcion || null, data.tipo || null,
       data.gramaje || null, data.compatibleFormato || null, data.precioUnitario, 
       data.stock || 0, data.activo !== false ? 1 : 0]
    );
  }
  
  update(id: number, data: Partial<Material>): void {
    const fields: string[] = [];
    const params: any[] = [];
    
    if (data.nombre !== undefined) { fields.push('nombre = ?'); params.push(data.nombre); }
    if (data.descripcion !== undefined) { fields.push('descripcion = ?'); params.push(data.descripcion); }
    if (data.tipo !== undefined) { fields.push('tipo = ?'); params.push(data.tipo); }
    if (data.gramaje !== undefined) { fields.push('gramaje = ?'); params.push(data.gramaje); }
    if (data.compatibleFormato !== undefined) { fields.push('compatible_formato = ?'); params.push(data.compatibleFormato); }
    if (data.precioUnitario !== undefined) { fields.push('precio_unitario = ?'); params.push(data.precioUnitario); }
    if (data.stock !== undefined) { fields.push('stock = ?'); params.push(data.stock); }
    if (data.activo !== undefined) { fields.push('activo = ?'); params.push(data.activo ? 1 : 0); }
    
    if (fields.length > 0) {
      runUpdate(`UPDATE materiales SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    }
  }
  
  softDelete(id: number): void {
    runUpdate('UPDATE materiales SET activo = 0 WHERE id = ?', [id]);
  }
}