import { Request, Response } from 'express';
import { MensajeService } from '../services';

export class MensajeController {
  private service: MensajeService;
  
  constructor() {
    this.service = new MensajeService();
  }
  
  findByPedido = (req: Request, res: Response) => {
    try {
      const pedidoId = parseInt(String(req.params.pedidoId));
      const mensajes = this.service.getByPedido(pedidoId);
      res.json({ success: true, data: mensajes });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  create = (req: Request, res: Response) => {
    try {
      const pedidoId = parseInt(String(req.params.pedidoId));
      const remitenteId = req.usuario?.id;
      const { contenido, tipo } = req.body;
      const id = this.service.create({ pedidoId, remitenteId, contenido, tipo });
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
  
  getHistorial = (req: Request, res: Response) => {
    try {
      const pedidoId = parseInt(String(req.params.pedidoId));
      const historial = this.service.getHistorial(pedidoId);
      res.json({ success: true, data: historial });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
}