import { Request, Response } from 'express';
import { ServicioService } from '../services';

export class ServicioController {
  private service: ServicioService;
  
  constructor() {
    this.service = new ServicioService();
  }
  
  findAll = (req: Request, res: Response) => {
    try {
      const incluirTodos = String(req.query.todos) === 'true';
      const servicios = incluirTodos
        ? this.service.getAll()
        : String(req.query.activo) === 'false'
          ? this.service.getAll(false)
          : this.service.getAll(true);
      res.json({ success: true, data: servicios });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }

  findBySlug = (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug);
      const servicio = this.service.getBySlug(slug);
      
      if (!servicio) {
        return res.status(404).json({ success: false, mensaje: 'Servicio no encontrado' });
      }
      
      res.json({ success: true, data: servicio });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  findById = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const servicio = this.service.getById(id);
      
      if (!servicio) {
        return res.status(404).json({ success: false, mensaje: 'Servicio no encontrado' });
      }
      
      res.json({ success: true, data: servicio });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  create = (req: Request, res: Response) => {
    try {
      const { nombre, slug, descripcion, icono, imagen, precioBase, unidad } = req.body;
      const id = this.service.create({ nombre, slug, descripcion, icono, imagen, precioBase, unidad });
      res.status(201).json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  update = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { nombre, slug, descripcion, icono, imagen, precioBase, unidad, activo } = req.body;
      this.service.update(id, { nombre, slug, descripcion, icono, imagen, precioBase, unidad, activo });
      res.json({ success: true, mensaje: 'Servicio actualizado' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  delete = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      this.service.delete(id);
      res.json({ success: true, mensaje: 'Servicio eliminado' });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  getPortafolio = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const portafolio = this.service.getPortafolio(id);
      res.json({ success: true, data: portafolio });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  addPortafolio = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { titulo, descripcion, url_imagen, es_portada } = req.body;
      const itemId = this.service.addPortafolio({ servicioId: id, titulo, descripcion, urlImagen: url_imagen, esPortada: es_portada });
      res.status(201).json({ success: true, id: itemId });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  deletePortafolio = (req: Request, res: Response) => {
    try {
      const itemId = parseInt(String(req.params.itemId));
      this.service.deletePortafolio(itemId);
      res.json({ success: true, mensaje: 'Eliminado' });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
}