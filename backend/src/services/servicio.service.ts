import { ServicioRepository } from '../repositories';
import { Servicio, Portafolio } from '../models';
import crypto from 'crypto';

export class ServicioService {
  private repo: ServicioRepository;
  
  constructor() {
    this.repo = new ServicioRepository();
  }
  
  /** @param activo undefined = todos, true/false = filtrar por estado */
  getAll(activo?: boolean): Servicio[] {
    return this.repo.findAll(activo);
  }
  
  getById(id: number): Servicio | undefined {
    return this.repo.findById(id);
  }
  
  getBySlug(slug: string): Servicio | undefined {
    return this.repo.findBySlug(slug);
  }
  
  create(data: { nombre: string; slug?: string; descripcion?: string; icono?: string; imagen?: string; precioBase?: number; unidad?: string }): number {
    const slug = data.slug || data.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    if (this.repo.existsBySlugOrNombre(slug, data.nombre)) {
      throw new Error('Ya existe un servicio con ese nombre o slug');
    }
    
    return this.repo.create({
      uuid: crypto.randomUUID(),
      nombre: data.nombre,
      slug,
      descripcion: data.descripcion,
      icono: data.icono,
      imagen: data.imagen,
      precioBase: data.precioBase || 0,
      unidad: data.unidad || 'und',
      activo: true
    });
  }
  
  update(id: number, data: Partial<Servicio>): void {
    const existente = this.repo.findById(id);
    if (!existente) {
      throw new Error('Servicio no encontrado');
    }
    
    if (data.slug || data.nombre) {
      if (this.repo.existsBySlugOrNombre(data.slug || existente.slug, data.nombre || existente.nombre, id)) {
        throw new Error('Ya existe otro servicio con ese nombre o slug');
      }
    }
    
    this.repo.update(id, data);
  }
  
  delete(id: number): void {
    this.repo.softDelete(id);
  }
  
  getPortafolio(servicioId: number): Portafolio[] {
    return this.repo.findPortafolio(servicioId);
  }
  
  addPortafolio(data: { servicioId: number; titulo: string; descripcion?: string; urlImagen: string; esPortada?: boolean }): number {
    return this.repo.createPortafolio({
      servicioId: data.servicioId,
      titulo: data.titulo,
      descripcion: data.descripcion,
      urlImagen: data.urlImagen,
      esPortada: data.esPortada || false
    });
  }
  
  deletePortafolio(id: number): void {
    this.repo.deletePortafolio(id);
  }
}