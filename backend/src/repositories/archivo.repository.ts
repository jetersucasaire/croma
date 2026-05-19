import { runQuery, runInsert, runUpdate } from '../database';
import { Archivo, PedidoArchivo } from '../models';

export class ArchivoRepository {
  
  findAll(usuarioId?: number): Archivo[] {
    const where = usuarioId !== undefined ? 'WHERE usuario_id = ?' : '';
    return runQuery(`
      SELECT id, uuid, usuario_id as usuarioId, nombre, url, formato, tamano, created_at as createdAt
      FROM archivos ${where} ORDER BY created_at DESC
    `, usuarioId !== undefined ? [usuarioId] : []) as Archivo[];
  }
  
  findById(id: number): Archivo | undefined {
    const result = runQuery(`
      SELECT id, uuid, usuario_id as usuarioId, nombre, url, formato, tamano, created_at as createdAt
      FROM archivos WHERE id = ?
    `, [id]);
    return result[0] as Archivo | undefined;
  }
  
  create(data: Omit<Archivo, 'id' | 'createdAt'>): number {
    return runInsert(
      `INSERT INTO archivos (uuid, usuario_id, nombre, url, formato, tamano) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.uuid, data.usuarioId, data.nombre, data.url, data.formato || null, data.tamano || 0]
    );
  }
  
  delete(id: number): void {
    runUpdate('DELETE FROM archivos WHERE id = ?', [id]);
  }
  
  findByPedido(pedidoId: number): PedidoArchivo[] {
    return runQuery(`
      SELECT id, uuid, pedido_id as pedidoId, tipo, nombre, url, formato, tamano, created_at as createdAt
      FROM pedido_archivos WHERE pedido_id = ? ORDER BY created_at DESC
    `, [pedidoId]) as PedidoArchivo[];
  }
  
  createPedidoArchivo(data: Omit<PedidoArchivo, 'id' | 'createdAt'>): number {
    return runInsert(
      `INSERT INTO pedido_archivos (uuid, pedido_id, tipo, nombre, url, formato, tamano) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.uuid, data.pedidoId, data.tipo || 'otros', data.nombre, data.url, data.formato || null, data.tamano || 0]
    );
  }
}