import { ArmazonRepository } from '../repositories';
import { Armazon } from '../models';
import crypto from 'crypto';

export class ArmazonService {
  private repo: ArmazonRepository;
  
  constructor() {
    this.repo = new ArmazonRepository();
  }
  
  getAll(mecanismo?: string, activo = true): Armazon[] {
    return this.repo.findAll(mecanismo, activo);
  }
  
  getById(id: number): Armazon | undefined {
    return this.repo.findById(id);
  }
  
  create(data: { nombre: string; mecanismo: string; forma?: string; dimensionesMax?: string; precio: number; stock?: number }): number {
    return this.repo.create({
      uuid: crypto.randomUUID(),
      nombre: data.nombre,
      mecanismo: data.mecanismo as any,
      forma: data.forma,
      dimensionesMax: data.dimensionesMax,
      precio: data.precio,
      stock: data.stock || 0,
      activo: true
    });
  }
  
  update(id: number, data: Partial<Armazon>): void {
    const existente = this.repo.findById(id);
    if (!existente) {
      throw new Error('Armazón no encontrado');
    }
    this.repo.update(id, data);
  }
  
  delete(id: number): void {
    this.repo.delete(id);
  }
}