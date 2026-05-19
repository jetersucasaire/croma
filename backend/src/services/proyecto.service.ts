import { ProyectoRepository } from '../repositories';
import { Proyecto, ProyectoEntrega, ProyectoPreferencias } from '../models';
import crypto from 'crypto';

export class ProyectoService {
  private repo: ProyectoRepository;
  
  constructor() {
    this.repo = new ProyectoRepository();
  }
  
  generarTrackingId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CROMA-${timestamp}-${random}`;
  }
  
  getAll(usuarioId?: number): Proyecto[] {
    return this.repo.findAll(usuarioId);
  }
  
  getById(id: number): Proyecto | undefined {
    return this.repo.findById(id);
  }
  
  create(data: { usuarioId: number; servicioId: number; presupuesto?: number }): number {
    return this.repo.create({
      uuid: crypto.randomUUID(),
      usuarioId: data.usuarioId,
      servicioId: data.servicioId,
      estado: 'briefing',
      faseActual: 1,
      presupuesto: data.presupuesto || 0,
      trackingId: this.generarTrackingId()
    });
  }
  
  update(id: number, data: { estado?: string; faseActual?: number; presupuesto?: number }): void {
    const existente = this.repo.findById(id);
    if (!existente) {
      throw new Error('Proyecto no encontrado');
    }
    this.repo.update(id, data);
  }
  
  getEntregas(proyectoId: number): ProyectoEntrega[] {
    return this.repo.findEntregas(proyectoId);
  }
  
  addEntrega(data: { proyectoId: number; version: string; etiqueta?: string; archivosJson?: string; observaciones?: string; estado?: string }): number {
    return this.repo.addEntrega({
      proyectoId: data.proyectoId,
      version: data.version,
      etiqueta: (data.etiqueta as any) || 'boceto',
      archivosJson: data.archivosJson,
      observaciones: data.observaciones,
      estado: (data.estado as any) || 'pendiente'
    });
  }
  
  getPreferencias(proyectoId: number): ProyectoPreferencias | undefined {
    return this.repo.findPreferencias(proyectoId);
  }
  
  savePreferencias(data: { proyectoId: number; coloresHex?: string; tipografias?: string; estilo?: string; valoresMarca?: string; publicObjetivo?: string; eslogan?: string }): number {
    return this.repo.savePreferencias({
      proyectoId: data.proyectoId,
      coloresHex: data.coloresHex,
      tipografias: data.tipografias,
      estilo: data.estilo,
      valoresMarca: data.valoresMarca,
      publicObjetivo: data.publicObjetivo,
      eslogan: data.eslogan
    });
  }
}