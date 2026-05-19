import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface UsuarioToken {
  id: number;
  uuid: string;
  nombre: string;
  email: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, mensaje: 'No autorizado' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as UsuarioToken;
    req.usuario = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, mensaje: 'Token inválido' });
  }
}

export function opcionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.usuario = undefined;
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as UsuarioToken;
    req.usuario = decoded;
  } catch {
    req.usuario = undefined;
  }
  next();
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ success: false, mensaje: 'Acceso denegado' });
  }
  next();
}

export function adminOrDiseniador(req: Request, res: Response, next: NextFunction) {
  if (!req.usuario || (req.usuario.rol !== 'admin' && req.usuario.rol !== 'diseniador')) {
    return res.status(403).json({ success: false, mensaje: 'Acceso denegado' });
  }
  next();
}