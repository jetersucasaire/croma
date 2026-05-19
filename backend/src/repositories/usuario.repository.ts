import { runQuery, runInsert, runUpdate } from '../database';
import { Usuario, UsuarioResponse } from '../models';

export class UsuarioRepository {
  
  findAll(activo?: boolean): Usuario[] {
    const where = activo !== undefined ? `WHERE activo = ${activo ? 1 : 0}` : '';
    return runQuery(`SELECT id, uuid, nombre, email, rol, whatsapp, activo, created_at as createdAt FROM usuarios ${where}`) as Usuario[];
  }
  
  findById(id: number): Usuario | undefined {
    const result = runQuery(
      `SELECT id, uuid, nombre, email, password, rol, whatsapp, activo, created_at as createdAt FROM usuarios WHERE id = ?`, 
      [id]
    );
    return result[0] as Usuario | undefined;
  }
  
  findByEmail(email: string): Usuario | undefined {
    const result = runQuery(
      `SELECT id, uuid, nombre, email, password, rol, whatsapp, activo, created_at as createdAt FROM usuarios WHERE email = ?`, 
      [email]
    );
    return result[0] as Usuario | undefined;
  }
  
  findByUuid(uuid: string): Usuario | undefined {
    const result = runQuery(
      `SELECT id, uuid, nombre, email, password, rol, whatsapp, activo, created_at as createdAt FROM usuarios WHERE uuid = ?`, 
      [uuid]
    );
    return result[0] as Usuario | undefined;
  }
  
  create(data: Omit<Usuario, 'id' | 'createdAt'>): number {
    return runInsert(
      `INSERT INTO usuarios (uuid, nombre, email, password, rol, whatsapp, activo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.uuid, data.nombre, data.email, data.password, data.rol || 'cliente', data.whatsapp || null, data.activo !== false ? 1 : 0]
    );
  }
  
  update(id: number, data: Partial<Usuario>): void {
    const fields: string[] = [];
    const params: any[] = [];
    
    if (data.nombre !== undefined) { fields.push('nombre = ?'); params.push(data.nombre); }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email); }
    if (data.whatsapp !== undefined) { fields.push('whatsapp = ?'); params.push(data.whatsapp); }
    if (data.rol !== undefined) { fields.push('rol = ?'); params.push(data.rol); }
    if (data.activo !== undefined) { fields.push('activo = ?'); params.push(data.activo ? 1 : 0); }
    
    if (fields.length > 0) {
      runUpdate(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    }
  }
  
  updatePassword(id: number, passwordHash: string): void {
    runUpdate('UPDATE usuarios SET password = ? WHERE id = ?', [passwordHash, id]);
  }
  
  softDelete(id: number): void {
    runUpdate('UPDATE usuarios SET activo = 0 WHERE id = ?', [id]);
  }
}