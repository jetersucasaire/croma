import { ArchivoRepository } from '../repositories';
import { Archivo } from '../models';
import crypto from 'crypto';

export class ArchivoService {
  private repo: ArchivoRepository;
  
  constructor() {
    this.repo = new ArchivoRepository();
  }
  
  getAll(usuarioId?: number): Archivo[] {
    return this.repo.findAll(usuarioId);
  }
  
  getById(id: number): Archivo | undefined {
    return this.repo.findById(id);
  }
  
  create(data: { usuarioId: number; nombre: string; url: string; formato?: string; tamano?: number }): number {
    return this.repo.create({
      uuid: crypto.randomUUID(),
      usuarioId: data.usuarioId,
      nombre: data.nombre,
      url: data.url,
      formato: data.formato,
      tamano: data.tamano || 0
    });
  }
  
  delete(id: number): void {
    this.repo.delete(id);
  }
  
  getByPedido(pedidoId: number): any[] {
    return this.repo.findByPedido(pedidoId);
  }
  
  createPedidoArchivo(data: { pedidoId: number; nombre: string; url: string; tipo?: string; formato?: string; tamano?: number }): number {
    return this.repo.createPedidoArchivo({
      uuid: crypto.randomUUID(),
      pedidoId: data.pedidoId,
      tipo: (data.tipo as any) || 'otros',
      nombre: data.nombre,
      url: data.url,
      formato: data.formato,
      tamano: data.tamano
    });
  }
}