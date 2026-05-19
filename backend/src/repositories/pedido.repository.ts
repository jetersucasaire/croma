import crypto from 'crypto';
import { runQuery, runInsert, runUpdate } from '../database';
import { Pedido, PedidoDisenio, PedidoConfig, PedidoSeguimiento, PedidoCompleto } from '../models';

export class PedidoRepository {

  private selectPedidoBase = `
    p.id, p.uuid, p.usuario_id as usuarioId, p.servicio_id as servicioId, p.diseniador_id as diseniadorId,
    p.fase, p.estado_produccion as estadoProduccion, p.total, p.tracking_id as trackingId,
    p.notas, p.created_at as createdAt, p.created_at as fechaCreacion, p.updated_at as updatedAt,
    p.tipo_item as tipoItem, p.item_nombre as itemNombre, p.item_descripcion as itemDescripcion,
    p.medida, p.color, p.diseno_personalizado as disenoPersonalizado, p.material,
    COALESCE(p.cliente_nombre, u.nombre) as clienteNombre,
    COALESCE(p.cliente_nombre, u.nombre) as pedidoClienteNombre,
    COALESCE(p.cliente_email, u.email) as clienteEmail,
    COALESCE(p.cliente_email, u.email) as pedidoClienteEmail,
    COALESCE(p.cliente_telefono, u.whatsapp) as clienteTelefono,
    COALESCE(p.cliente_telefono, u.whatsapp) as pedidoClienteTelefono,
    COALESCE(p.cliente_nombre, u.nombre) as cliente,
    s.nombre as servicioNombre,
    resp.nombre as diseniadorNombre,
    (SELECT COUNT(*) FROM pedido_disenio WHERE pedido_id = p.id) > 0 as disenoExiste
  `;

  private fromJoins = `
    FROM pedidos p
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    LEFT JOIN servicios s ON p.servicio_id = s.id
    LEFT JOIN usuarios resp ON p.diseniador_id = resp.id
  `;
  
  findAll(usuarioId?: number, estado?: string, diseniadorId?: number): Pedido[] {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (usuarioId !== undefined) {
      whereClause += ' AND p.usuario_id = ?';
      params.push(usuarioId);
    }
    if (estado && estado !== 'todos') {
      whereClause += ' AND p.estado_produccion = ?';
      params.push(estado);
    }
    if (diseniadorId !== undefined) {
      whereClause += ' AND p.diseniador_id = ?';
      params.push(diseniadorId);
    }
    
    return runQuery(`
      SELECT ${this.selectPedidoBase}
      ${this.fromJoins}
      ${whereClause}
      ORDER BY p.created_at DESC
    `, params) as Pedido[];
  }
  
  findById(id: number): Pedido | undefined {
    const result = runQuery(`
      SELECT id, uuid, usuario_id as usuarioId, servicio_id as servicioId, diseniador_id as diseniadorId, fase, 
             estado_produccion as estadoProduccion, total, tracking_id as trackingId, 
             notas, created_at as createdAt, updated_at as updatedAt
      FROM pedidos WHERE id = ?
    `, [id]);
    return result[0] as Pedido | undefined;
  }
  
  findByUuid(uuid: string): Pedido | undefined {
    const result = runQuery(`
      SELECT id, uuid, usuario_id as usuarioId, servicio_id as servicioId, diseniador_id as diseniadorId, fase, 
             estado_produccion as estadoProduccion, total, tracking_id as trackingId, 
             notas, created_at as createdAt, updated_at as updatedAt
      FROM pedidos WHERE uuid = ?
    `, [uuid]);
    return result[0] as Pedido | undefined;
  }
  
  findByTrackingId(trackingId: string): Pedido | undefined {
    const result = runQuery(`
      SELECT id, uuid, usuario_id as usuarioId, servicio_id as servicioId, diseniador_id as diseniadorId, fase, 
             estado_produccion as estadoProduccion, total, tracking_id as trackingId, 
             notas, created_at as createdAt, updated_at as updatedAt
      FROM pedidos WHERE tracking_id = ?
    `, [trackingId]);
    return result[0] as Pedido | undefined;
  }
  
  findCompletoById(id: number): PedidoCompleto | undefined {
    const rows = runQuery(`
      SELECT ${this.selectPedidoBase}
      ${this.fromJoins}
      WHERE p.id = ?
    `, [id]) as Pedido[];
    const pedido = rows[0];
    if (!pedido) return undefined;
    
    const disenoRow = runQuery(`
      SELECT id, pedido_id as pedidoId, diseno_id as disenoId, archivo_url as archivoUrl, 
             archivo_nombre as archivoNombre, tipo_carga as tipoCarga, enlace_externo as enlaceExterno, parametros
      FROM pedido_disenio WHERE pedido_id = ?
    `, [id])[0] as PedidoDisenio | undefined;
    const config = runQuery(`
      SELECT id, pedido_id as pedidoId, material_id as materialId, cantidad, 
             precio_unitario as precioUnitario, opciones
      FROM pedido_config WHERE pedido_id = ?
    `, [id])[0] as PedidoConfig | undefined;
    const seguimiento = runQuery(`
      SELECT id, pedido_id as pedidoId, estado, nota, created_at as createdAt
      FROM pedido_seguimiento WHERE pedido_id = ? ORDER BY created_at DESC
    `, [id]) as PedidoSeguimiento[];
    
    const servicioExtra = runQuery(`SELECT icono as servicioIcono FROM servicios WHERE id = ?`, [pedido.servicioId])[0];

    let diseno = disenoRow;
    if (diseno && diseno.disenoId) {
      const catalogo = runQuery(`SELECT nombre, imagen FROM disenos WHERE id = ?`, [diseno.disenoId])[0];
      if (catalogo) {
        diseno = { ...diseno, catalogo } as any;
      }
    }
    
    const entregas = this.findEntregasByPedido(id);
    
    return {
      ...pedido,
      diseno,
      config,
      seguimiento,
      entregas,
      ...(servicioExtra || {}),
    } as PedidoCompleto;
  }
  
  create(data: Record<string, any>): number {
    return runInsert(`
      INSERT INTO pedidos (
        uuid, usuario_id, servicio_id, diseniador_id, fase, estado_produccion, total, tracking_id, notas,
        cliente_nombre, cliente_email, cliente_telefono, tipo_item, item_nombre, item_descripcion,
        medida, color, diseno_personalizado, material
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.uuid, data.usuarioId || null, data.servicioId || null,
      data.diseniadorId || null,
      data.fase || 'diseno', data.estadoProduccion || 'pendiente',
      data.total || 0, data.trackingId || null, data.notas || null,
      data.clienteNombre || null, data.clienteEmail || null, data.clienteTelefono || null,
      data.tipoItem || 'servicio', data.itemNombre || null, data.itemDescripcion || null,
      data.medida || null, data.color || null, data.disenoPersonalizado || null, data.material || null,
    ]);
  }

  insertSeguimientoDetallado(pedidoId: number, data: Record<string, any>): void {
    runInsert(`
      INSERT INTO pedido_seguimiento_detallado (
        pedido_id, tipo_item, item_nombre, item_descripcion, medida, color, diseno, material,
        cliente_nombre, cliente_telefono, cliente_email, estado, tracking_id, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pedidoId,
      data.tipoItem || 'servicio',
      data.itemNombre || null,
      data.itemDescripcion || null,
      data.medida || null,
      data.color || null,
      data.disenoPersonalizado || null,
      data.material || null,
      data.clienteNombre || null,
      data.clienteTelefono || null,
      data.clienteEmail || null,
      data.estado || 'pendiente',
      data.trackingId || null,
      data.notas || null,
    ]);
  }
  
  update(id: number, data: Partial<Pedido>): void {
    const fields: string[] = [];
    const params: any[] = [];
    
    if (data.fase !== undefined) { fields.push('fase = ?'); params.push(data.fase); }
    if (data.estadoProduccion !== undefined) { fields.push('estado_produccion = ?'); params.push(data.estadoProduccion); }
    if (data.total !== undefined) { fields.push('total = ?'); params.push(data.total); }
    if (data.notas !== undefined) { fields.push('notas = ?'); params.push(data.notas); }
    if (data.diseniadorId !== undefined) { fields.push('diseniador_id = ?'); params.push(data.diseniadorId); }
    
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      runUpdate(`UPDATE pedidos SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    }
  }

  getDiseniadores(): { id: number; nombre: string; rol?: string }[] {
    return runQuery(`
      SELECT id, nombre, rol FROM usuarios 
      WHERE rol IN ('diseniador', 'admin') AND activo = 1 
      ORDER BY rol DESC, nombre
    `);
  }
  
  updateTracking(id: number, trackingId: string): void {
    runUpdate('UPDATE pedidos SET tracking_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [trackingId, id]);
  }
  
  delete(id: number): void {
    runUpdate('UPDATE pedidos SET fase = ? WHERE id = ?', ['cancelado', id]);
  }
  
  findDisenio(pedidoId: number): PedidoDisenio | undefined {
    const result = runQuery(`
      SELECT id, pedido_id as pedidoId, diseno_id as disenoId, archivo_url as archivoUrl, 
             archivo_nombre as archivoNombre, tipo_carga as tipoCarga, enlace_externo as enlaceExterno, parametros
      FROM pedido_disenio WHERE pedido_id = ?
    `, [pedidoId]);
    return result[0] as PedidoDisenio | undefined;
  }
  
  saveDisenio(data: Omit<PedidoDisenio, 'id'>): number {
    const existente = this.findDisenio(data.pedidoId);
    if (existente) {
      runUpdate(`
        UPDATE pedido_disenio SET diseno_id = ?, archivo_url = ?, archivo_nombre = ?, 
        tipo_carga = ?, enlace_externo = ?, parametros = ?
        WHERE pedido_id = ?
      `, [
        data.disenoId || null, data.archivoUrl || null, data.archivoNombre || null,
        data.tipoCarga || 'catalogo', data.enlaceExterno || null, 
        data.parametros ? JSON.stringify(data.parametros) : null, data.pedidoId
      ]);
      return existente.id;
    }
    return runInsert(`
      INSERT INTO pedido_disenio (pedido_id, diseno_id, archivo_url, archivo_nombre, tipo_carga, enlace_externo, parametros)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.pedidoId, data.disenoId || null, data.archivoUrl || null, data.archivoNombre || null,
      data.tipoCarga || 'catalogo', data.enlaceExterno || null, data.parametros ? JSON.stringify(data.parametros) : null
    ]);
  }
  
  findConfig(pedidoId: number): PedidoConfig | undefined {
    const result = runQuery(`
      SELECT id, pedido_id as pedidoId, material_id as materialId, cantidad, 
             precio_unitario as precioUnitario, opciones
      FROM pedido_config WHERE pedido_id = ?
    `, [pedidoId]);
    return result[0] as PedidoConfig | undefined;
  }
  
  saveConfig(data: Omit<PedidoConfig, 'id'>): number {
    const existente = this.findConfig(data.pedidoId);
    if (existente) {
      runUpdate(`
        UPDATE pedido_config SET material_id = ?, cantidad = ?, precio_unitario = ?, opciones = ?
        WHERE pedido_id = ?
      `, [
        data.materialId || null, data.cantidad || 1, data.precioUnitario || 0,
        data.opciones ? JSON.stringify(data.opciones) : null, data.pedidoId
      ]);
      return existente.id;
    }
    return runInsert(`
      INSERT INTO pedido_config (pedido_id, material_id, cantidad, precio_unitario, opciones)
      VALUES (?, ?, ?, ?, ?)
    `, [
      data.pedidoId, data.materialId || null, data.cantidad || 1, 
      data.precioUnitario || 0, data.opciones ? JSON.stringify(data.opciones) : null
    ]);
  }
  
  addSeguimiento(pedidoId: number, estado: string, nota?: string): number {
    return runInsert(
      `INSERT INTO pedido_seguimiento (pedido_id, estado, nota) VALUES (?, ?, ?)`,
      [pedidoId, estado, nota || null]
    );
  }
  
  findSeguimiento(pedidoId: number): PedidoSeguimiento[] {
    return runQuery(`
      SELECT id, pedido_id as pedidoId, estado, nota, created_at as createdAt
      FROM pedido_seguimiento WHERE pedido_id = ? ORDER BY created_at DESC
    `, [pedidoId]) as PedidoSeguimiento[];
  }

  createEntrega(pedidoId: number, urlDescarga: string, version: string, comentario: string): number {
    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const expiracion = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    return runInsert(`
      INSERT INTO entrega (pedido_id, url_descarga, token, fecha_expiracion, version, comentario)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [pedidoId, urlDescarga, token, expiracion, version || '1.0', comentario || null]);
  }

  findEntregasByPedido(pedidoId: number): any[] {
    return runQuery(`
      SELECT id, pedido_id as pedidoId, url_descarga as urlDescarga, token, 
             fecha_generacion as fechaGeneracion, fecha_expiracion as fechaExpiracion,
             acceso_restringido as accesoRestringido, version, comentario, created_at as createdAt
      FROM entrega WHERE pedido_id = ? ORDER BY created_at DESC
    `, [pedidoId]);
  }
}