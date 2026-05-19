import { Request, Response } from 'express';
import { ProyectoService } from '../services';

export class ProyectoController {
  private service: ProyectoService;
  
  constructor() {
    this.service = new ProyectoService();
  }
  
  findAll = (req: Request, res: Response) => {
    try {
      const usuarioId = req.usuario?.id;
      const proyectos = this.service.getAll(usuarioId);
      res.json({ success: true, data: proyectos });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  findById = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const proyecto = this.service.getById(id);
      
      if (!proyecto) {
        return res.status(404).json({ success: false, mensaje: 'Proyecto no encontrado' });
      }
      
      res.json({ success: true, data: proyecto });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  create = (req: Request, res: Response) => {
    try {
      const usuarioId = req.usuario?.id;
      const { servicioId, presupuesto } = req.body;
      
      if (!usuarioId) {
        return res.status(401).json({ success: false, mensaje: 'No autorizado' });
      }
      
      const id = this.service.create({ usuarioId, servicioId, presupuesto });
      res.status(201).json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  update = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { estado, faseActual, presupuesto } = req.body;
      this.service.update(id, { estado, faseActual, presupuesto });
      res.json({ success: true, mensaje: 'Proyecto actualizado' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  getEntregas = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const entregas = this.service.getEntregas(id);
      res.json({ success: true, data: entregas });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  addEntrega = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { version, etiqueta, archivosJson, observaciones, estado } = req.body;
      const entregaId = this.service.addEntrega({ proyectoId: id, version, etiqueta, archivosJson, observaciones, estado });
      res.status(201).json({ success: true, id: entregaId });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  getPreferencias = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const preferencias = this.service.getPreferencias(id);
      res.json({ success: true, data: preferencias });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  savePreferencias = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { coloresHex, tipografias, estilo, valoresMarca, publicObjetivo, eslogan } = req.body;
      this.service.savePreferencias({ proyectoId: id, coloresHex, tipografias, estilo, valoresMarca, publicObjetivo, eslogan });
      res.json({ success: true, mensaje: 'Preferencias guardadas' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
}