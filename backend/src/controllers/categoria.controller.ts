import { Request, Response } from 'express';
import { CategoriaService } from '../services';

export class CategoriaController {
  private service: CategoriaService;
  
  constructor() {
    this.service = new CategoriaService();
  }
  
  findAll = (req: Request, res: Response) => {
    try {
      const servicioId = req.query.servicio_id ? parseInt(String(req.query.servicio_id)) : undefined;
      const activo = String(req.query.activo) !== 'false';
      const categorias = this.service.getAll(servicioId, activo);
      res.json({ success: true, data: categorias });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  findById = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const categoria = this.service.getById(id);
      
      if (!categoria) {
        return res.status(404).json({ success: false, mensaje: 'Categoría no encontrada' });
      }
      
      res.json({ success: true, data: categoria });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  create = (req: Request, res: Response) => {
    try {
      const { servicioId, nombre, icono } = req.body;
      const id = this.service.create({ servicioId, nombre, icono });
      res.status(201).json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  update = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { nombre, icono, activo } = req.body;
      this.service.update(id, { nombre, icono, activo });
      res.json({ success: true, mensaje: 'Categoría actualizada' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  delete = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      this.service.delete(id);
      res.json({ success: true, mensaje: 'Categoría eliminada' });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
}