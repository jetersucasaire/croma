import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

declare global {
  namespace Express {
    interface Request {
      id: string;
      logger: ReturnType<typeof logger.child>;
    }
  }
}

export function requestId(req: Request, _res: Response, next: NextFunction) {
  req.id = (req.headers['x-request-id'] as string) || uuidv4();
  req.logger = logger.child({ 
    requestId: req.id, 
    method: req.method, 
    url: req.url 
  });
  next();
}

export class AppError extends Error {
  constructor(public statusCode: number, message: string, public code?: string) {
    super(message);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    req.logger.warn({ error: err.message, code: err.code }, 'App error');
    return res.status(err.statusCode).json({ 
      success: false, 
      mensaje: err.message,
      code: err.code 
    });
  }

  req.logger.error({ error: err.message, stack: err.stack }, 'Internal error');
  
  res.status(500).json({ 
    success: false, 
    mensaje: 'Error interno del servidor',
    code: 'INTERNAL_ERROR'
  });
}

export function notFoundHandler(req: Request, res: Response) {
  req.logger.warn({ path: req.path }, 'Route not found');
  res.status(404).json({ 
    success: false, 
    mensaje: 'Ruta no encontrada',
    code: 'NOT_FOUND'
  });
}