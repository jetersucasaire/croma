import { MaterialRepository } from '../repositories';
import { Material } from '../models';
import crypto from 'crypto';

export class MaterialService {
  private repo: MaterialRepository;
  
  constructor() {
    this.repo = new MaterialRepository();
  }
  
  getAll(servicioId?: number, activo?: boolean): Material[] {
    return this.repo.findAll(servicioId, activo);
  }
  
  getById(id: number): Material | undefined {
    return this.repo.findById(id);
  }
  
  create(data: { servicioId: number; nombre: string; descripcion?: string; tipo?: string; gramaje?: number; compatibleFormato?: string; precioUnitario: number; stock?: number }): number {
    return this.repo.create({
      uuid: crypto.randomUUID(),
      servicioId: data.servicioId,
      nombre: data.nombre,
      descripcion: data.descripcion,
      tipo: data.tipo,
      gramaje: data.gramaje,
      compatibleFormato: data.compatibleFormato,
      precioUnitario: data.precioUnitario,
      stock: data.stock || 0,
      activo: true
    });
  }
  
  update(id: number, data: Partial<Material>): void {
    const existente = this.repo.findById(id);
    if (!existente) {
      throw new Error('Material no encontrado');
    }
    this.repo.update(id, data);
  }
  
  delete(id: number): void {
    this.repo.softDelete(id);
  }
}