import { DisenoRepository } from '../repositories';
import { Diseno } from '../models';
import crypto from 'crypto';

export class DisenoService {
  private repo: DisenoRepository;
  
  constructor() {
    this.repo = new DisenoRepository();
  }
  
  getAll(servicioId?: number, activo?: boolean): Diseno[] {
    return this.repo.findAll(servicioId, activo);
  }
  
  getById(id: number): Diseno | undefined {
    return this.repo.findById(id);
  }
  
  create(data: { servicioId: number; nombre: string; descripcion?: string; imagen?: string; ancho?: number; alto?: number; unidad?: string }): number {
    return this.repo.create({
      uuid: crypto.randomUUID(),
      servicioId: data.servicioId,
      nombre: data.nombre,
      descripcion: data.descripcion,
      imagen: data.imagen,
      ancho: data.ancho || 0,
      alto: data.alto || 0,
      unidad: data.unidad || 'cm',
      activo: true
    });
  }
  
  update(id: number, data: Partial<Diseno>): void {
    const existente = this.repo.findById(id);
    if (!existente) {
      throw new Error('Diseño no encontrado');
    }
    this.repo.update(id, data);
  }
  
  delete(id: number): void {
    this.repo.softDelete(id);
  }
}