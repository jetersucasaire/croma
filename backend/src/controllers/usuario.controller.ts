import { Request, Response } from 'express';
import { UsuarioService } from '../services';

export class UsuarioController {
  private service: UsuarioService;
  
  constructor() {
    this.service = new UsuarioService();
  }
  
  findAll = (req: Request, res: Response) => {
    try {
      const activo = String(req.query.activo) !== 'false';
      const usuarios = this.service.getAll(activo);
      res.json({ success: true, data: usuarios });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  findById = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const usuario = this.service.getById(id);
      
      if (!usuario) {
        return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
      }
      
      res.json({ success: true, data: usuario });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  create = async (req: Request, res: Response) => {
    try {
      const { nombre, email, password, whatsapp, rol } = req.body;
      const id = await this.service.create({ nombre, email, password, whatsapp, rol });
      res.status(201).json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { nombre, whatsapp, rol, activo } = req.body;
      await this.service.update(id, { nombre, whatsapp, rol, activo });
      res.json({ success: true, mensaje: 'Usuario actualizado' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  delete = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      this.service.delete(id);
      res.json({ success: true, mensaje: 'Usuario eliminado' });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
}