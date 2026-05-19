import { Request, Response } from 'express';
import { NotificacionService } from '../services';

export class NotificacionController {
  private service: NotificacionService;
  
  constructor() {
    this.service = new NotificacionService();
  }
  
  findAll = (req: Request, res: Response) => {
    try {
      const usuarioId = req.usuario?.id;
      const notificaciones = this.service.getAll(usuarioId);
      res.json({ success: true, data: notificaciones });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  getSinLeer = (req: Request, res: Response) => {
    try {
      const usuarioId = req.usuario?.id;
      const count = this.service.getSinLeerCount(usuarioId);
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  create = (req: Request, res: Response) => {
    try {
      const { usuarioId, tipo, titulo, mensaje, referenciaId } = req.body;
      const id = this.service.create({ usuarioId, tipo, titulo, mensaje, referenciaId });
      res.status(201).json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  markAsRead = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      this.service.markAsRead(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  markAllAsRead = (req: Request, res: Response) => {
    try {
      const usuarioId = req.usuario?.id;
      this.service.markAllAsRead(usuarioId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
}