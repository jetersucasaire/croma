import { PedidoRepository } from '../repositories';
import { Pedido, PedidoCompleto } from '../models';
import { NotificacionService } from './notificacion.service';
import { emitNotificacion, emitActualizacionPedido, emitCambioEstado } from './socket';
import crypto from 'crypto';

export class PedidoService {
  private repo: PedidoRepository;
  
  constructor() {
    this.repo = new PedidoRepository();
  }
  
  generarTrackingId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CROMA-${timestamp}-${random}`;
  }
  
  getAll(usuarioId?: number, estado?: string, diseniadorId?: number): Pedido[] {
    return this.repo.findAll(usuarioId, estado, diseniadorId);
  }
  
  getById(id: number): Pedido | undefined {
    return this.repo.findById(id);
  }
  
  getCompletoById(id: number): PedidoCompleto | undefined {
    return this.repo.findCompletoById(id);
  }
  
  getByUuid(uuid: string): Pedido | undefined {
    return this.repo.findByUuid(uuid);
  }
  
  getByTrackingId(trackingId: string): Pedido | undefined {
    return this.repo.findByTrackingId(trackingId);
  }
  
  create(data: {
    usuarioId?: number;
    servicioId?: number;
    total?: number;
    notas?: string;
    clienteNombre?: string;
    clienteEmail?: string;
    clienteTelefono?: string;
    tipoItem?: string;
    itemNombre?: string;
    itemDescripcion?: string;
    medida?: string;
    color?: string;
    disenoPersonalizado?: string;
    material?: string;
  }): number {
    const uuid = crypto.randomUUID();
    const trackingId = this.generarTrackingId();
    
    const pedidoId = this.repo.create({
      uuid,
      usuarioId: data.usuarioId,
      servicioId: data.servicioId,
      fase: 'diseno',
      estadoProduccion: 'pendiente',
      total: data.total || 0,
      trackingId,
      notas: data.notas,
      clienteNombre: data.clienteNombre,
      clienteEmail: data.clienteEmail,
      clienteTelefono: data.clienteTelefono,
      tipoItem: data.tipoItem,
      itemNombre: data.itemNombre,
      itemDescripcion: data.itemDescripcion,
      medida: data.medida,
      color: data.color,
      disenoPersonalizado: data.disenoPersonalizado,
      material: data.material,
    });

    this.repo.insertSeguimientoDetallado(pedidoId, {
      ...data,
      trackingId,
      estado: 'pendiente',
    });

    if (!this.repo.findDisenio(pedidoId)) {
      this.repo.saveDisenio({ pedidoId, tipoCarga: 'catalogo' });
    }

    return pedidoId;
  }
  
  update(id: number, data: { fase?: string; total?: number; notas?: string }): void {
    const existente = this.repo.findById(id);
    if (!existente) {
      throw new Error('Pedido no encontrado');
    }
    this.repo.update(id, data);
  }
  
  updateEstado(id: number, estado: string, nota?: string): void {
    const existente = this.repo.findById(id);
    if (!existente) {
      throw new Error('Pedido no encontrado');
    }
    
    const diseno = this.repo.findDisenio(id);
    if (!diseno) {
      throw new Error('No se puede cambiar el estado: el pedido no tiene un diseño asociado');
    }
    
    this.repo.update(id, { estadoProduccion: estado as any });
    this.repo.addSeguimiento(id, estado, nota);
    
    const pedidoActualizado = this.repo.findById(id);
    if (pedidoActualizado) {
      emitCambioEstado({
        pedidoId: pedidoActualizado.id,
        trackingId: pedidoActualizado.trackingId || '',
        fase: pedidoActualizado.fase,
        estado: pedidoActualizado.estadoProduccion,
        mensaje: nota,
      });
      emitActualizacionPedido(pedidoActualizado);
    }
  }

  asignarDiseniador(pedidoId: number, diseniadorId: number, asignadoPor: string): void {
    const pedido = this.repo.findById(pedidoId);
    if (!pedido) throw new Error('Pedido no encontrado');

    const pedidoDetalle = this.repo.findCompletoById(pedidoId) as Record<string, unknown> | undefined;
    
    const responsable = this.repo.getDiseniadores().find(d => d.id === diseniadorId);
    if (!responsable) throw new Error('Responsable no encontrado');
    
    this.repo.update(pedidoId, { diseniadorId } as any);
    this.repo.addSeguimiento(pedidoId, 'asignado', `Responsable asignado: ${responsable.nombre} (${responsable.rol || 'staff'})`);

    const itemNombre =
      (pedidoDetalle?.itemNombre as string) ||
      (pedidoDetalle?.servicioNombre as string) ||
      'Pedido';
    const clienteNombre =
      (pedidoDetalle?.clienteNombre as string) ||
      (pedidoDetalle?.pedidoClienteNombre as string) ||
      'Sin datos de cliente';
    const trackingId = pedido.trackingId || `CROMA-${pedidoId}`;
    const estado = String(pedido.estadoProduccion || 'pendiente');
    const estadoLabel: Record<string, string> = {
      pendiente: 'Pendiente',
      en_cola: 'En cola',
      imprimiendo: 'Imprimiendo',
      acabado: 'Acabado',
      entregado: 'Entregado',
    };
    const rolLabel = responsable.rol === 'admin' ? 'administrador' : 'diseñador';

    const titulo = `📋 Nuevo pedido asignado: ${itemNombre}`;
    const mensaje = [
      `${asignadoPor} te designó como responsable (${rolLabel}).`,
      '',
      `Servicio / producto: ${itemNombre}`,
      `Cliente: ${clienteNombre}`,
      `Seguimiento: ${trackingId}`,
      `Estado actual: ${estadoLabel[estado] || estado}`,
      '',
      'Abre el panel para ver el detalle y comenzar el trabajo.',
    ].join('\n');

    const notifService = new NotificacionService();
    const notif = notifService.createAndGet({
      usuarioId: diseniadorId,
      tipo: 'asignacion',
      titulo,
      mensaje,
      referenciaId: pedidoId,
    });

    emitNotificacion(diseniadorId, {
      ...notif,
      meta: {
        pedidoId,
        trackingId,
        itemNombre,
        clienteNombre,
        asignadoPor,
        responsableNombre: responsable.nombre,
        responsableRol: responsable.rol,
        estado,
      },
    });
    
    emitActualizacionPedido({ ...pedido, diseniadorId, diseniadorNombre: responsable.nombre });
  }
  
  saveDisenio(pedidoId: number, diseno: { disenoId?: number; archivoUrl?: string; archivoNombre?: string; tipoCarga?: string; enlaceExterno?: string; parametros?: any }): void {
    this.repo.saveDisenio({
      pedidoId,
      disenoId: diseno.disenoId,
      archivoUrl: diseno.archivoUrl,
      archivoNombre: diseno.archivoNombre,
      tipoCarga: (diseno.tipoCarga as any) || 'catalogo',
      enlaceExterno: diseno.enlaceExterno,
      parametros: diseno.parametros
    });
  }
  
  saveConfig(pedidoId: number, config: { materialId?: number; cantidad?: number; precioUnitario?: number; opciones?: any }): void {
    this.repo.saveConfig({
      pedidoId,
      materialId: config.materialId,
      cantidad: config.cantidad || 1,
      precioUnitario: config.precioUnitario || 0,
      opciones: config.opciones
    });
  }
  
  addSeguimiento(pedidoId: number, estado: string, nota?: string): number {
    return this.repo.addSeguimiento(pedidoId, estado, nota);
  }
  
  getSeguimiento(pedidoId: number): any[] {
    return this.repo.findSeguimiento(pedidoId);
  }
  
  addEntrega(pedidoId: number, urlDescarga: string, version: string, comentario: string): number {
    const existente = this.repo.findById(pedidoId);
    if (!existente) {
      throw new Error('Pedido no encontrado');
    }

    const entregaId = this.repo.createEntrega(pedidoId, urlDescarga, version, comentario);

    // Marcar el pedido como entregado y agregar seguimiento
    this.repo.update(pedidoId, { estadoProduccion: 'entregado' as any });
    this.repo.addSeguimiento(pedidoId, 'entregado', `Trabajo entregado v${version}${comentario ? ': ' + comentario : ''}`);

    // Notificar al cliente si tiene cuenta
    const pedidoDetalle = this.repo.findCompletoById(pedidoId) as Record<string, unknown> | undefined;
    const clienteId = existente.usuarioId;
    const trackingId = existente.trackingId || `CROMA-${pedidoId}`;
    const itemNombre =
      (pedidoDetalle?.itemNombre as string) ||
      (pedidoDetalle?.servicioNombre as string) ||
      'Tu pedido';

    if (clienteId) {
      const notifService = new NotificacionService();
      const notif = notifService.createAndGet({
        usuarioId: clienteId,
        tipo: 'entrega',
        titulo: `✅ Trabajo listo: ${itemNombre}`,
        mensaje: [
          `Tu pedido está listo para descargar.`,
          ``,
          `Servicio: ${itemNombre}`,
          `Seguimiento: ${trackingId}`,
          version ? `Versión: ${version}` : '',
          comentario ? `Nota: ${comentario}` : '',
          ``,
          'Ingresa a tu perfil → Mis Pedidos para descargarlo.',
        ].filter(Boolean).join('\n'),
        referenciaId: pedidoId,
      });

      emitNotificacion(clienteId, {
        ...notif,
        meta: {
          pedidoId,
          trackingId,
          itemNombre,
          urlDescarga,
        } as any,
      });
    }

    // Emitir actualización del pedido para el panel admin/diseñador
    const pedidoActualizado = this.repo.findById(pedidoId);
    if (pedidoActualizado) {
      emitCambioEstado({
        pedidoId: pedidoActualizado.id,
        trackingId: pedidoActualizado.trackingId || '',
        fase: pedidoActualizado.fase,
        estado: 'entregado',
        mensaje: `Trabajo entregado v${version}`,
      });
      emitActualizacionPedido(pedidoActualizado);
    }

    return entregaId;
  }

  getEntregas(pedidoId: number): any[] {
    return this.repo.findEntregasByPedido(pedidoId);
  }

  delete(id: number): void {
    this.repo.delete(id);
  }
}