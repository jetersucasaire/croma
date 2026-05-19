import { Request, Response } from 'express';
import { ArmazonService } from '../services';

export class ArmazonController {
  private service: ArmazonService;
  
  constructor() {
    this.service = new ArmazonService();
  }
  
  findAll = (req: Request, res: Response) => {
    try {
      const mecanismo = String(req.query.mecanismo) as string;
      const activo = String(req.query.activo) !== 'false';
      const armazones = this.service.getAll(mecanismo, activo);
      res.json({ success: true, data: armazones });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  findById = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const armazon = this.service.getById(id);
      
      if (!armazon) {
        return res.status(404).json({ success: false, mensaje: 'Armazón no encontrado' });
      }
      
      res.json({ success: true, data: armazon });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  create = (req: Request, res: Response) => {
    try {
      const { nombre, mecanismo, forma, dimensionesMax, precio, stock } = req.body;
      const id = this.service.create({ nombre, mecanismo, forma, dimensionesMax, precio, stock });
      res.status(201).json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  update = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { nombre, mecanismo, forma, dimensionesMax, precio, stock, activo } = req.body;
      this.service.update(id, { nombre, mecanismo, forma, dimensionesMax, precio, stock, activo });
      res.json({ success: true, mensaje: 'Armazón actualizado' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  delete = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      this.service.delete(id);
      res.json({ success: true, mensaje: 'Armazón eliminado' });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
}