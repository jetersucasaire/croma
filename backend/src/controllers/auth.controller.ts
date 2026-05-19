import { Request, Response } from 'express';
import { AuthService } from '../services';

export class AuthController {
  private service: AuthService;
  
  constructor() {
    this.service = new AuthService();
  }
  
  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, mensaje: 'Faltan credenciales' });
      }
      
      const result = await this.service.login(email, password);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(401).json({ success: false, mensaje: error.message });
    }
  }
  
  register = async (req: Request, res: Response) => {
    try {
      const { nombre, email, password, whatsapp } = req.body;
      
      if (!nombre || !email || !password) {
        return res.status(400).json({ success: false, mensaje: 'Faltan datos requeridos' });
      }
      
      const result = await this.service.register(nombre, email, password, whatsapp);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  me = (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, mensaje: 'No autorizado' });
      }
      
      const token = authHeader.substring(7);
      const usuario = this.service.getUsuarioFromToken(token);
      
      if (!usuario) {
        return res.status(401).json({ success: false, mensaje: 'Token inválido' });
      }
      
      res.json({ success: true, data: usuario });
    } catch (error: any) {
      res.status(401).json({ success: false, mensaje: 'Token inválido' });
    }
  }
  
  olvidarContrasena = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ success: false, mensaje: 'El correo electrónico es requerido' });
      }
      
      await this.service.solicitarRestablecerContrasena(email);
      
      res.json({ 
        success: true, 
        mensaje: 'Si el correo electrónico está registrado en nuestro sistema, recibirás instrucciones.' 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  restablecerContrasena = async (req: Request, res: Response) => {
    try {
      const { token, nuevaContrasena } = req.body;
      
      if (!token || !nuevaContrasena) {
        return res.status(400).json({ success: false, mensaje: 'Token y nueva contraseña son requeridos' });
      }
      
      await this.service.restablecerContrasena(token, nuevaContrasena);
      res.json({ success: true, mensaje: 'Contraseña actualizada correctamente' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
}