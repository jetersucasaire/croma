import { Request, Response } from 'express';
import { ArchivoService } from '../services';

export class ArchivoController {
  private service: ArchivoService;
  
  constructor() {
    this.service = new ArchivoService();
  }
  
  findAll = (req: Request, res: Response) => {
    try {
      const usuarioId = req.usuario?.id;
      const archivos = this.service.getAll(usuarioId);
      res.json({ success: true, data: archivos });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  findById = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const archivo = this.service.getById(id);
      
      if (!archivo) {
        return res.status(404).json({ success: false, mensaje: 'Archivo no encontrado' });
      }
      
      res.json({ success: true, data: archivo });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  create = (req: Request, res: Response) => {
    try {
      const usuarioId = req.usuario?.id || 0;
      const { nombre, url, formato, tamano } = req.body;
      const id = this.service.create({ usuarioId, nombre, url, formato, tamano });
      res.status(201).json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  delete = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      this.service.delete(id);
      res.json({ success: true, mensaje: 'Archivo eliminado' });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  findByPedido = (req: Request, res: Response) => {
    try {
      const pedidoId = parseInt(String(req.params.pedidoId));
      const archivos = this.service.getByPedido(pedidoId);
      res.json({ success: true, data: archivos });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
}