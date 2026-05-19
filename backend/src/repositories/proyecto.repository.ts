import { runQuery, runInsert, runUpdate } from '../database';
import { Proyecto, ProyectoEntrega, ProyectoPreferencias } from '../models';

export class ProyectoRepository {
  
  findAll(usuarioId?: number): Proyecto[] {
    const where = usuarioId !== undefined ? 'WHERE usuario_id = ?' : '';
    return runQuery(`
      SELECT id, uuid, usuario_id as usuarioId, servicio_id as servicioId, estado, 
             fase_actual as faseActual, presupuesto, tracking_id as trackingId,
             created_at as createdAt, updated_at as updatedAt
      FROM proyectos ${where} ORDER BY created_at DESC
    `, usuarioId !== undefined ? [usuarioId] : []) as Proyecto[];
  }
  
  findById(id: number): Proyecto | undefined {
    const result = runQuery(`
      SELECT id, uuid, usuario_id as usuarioId, servicio_id as servicioId, estado, 
             fase_actual as faseActual, presupuesto, tracking_id as trackingId,
             created_at as createdAt, updated_at as updatedAt
      FROM proyectos WHERE id = ?
    `, [id]);
    return result[0] as Proyecto | undefined;
  }
  
  create(data: Omit<Proyecto, 'id' | 'createdAt' | 'updatedAt'>): number {
    return runInsert(`
      INSERT INTO proyectos (uuid, usuario_id, servicio_id, estado, fase_actual, presupuesto, tracking_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.uuid, data.usuarioId, data.servicioId, data.estado || 'briefing', 
      data.faseActual || 1, data.presupuesto || 0, data.trackingId || null
    ]);
  }
  
  update(id: number, data: Partial<Proyecto>): void {
    const fields: string[] = [];
    const params: any[] = [];
    
    if (data.estado !== undefined) { fields.push('estado = ?'); params.push(data.estado); }
    if (data.faseActual !== undefined) { fields.push('fase_actual = ?'); params.push(data.faseActual); }
    if (data.presupuesto !== undefined) { fields.push('presupuesto = ?'); params.push(data.presupuesto); }
    
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      runUpdate(`UPDATE proyectos SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    }
  }
  
  findEntregas(proyectoId: number): ProyectoEntrega[] {
    return runQuery(`
      SELECT id, proyecto_id as proyectoId, version, etiqueta, archivos_json as archivosJson,
             observaciones, estado, created_at as createdAt
      FROM proyecto_entregas WHERE proyecto_id = ? ORDER BY created_at DESC
    `, [proyectoId]) as ProyectoEntrega[];
  }
  
  addEntrega(data: Omit<ProyectoEntrega, 'id' | 'createdAt'>): number {
    return runInsert(`
      INSERT INTO proyecto_entregas (proyecto_id, version, etiqueta, archivos_json, observaciones, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      data.proyectoId, data.version, data.etiqueta || 'boceto', 
      data.archivosJson || null, data.observaciones || null, data.estado || 'pendiente'
    ]);
  }
  
  findPreferencias(proyectoId: number): ProyectoPreferencias | undefined {
    const result = runQuery(`
      SELECT id, proyecto_id as proyectoId, colores_hex as coloresHex, tipografias, estilo,
             valores_marca as valoresMarca, public_objetivo as publicObjetivo, eslogan, created_at as createdAt
      FROM proyecto_preferencias WHERE proyecto_id = ?
    `, [proyectoId]);
    return result[0] as ProyectoPreferencias | undefined;
  }
  
  savePreferencias(data: Omit<ProyectoPreferencias, 'id' | 'createdAt'>): number {
    const existente = this.findPreferencias(data.proyectoId);
    if (existente) {
      runUpdate(`
        UPDATE proyecto_preferencias SET colores_hex = ?, tipografias = ?, estilo = ?, 
        valores_marca = ?, public_objetivo = ?, eslogan = ? WHERE proyecto_id = ?
      `, [
        data.coloresHex || null, data.tipografias || null, data.estilo || null,
        data.valoresMarca || null, data.publicObjetivo || null, data.eslogan || null, data.proyectoId
      ]);
      return existente.id;
    }
    return runInsert(`
      INSERT INTO proyecto_preferencias (proyecto_id, colores_hex, tipografias, estilo, valores_marca, public_objetivo, eslogan)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.proyectoId, data.coloresHex || null, data.tipografias || null, data.estilo || null,
      data.valoresMarca || null, data.publicObjetivo || null, data.eslogan || null
    ]);
  }
}