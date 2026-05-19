import { runQuery, runInsert, runUpdate } from '../database';
import { Mensaje, HistorialContacto } from '../models';

export class MensajeRepository {
  
  findByPedido(pedidoId: number): Mensaje[] {
    return runQuery(`
      SELECT id, pedido_id as pedidoId, remitente_id as remitenteId, tipo, contenido, 
             leido, created_at as createdAt
      FROM mensajes WHERE pedido_id = ? ORDER BY created_at ASC
    `, [pedidoId]) as Mensaje[];
  }
  
  findById(id: number): Mensaje | undefined {
    const result = runQuery(`
      SELECT id, pedido_id as pedidoId, remitente_id as remitenteId, tipo, contenido, 
             leido, created_at as createdAt
      FROM mensajes WHERE id = ?
    `, [id]);
    return result[0] as Mensaje | undefined;
  }
  
  create(data: Omit<Mensaje, 'id' | 'createdAt'>): number {
    return runInsert(`
      INSERT INTO mensajes (pedido_id, remitente_id, tipo, contenido, leido) VALUES (?, ?, ?, ?, ?)
    `, [
      data.pedidoId, data.remitenteId || null, data.tipo || 'mensaje', data.contenido, data.leido ? 1 : 0
    ]);
  }
  
  markAsRead(id: number): void {
    runUpdate('UPDATE mensajes SET leido = 1 WHERE id = ?', [id]);
  }
  
  getHistorialByPedido(pedidoId: number): HistorialContacto[] {
    return runQuery(`
      SELECT id, pedido_id as pedidoId, canal, mensaje, enviado_por as enviadoPor, created_at as createdAt
      FROM historial_contacto WHERE pedido_id = ? ORDER BY created_at DESC
    `, [pedidoId]) as HistorialContacto[];
  }
  
  addHistorial(data: Omit<HistorialContacto, 'id' | 'createdAt'>): number {
    return runInsert(`
      INSERT INTO historial_contacto (pedido_id, canal, mensaje, enviado_por) VALUES (?, ?, ?, ?)
    `, [data.pedidoId || null, data.canal, data.mensaje, data.enviadoPor || null]);
  }
}