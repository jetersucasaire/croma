import { NotificacionRepository } from '../repositories';
import { Notificacion } from '../models';

export class NotificacionService {
  private repo: NotificacionRepository;
  
  constructor() {
    this.repo = new NotificacionRepository();
  }
  
  getAll(usuarioId?: number): Notificacion[] {
    return this.repo.findAll(usuarioId);
  }
  
  getSinLeerCount(usuarioId?: number): number {
    return this.repo.findSinLeerCount(usuarioId);
  }
  
  create(data: { usuarioId?: number; tipo: string; titulo: string; mensaje: string; referenciaId?: number }): number {
    return this.repo.create({
      usuarioId: data.usuarioId,
      tipo: data.tipo as Notificacion['tipo'],
      titulo: data.titulo,
      mensaje: data.mensaje,
      referenciaId: data.referenciaId,
      leido: false
    });
  }

  createAndGet(data: {
    usuarioId?: number;
    tipo: string;
    titulo: string;
    mensaje: string;
    referenciaId?: number;
  }): Notificacion {
    const id = this.create(data);
    return {
      id,
      usuarioId: data.usuarioId,
      tipo: data.tipo as Notificacion['tipo'],
      titulo: data.titulo,
      mensaje: data.mensaje,
      referenciaId: data.referenciaId,
      leido: false,
      createdAt: new Date().toISOString(),
    };
  }
  
  markAsRead(id: number): void {
    this.repo.markAsRead(id);
  }
  
  markAllAsRead(usuarioId?: number): void {
    this.repo.markAllAsRead(usuarioId);
  }
}