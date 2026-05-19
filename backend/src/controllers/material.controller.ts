import { Request, Response } from 'express';
import { MaterialService } from '../services';

export class MaterialController {
  private service: MaterialService;
  
  constructor() {
    this.service = new MaterialService();
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
      const materiales = this.service.getAll(servicioId, activo);
      res.json({ success: true, data: materiales });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  findById = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const material = this.service.getById(id);
      
      if (!material) {
        return res.status(404).json({ success: false, mensaje: 'Material no encontrado' });
      }
      
      res.json({ success: true, data: material });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  create = (req: Request, res: Response) => {
    try {
      const { servicioId, nombre, descripcion, tipo, gramaje, compatibleFormato, precioUnitario, stock } = req.body;
      const id = this.service.create({ servicioId, nombre, descripcion, tipo, gramaje, compatibleFormato, precioUnitario, stock });
      res.status(201).json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  update = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { nombre, descripcion, tipo, gramaje, compatibleFormato, precioUnitario, stock, activo } = req.body;
      this.service.update(id, { nombre, descripcion, tipo, gramaje, compatibleFormato, precioUnitario, stock, activo });
      res.json({ success: true, mensaje: 'Material actualizado' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  delete = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      this.service.delete(id);
      res.json({ success: true, mensaje: 'Material eliminado' });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
}