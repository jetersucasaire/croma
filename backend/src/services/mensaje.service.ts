import { MensajeRepository } from '../repositories';
import { Mensaje } from '../models';

export class MensajeService {
  private repo: MensajeRepository;
  
  constructor() {
    this.repo = new MensajeRepository();
  }
  
  getByPedido(pedidoId: number): Mensaje[] {
    return this.repo.findByPedido(pedidoId);
  }
  
  create(data: { pedidoId: number; remitenteId?: number; contenido: string; tipo?: string }): number {
    return this.repo.create({
      pedidoId: data.pedidoId,
      remitenteId: data.remitenteId,
      tipo: (data.tipo as any) || 'mensaje',
      contenido: data.contenido,
      leido: false
    });
  }
  
  markAsRead(id: number): void {
    this.repo.markAsRead(id);
  }
  
  getHistorial(pedidoId: number): any[] {
    return this.repo.getHistorialByPedido(pedidoId);
  }
  
  addHistorial(data: { pedidoId?: number; canal: string; mensaje: string; enviadoPor?: number }): number {
    return this.repo.addHistorial({
      pedidoId: data.pedidoId,
      canal: data.canal as any,
      mensaje: data.mensaje,
      enviadoPor: data.enviadoPor
    });
  }
}