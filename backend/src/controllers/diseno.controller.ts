import { Request, Response } from 'express';
import { DisenoService } from '../services';

export class DisenoController {
  private service: DisenoService;
  
  constructor() {
    this.service = new DisenoService();
  }
  
  findAll = (req: Request, res: Response) => {
    try {
      const servicioId = req.query.servicio_id ? parseInt(String(req.query.servicio_id)) : undefined;
      const incluirTodos = String(req.query.todos) === 'true';
      const activo = incluirTodos
        ? undefined
        : String(req.query.activo) === 'false'
          ? false
          : true;
      const disenos = this.service.getAll(servicioId, activo);
      res.json({ success: true, data: disenos });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  findById = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const diseno = this.service.getById(id);
      
      if (!diseno) {
        return res.status(404).json({ success: false, mensaje: 'Diseño no encontrado' });
      }
      
      res.json({ success: true, data: diseno });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  create = (req: Request, res: Response) => {
    try {
      const { servicioId, nombre, descripcion, imagen, ancho, alto, unidad } = req.body;
      const id = this.service.create({ servicioId, nombre, descripcion, imagen, ancho, alto, unidad });
      res.status(201).json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  update = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { nombre, descripcion, imagen, ancho, alto, unidad, activo } = req.body;
      this.service.update(id, { nombre, descripcion, imagen, ancho, alto, unidad, activo });
      res.json({ success: true, mensaje: 'Diseño actualizado' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  delete = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      this.service.delete(id);
      res.json({ success: true, mensaje: 'Diseño eliminado' });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
}