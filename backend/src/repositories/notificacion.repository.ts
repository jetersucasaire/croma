import { runQuery, runInsert, runUpdate } from '../database';
import { Notificacion } from '../models';

export class NotificacionRepository {
  
  findAll(usuarioId?: number, leido?: boolean): Notificacion[] {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (usuarioId !== undefined) {
      whereClause += ' AND usuario_id = ?';
      params.push(usuarioId);
    }
    if (leido !== undefined) {
      whereClause += ' AND leido = ?';
      params.push(leido ? 1 : 0);
    }
    
    return runQuery(`
      SELECT id, usuario_id as usuarioId, tipo, titulo, mensaje, referencia_id as referenciaId,
             leido, created_at as createdAt
      FROM notificaciones ${whereClause} ORDER BY created_at DESC
    `, params) as Notificacion[];
  }
  
  findSinLeerCount(usuarioId?: number): number {
    const where = usuarioId !== undefined ? 'WHERE usuario_id = ? AND leido = 0' : 'WHERE leido = 0';
    const result = runQuery(`SELECT COUNT(*) as count FROM notificaciones ${where}`, 
      usuarioId !== undefined ? [usuarioId] : []);
    return result[0]?.count || 0;
  }
  
  create(data: Omit<Notificacion, 'id' | 'createdAt'>): number {
    return runInsert(`
      INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_id, leido) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      data.usuarioId || null, data.tipo, data.titulo, data.mensaje, data.referenciaId || null, data.leido ? 1 : 0
    ]);
  }
  
  markAsRead(id: number): void {
    runUpdate('UPDATE notificaciones SET leido = 1 WHERE id = ?', [id]);
  }
  
  markAllAsRead(usuarioId?: number): void {
    if (usuarioId) {
      runUpdate('UPDATE notificaciones SET leido = 1 WHERE usuario_id = ?', [usuarioId]);
    } else {
      runUpdate('UPDATE notificaciones SET leido = 1', []);
    }
  }
}