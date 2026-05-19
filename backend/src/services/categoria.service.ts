import { CategoriaRepository } from '../repositories';
import { Categoria } from '../models';
import crypto from 'crypto';

export class CategoriaService {
  private repo: CategoriaRepository;
  
  constructor() {
    this.repo = new CategoriaRepository();
  }
  
  getAll(servicioId?: number, activo = true): Categoria[] {
    return this.repo.findAll(servicioId, activo);
  }
  
  getById(id: number): Categoria | undefined {
    return this.repo.findById(id);
  }
  
  create(data: { servicioId?: number; nombre: string; icono?: string }): number {
    return this.repo.create({
      uuid: crypto.randomUUID(),
      servicioId: data.servicioId,
      nombre: data.nombre,
      icono: data.icono,
      activo: true
    });
  }
  
  update(id: number, data: Partial<Categoria>): void {
    const existente = this.repo.findById(id);
    if (!existente) {
      throw new Error('Categoría no encontrada');
    }
    this.repo.update(id, data);
  }
  
  delete(id: number): void {
    this.repo.delete(id);
  }
}